import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import {
  Plus, Search, UserCheck, Trash2, Edit2, Phone, MapPin,
  FileSpreadsheet, RefreshCw, Download, X, AlertTriangle
} from 'lucide-react';
import WhatsAppButton from '../../components/WhatsAppButton';

/* ─── constants ──────────────────────────────────────────────── */
const STATUS_LIST = ['New Lead', 'Follow Up', 'Demo Scheduled (Online)', 'Demo Scheduled (Offline)', 'Conversion', 'Closed'];
const CONTACT_AVAIL = ['Yes', 'No'];

const STATUS_COLOR = {
  'New Lead':                    { bg: 'rgba(173,255,47,0.12)',  color: '#adff2f' },
  'Follow Up':                   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
  'Demo Scheduled (Online)':     { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
  'Demo Scheduled (Offline)':    { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
  'Conversion':                  { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  'Closed':                      { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
};

const normalizeStatus = (status) => {
  if (!status) return 'New Lead';
  const value = String(status).trim();
  if (/^new$/i.test(value)) return 'New Lead';
  if (/follow/i.test(value)) return 'Follow Up';
  if (/demo/i.test(value)) return 'Demo Scheduled';
  if (/convert/i.test(value)) return 'Conversion';
  if (/close/i.test(value)) return 'Closed';
  return value;
};

const getStatusLabel = (lead) => {
  const status = normalizeStatus(lead.status);
  if (status === 'Demo Scheduled') {
    return `Demo Scheduled (${lead.leadType || 'Offline'})`;
  }
  return status;
};

const matchStatusFilter = (lead, filter) => {
  if (!filter) return true;
  const status = normalizeStatus(lead.status);
  if (filter.startsWith('Demo Scheduled')) {
    return status === 'Demo Scheduled' && getStatusLabel(lead) === filter;
  }
  return status === filter;
};

const EMPTY_FORM = {
  sno: '', name: '', phone: '', email: '',
  district: '', sportsPlaceName: '',
  category: '',
  location: { address: '' },
  status: 'New Lead', leadType: 'Offline',
  contactAvailability: 'Yes',
  assignedTo: '', notes: '',
  source: 'field', followUpDate: '',
  date: new Date().toISOString().slice(0, 10),
};

const CATEGORIES = [
  'Turf', 'Football', 'Cricket', 'Sport hub/club', 'Tennis', 'Hockey',
  'BasketBall', 'Volleyball', 'Badmitton', 'Academy', 'Play Ground',
  'Chess', 'School/Class/Badminton', 'Skating', 'Swimming', 'Soapy Football', 'Other',
];

const exportCSV = (rows) => {
  const cols = ['R.No', 'Name', 'District', 'Category', 'Place', 'Phone', 'Contact Available', 'Status', 'Assigned To'];
  const lines = [cols.join(',')];
  rows.forEach((r, i) => {
    lines.push([
      r.sno || i + 1, `"${r.sportsPlaceName || r.name}"`,
      r.district || '', r.category || '',
      `"${r.location?.address || ''}"`, r.phone || '',
      r.contactAvailability || 'Yes', r.status,
      r.assignedTo?.name || 'Unassigned'
    ].join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `leads_${Date.now()}.csv`;
  a.click();
};

export default function AdminLeads() {
  const navigate = useNavigate();

  /* data */
  const [leads, setLeads]         = useState([]);
  const [employees, setEmployees] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces]       = useState([]);
  const [loading, setLoading]     = useState(true);

  /* filters */
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  /* pagination */
  const [page, setPage]       = useState(1);
  const limit                 = 100;
  const [totalLeads, setTotalLeads] = useState(0);
  const totalPages = Math.ceil(totalLeads / limit);

  /* modal states */
  const [showModal, setShowModal]   = useState(false);
  const [editLead, setEditLead]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedPlaceId, setSelectedPlaceId]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [fetchSNo, setFetchSNo] = useState('');
  const [allLocations, setAllLocations] = useState([]);

  /* bulk */
  const [selectedIds, setSelectedIds] = useState([]);

  /* delete-all confirm */
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  /* ── fetch leads ─────────────────────────────────────────── */
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filterStatus) {
        params.status = filterStatus.startsWith('Demo Scheduled') ? 'Demo Scheduled' : filterStatus;
      }
      if (filterDistrict) params.district = filterDistrict;
      if (search)         params.search   = search;
      const { data } = await API.get('/leads', { params });
      const arr = Array.isArray(data) ? data : (data.leads || []);
      setLeads(arr);
      setTotalLeads(Array.isArray(data) ? arr.length : (data.total || arr.length));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filterStatus, filterDistrict, search, page, limit]);

  useEffect(() => { setPage(1); }, [filterStatus, filterDistrict]);
  useEffect(() => { fetchLeads(); }, [filterStatus, filterDistrict, page]);
  useEffect(() => { setSelectedIds([]); }, [leads]);

  /* fetch employees + districts on mount */
  useEffect(() => {
    API.get('/users?role=employee')
      .then(r => setEmployees(r.data || []))
      .catch(() => {});
    API.get('/leads/districts')
      .then(r => setDistricts(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
  if (showModal || showDeleteAll) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }

  return () => {
    document.body.classList.remove('modal-open');
  };
}, [showModal, showDeleteAll]);

  /* ── modal district change ───────────────────────────────── */
  const handleDistrictChange = async (d) => {
    setSelectedDistrict(d);
    setSelectedPlaceId('');
    setForm(f => ({ ...f, district: d, sportsPlaceName: '', phone: '', category: '', location: { address: '' } }));
    if (!d) { setPlaces([]); return; }
    setPlacesLoading(true);
    try {
      const { data } = await API.get(`/leads/places/${encodeURIComponent(d)}`);
      setPlaces(data || []);
    } catch (err) { console.error(err); setPlaces([]); }
    finally { setPlacesLoading(false); }
  };

  const handlePlaceChange = (placeId) => {
    setSelectedPlaceId(placeId);
    const p = places.find(x => x._id === placeId);
    if (p) {
      setForm(f => ({
        ...f,
        name:            p.sportsPlaceName || p.name || '',
        sportsPlaceName: p.sportsPlaceName || p.name || '',
        phone:           p.phone || '',
        category:        p.category || '',
        sno:             p.sno || '',
        location:        { address: p.location?.address || '' },
        contactAvailability: p.contactAvailability || 'Yes',
      }));
    }
  };

  const handleQuickFetch = async () => {
    if (!fetchSNo) return;
    setPlacesLoading(true);
    try {
      let locations = allLocations;
      if (locations.length === 0) {
        const { data } = await API.get('/leads/locations');
        locations = (data || []).map((item, index) => ({ ...item, rNo: String(11110001 + index) }));
        setAllLocations(locations);
      }
      
      const p = locations.find(l => l.rNo === fetchSNo || l.sno === fetchSNo);
      if (p) {
        setForm(f => ({
          ...f,
          name:            p.sportsPlaceName || p.name || '',
          sportsPlaceName: p.sportsPlaceName || p.name || '',
          phone:           p.phone || '',
          category:        p.category || '',
          district:        p.district || '',
          sno:             p.rNo || p.sno || fetchSNo,
          location:        { address: p.location?.address || p.displayAddress || p.address || '' },
          contactAvailability: p.contactAvailability || 'Yes',
        }));
      } else {
        alert('No record found with that R.No');
      }
    } catch { 
      alert('Error fetching data'); 
    } finally { 
      setPlacesLoading(false); 
    }
  };

  /* ── open / close modal ──────────────────────────────────── */
  const openAdd = () => {
    setEditLead(null);
    setForm(EMPTY_FORM);
    setSelectedDistrict('');
    setSelectedPlaceId('');
    setPlaces([]);
    setFetchSNo('');
    setIsManualEntry(false);
    setShowModal(true);
  };

  const openEdit = (lead) => {
    setEditLead(lead);
    setForm({
      sno:             lead.sno || '',
      name:            lead.name || '',
      phone:           lead.phone || '',
      email:           lead.email || '',
      district:        lead.district || '',
      sportsPlaceName: lead.sportsPlaceName || '',
      category:        lead.category || '',
      location:        { address: lead.location?.address || '' },
      status:          getStatusLabel(lead),
      leadType:        lead.leadType || 'Offline',
      contactAvailability: lead.contactAvailability || 'Yes',
      assignedTo:      lead.assignedTo?._id || '',
      notes:           lead.notes || '',
      source:          lead.source || 'field',
      followUpDate:    lead.followUpDate ? lead.followUpDate.slice(0, 10) : '',
      date:            lead.createdAt ? lead.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setSelectedDistrict('');
    setSelectedPlaceId('');
    setPlaces([]);
    setIsManualEntry(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditLead(null);
    setForm(EMPTY_FORM);
    setSelectedDistrict('');
    setSelectedPlaceId('');
    setPlaces([]);
  };

  /* ── submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Name / Place Name is required.'); return; }
    if (!form.phone.trim()) { alert('Contact number is required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.sportsPlaceName) payload.sportsPlaceName = payload.name;
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.followUpDate) delete payload.followUpDate;

      if (payload.status.startsWith('Demo Scheduled')) {
        payload.leadType = payload.status.includes('Online') ? 'Online' : 'Offline';
        payload.status = 'Demo Scheduled';
      } else if (payload.status === 'Follow Up') {
        payload.status = 'Follow Up';
      } else if (payload.status === 'Conversion') {
        payload.status = 'Conversion';
      } else if (payload.status === 'Closed') {
        payload.status = 'Closed';
      } else {
        payload.status = 'New Lead';
      }

      if (editLead) {
        await API.put(`/leads/${editLead._id}`, payload);
      } else {
        await API.post('/leads', payload);
      }
      closeModal();
      fetchLeads();
      API.get('/leads/districts').then(r => setDistricts(r.data || [])).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save lead');
    } finally { setSaving(false); }
  };

  /* ── delete single ───────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await API.delete(`/leads/${id}`);
    fetchLeads();
  };

  /* ── delete all ──────────────────────────────────────────── */
  const handleDeleteAll = async () => {
    if (deleteConfirmText !== 'DELETE ALL') {
      alert('Type DELETE ALL to confirm');
      return;
    }
    setDeleting(true);
    try {
      await API.delete('/leads/delete-all');
      setShowDeleteAll(false);
      setDeleteConfirmText('');
      fetchLeads();
      API.get('/leads/districts').then(r => setDistricts(r.data || [])).catch(() => {});
      alert('All leads have been deleted.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete all leads');
    } finally { setDeleting(false); }
  };

  /* ── convert ─────────────────────────────────────────────── */
  const handleConvert = async (id) => {
    if (!confirm('Mark as Converted?')) return;
    try {
      await API.put(`/leads/${id}`, { status: 'Converted' });
      fetchLeads();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  /* ── sync ────────────────────────────────────────────────── */
  const handleSync = async () => {
    if (!confirm('Sync with local Excel file on the server?')) return;
    try {
      const { data } = await API.post('/import/sync');
      alert(`Sync Complete!\nCreated: ${data.created}\nUpdated: ${data.updated}\nTotal: ${data.total}`);
      fetchLeads();
      API.get('/leads/districts').then(r => setDistricts(r.data || [])).catch(() => {});
    } catch { alert('Sync failed — check server console.'); }
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <Layout title="Lead Management">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Lead Pipeline</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {totalLeads.toLocaleString('en-IN')} total leads
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={handleSync}>
            <RefreshCw size={15} /> <span className="mobile-hide">Sync Excel</span>
          </button>
          <button className="btn-secondary" onClick={() => navigate('/admin/import')}>
            <FileSpreadsheet size={15} /> <span className="mobile-hide">Import</span>
          </button>
          <button className="btn-secondary" onClick={() => exportCSV(leads)}>
            <Download size={15} /> <span className="mobile-hide">Export</span>
          </button>
          <button className="btn-danger" style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={() => { setDeleteConfirmText(''); setShowDeleteAll(true); }}>
            <Trash2 size={15} /> <span className="mobile-hide">Delete All</span>
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="glass filter-bar">
        <div style={{ position: 'relative', flex: 2, width: '100%' }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search name, district, phone, place…"
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchLeads(); } }} />
        </div>
        <select className="form-input filter-select" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="form-input filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
           <span>{leads.length} of {totalLeads.toLocaleString('en-IN')}</span>
           {(search || filterStatus || filterDistrict) && (
              <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11 }}
                onClick={() => { setSearch(''); setFilterStatus(''); setFilterDistrict(''); setPage(1); }}>
                <X size={12} /> Clear
              </button>
            )}
        </div>
      </div>

      {/* ── Status pills ── */}
      <div className="status-pills">
        {STATUS_LIST.map(s => {
          const count = leads.filter(l => matchStatusFilter(l, s)).length;
          const { bg, color } = STATUS_COLOR[s] || {};
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{
                whiteSpace: 'nowrap',
                background: filterStatus === s ? bg : 'rgba(255,255,255,0.04)',
                color: filterStatus === s ? color : '#64748b',
                border: `1px solid ${filterStatus === s ? color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '6px 16px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
              }}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="glass table-wrapper">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" style={{ accentColor: '#adff2f' }}
                      checked={selectedIds.length === leads.length && leads.length > 0}
                      onChange={e => setSelectedIds(e.target.checked ? leads.map(l => l._id) : [])} />
                  </th>
                  <th>R.No</th>
                  <th>Name / Sports Place</th>
                  <th>District</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Place / Address</th>
                  <th>Contact Avail.</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    No leads found. Click <strong style={{ color: '#adff2f' }}>+ Add Lead</strong> to create one.
                  </td></tr>
                ) : leads.map((lead, idx) => {
                  const statusLabel = getStatusLabel(lead);
                  const sc = STATUS_COLOR[statusLabel] || STATUS_COLOR[normalizeStatus(lead.status)] || {};
                  return (
                    <tr key={lead._id} style={{ background: selectedIds.includes(lead._id) ? 'rgba(173,255,47,0.04)' : undefined }}>
                      <td>
                        <input type="checkbox" style={{ accentColor: '#adff2f' }}
                          checked={selectedIds.includes(lead._id)}
                          onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, lead._id] : prev.filter(id => id !== lead._id))} />
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{lead.sno || idx + 1}</td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>
                        {lead.sportsPlaceName || lead.name}
                        {lead.sportsPlaceName && lead.sportsPlaceName !== lead.name && (
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{lead.name}</div>
                        )}
                      </td>
                      <td>
                        {lead.district ? (
                          <span style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            {lead.district}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {lead.category ? (
                          <span style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                            {lead.category}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                          <Phone size={11} color="#64748b" /> {lead.phone}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#94a3b8', maxWidth: 200 }}>
                        {lead.location?.address ? (
                          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                            <MapPin size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                            <span style={{ lineHeight: 1.4 }}>{lead.location.address}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span style={{
                          background: lead.contactAvailability === 'No' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                          color: lead.contactAvailability === 'No' ? '#f87171' : '#10b981',
                          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700
                        }}>
                          {lead.contactAvailability || 'Yes'}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {lead.assignedTo?.name || <span style={{ color: '#475569', fontSize: 12 }}>Unassigned</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <WhatsAppButton phone={lead.phone} name={lead.name} />
                          <button onClick={() => openEdit(lead)}
                            title="Edit"
                            style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#818cf8' }}>
                            <Edit2 size={13} />
                          </button>
                          {lead.status !== 'Converted' && (
                            <button onClick={() => handleConvert(lead._id)}
                              title="Mark Converted"
                              style={{ background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#10b981' }}>
                              <UserCheck size={13} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(lead._id)}
                            title="Delete"
                            style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#f87171' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn-secondary" style={{ padding: '6px 14px' }}
              disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Page <strong style={{ color: '#f1f5f9' }}>{page}</strong> of {totalPages}
            </span>
            <button className="btn-secondary" style={{ padding: '6px 14px' }}
              disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── ADD / EDIT LEAD MODAL ── */}
      {showModal && (
        <div
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 999999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflowY: 'auto',
    padding: '20px',
  }}
  onClick={(e) => e.target === e.currentTarget && closeModal()}
>
          <div style={{
            background: '#16162a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20,
            padding: 32,
            width: '100%', maxWidth: 780,
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
          }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>
                {editLead ? '✏️ Edit Lead' : '➕ Add New Lead'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Fetch (only on Add) */}
            {!editLead && (
              <div style={{ background: 'rgba(173,255,47,0.04)', border: '1px solid rgba(173,255,47,0.15)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#adff2f', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                  ⚡ Quick Fetch from Database
                </p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Enter R.No (e.g. 11110001)</label>
                    <input className="form-input" value={fetchSNo} onChange={e => setFetchSNo(e.target.value)} placeholder="11110001" />
                  </div>
                  <button type="button" className="btn-primary" onClick={handleQuickFetch} disabled={placesLoading} style={{ padding: '9px 20px', height: 42 }}>
                    {placesLoading ? '...' : 'Fetch'}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid-cols-2">
                {/* R.No */}
                <div className="mobile-col-span-2">
                  <label className="form-label">R.No</label>
                  <input className="form-input" value={form.sno}
                    onChange={e => setForm(f => ({ ...f, sno: e.target.value }))}
                    placeholder="R.No" />
                </div>

                {/* Date */}
                <div className="mobile-col-span-2">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>

                {/* District */}
                <div className="mobile-col-span-2">
                  <label className="form-label">District *</label>
                  <select className="form-input" value={form.district}
                    onChange={e => setForm(f => ({ ...f, district: e.target.value }))} required>
                    <option value="">Select</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div className="mobile-col-span-2">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, sportsPlaceName: e.target.value }))}
                    required placeholder="Enter name" />
                </div>

                {/* Phone */}
                <div className="mobile-col-span-2">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone number" />
                </div>

                {/* Assign Employee */}
                <div className="mobile-col-span-2">
                  <label className="form-label">Assign Employee</label>
                  <select className="form-input" value={form.assignedTo}
                    onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.location.address}
                    onChange={e => setForm(f => ({ ...f, location: { address: e.target.value } }))}
                    placeholder="Full address" />
                </div>

                {/* Status */}
                <div className="mobile-col-span-2">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Follow Up Date */}
                <div className="mobile-col-span-2">
                  <label className="form-label">Follow Up Date</label>
                  <input type="date" className="form-input" value={form.followUpDate}
                    onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
                </div>

                {/* Notes */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={3} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Enter notes..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <button type="submit" className="btn-primary" disabled={saving}
                  style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editLead ? 'Update Lead' : '✓ Create Lead'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeModal}
                  style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE ALL CONFIRMATION MODAL ── */}
      {showDeleteAll && (
        <div
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 999999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflowY: 'auto',
    padding: '20px',
  }}
  onClick={(e) => e.target === e.currentTarget && closeModal()}
>
          <div style={{
            background: '#16162a',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 20,
            padding: 32,
            width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <AlertTriangle size={26} color="#f87171" />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: '#f87171', marginBottom: 8 }}>Delete ALL Leads?</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                This will permanently delete <strong style={{ color: '#f1f5f9' }}>{totalLeads.toLocaleString('en-IN')} leads</strong> from the database. This action <strong style={{ color: '#f87171' }}>cannot be undone</strong>.
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#f87171', marginBottom: 6 }}>
                Type <strong>DELETE ALL</strong> to confirm
              </label>
              <input
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${deleteConfirmText === 'DELETE ALL' ? '#f87171' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '11px 16px', color: '#f1f5f9', fontSize: 14, outline: 'none' }}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE ALL"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                disabled={deleteConfirmText !== 'DELETE ALL' || deleting}
                onClick={handleDeleteAll}
                style={{
                  flex: 1, background: deleteConfirmText === 'DELETE ALL' ? '#ef4444' : 'rgba(239,68,68,0.2)',
                  color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0',
                  fontWeight: 700, cursor: deleteConfirmText === 'DELETE ALL' ? 'pointer' : 'not-allowed',
                  opacity: deleting ? 0.6 : 1, fontSize: 14,
                }}>
                {deleting ? 'Deleting…' : '🗑 Delete All Leads'}
              </button>
              <button
                onClick={() => { setShowDeleteAll(false); setDeleteConfirmText(''); }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 0', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
