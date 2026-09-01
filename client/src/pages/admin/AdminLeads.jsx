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
const STATUS_LIST = ['New Lead', 'Follow Up', 'Demo Online', 'Demo Offline', 'Conversion', 'Closed'];
const CONTACT_AVAIL = ['Yes', 'No'];

const STATUS_COLOR = {
  'New Lead':    { bg: 'rgba(173,255,47,0.12)',  color: '#adff2f' },
  'Follow Up':   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
  'Demo Online': { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
  'Demo Offline':{ bg: 'rgba(56,189,248,0.12)',  color: '#38bdf8' },
  'Conversion':  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  'Closed':      { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
};

const normalizeStatus = (status) => {
  if (!status) return 'New Lead';
  const value = String(status).trim();
  if (/^new$/i.test(value)) return 'New Lead';
  if (/follow/i.test(value)) return 'Follow Up';
  if (/demo.*online/i.test(value) || (value === 'Demo Scheduled' )) return 'Demo Online'; // fallback for old DB values handled in getStatusLabel
  if (/demo.*offline/i.test(value)) return 'Demo Offline';
  if (/demo/i.test(value)) return 'Demo Online'; // generic demo → online
  if (/convert/i.test(value)) return 'Conversion';
  if (/close/i.test(value)) return 'Closed';
  return value;
};

const getStatusLabel = (lead) => {
  const raw = String(lead.status || '').trim();
  // Handle legacy DB value 'Demo Scheduled' by checking leadType
  if (raw === 'Demo Scheduled') {
    return lead.leadType === 'Online' ? 'Demo Online' : 'Demo Offline';
  }
  return normalizeStatus(raw);
};

const matchStatusFilter = (lead, filter) => {
  if (!filter) return true;
  return getStatusLabel(lead) === filter;
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

  const handleAutoFetch = async (val) => {
    const targetSNo = val || fetchSNo;
    if (!targetSNo) return;
    setPlacesLoading(true);
    try {
      const { data: p } = await API.get(`/leads/lookup/${targetSNo}`);
      if (p) {
        setForm(f => ({
          ...f,
          name:            p.sportsPlaceName || p.name || '',
          sportsPlaceName: p.sportsPlaceName || p.name || '',
          phone:           p.phone || '',
          category:        p.category || '',
          district:        p.district || '',
          sno:             p.sno || targetSNo,
          location:        { address: p.location?.address || p.displayAddress || p.address || '' },
          contactAvailability: p.contactAvailability || 'Yes',
        }));
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // Only alert for manual fetch, maybe? 
        // If it's auto fetch on blur, we should be quiet unless it's a manual click?
        // Let's alert for now.
        alert('No record found with that R.No');
      } else {
        alert('Error fetching data');
      }
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleQuickFetch = () => handleAutoFetch(fetchSNo);

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

      if (payload.status === 'Demo Online') {
        payload.leadType = 'Online';
        payload.status = 'Demo Scheduled';
      } else if (payload.status === 'Demo Offline') {
        payload.leadType = 'Offline';
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
    if (!confirm('Permanently delete this lead? This action cannot be undone.')) return;
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
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {totalLeads.toLocaleString('en-IN')} total leads
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" title="Sync Excel" onClick={handleSync}><RefreshCw size={16} /></button>
          <button className="btn-secondary" title="Import" onClick={() => navigate('/admin/import')}><FileSpreadsheet size={16} /></button>
          <button className="btn-secondary" title="Export" onClick={() => exportCSV(leads)}><Download size={16} /></button>
          <button className="btn-danger" title="Delete All" style={{ padding: '8px 12px' }}
            onClick={() => { setDeleteConfirmText(''); setShowDeleteAll(true); }}>
            <Trash2 size={16} />
          </button>
          <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Lead</button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="glass filter-bar">
        <div style={{ position: 'relative', flex: 2, width: '100%' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
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
        <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
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
          const isActive = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(isActive ? '' : s)}
              style={{
                whiteSpace: 'nowrap',
                background: isActive ? bg : 'var(--bg-surface)',
                color: isActive ? color : 'var(--text-muted)',
                border: `1px solid ${isActive ? color : 'var(--border)'}`,
                borderRadius: 20, padding: '0 14px', height: 28, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
              }}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="glass table-wrapper" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* Mobile Card View */}
            <div style={{ display: 'none' }} className="leads-mobile-cards">
              {leads.map((lead) => {
                const statusLabel = getStatusLabel(lead);
                const sc = STATUS_COLOR[statusLabel] || STATUS_COLOR[normalizeStatus(lead.status)] || {};
                return (
                  <div key={lead._id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.sportsPlaceName || lead.name}
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', background: sc.bg, color: sc.color, flexShrink: 0 }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {lead.district && <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{lead.district}</span>}
                      {lead.category && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>{lead.category}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Phone size={12} color="var(--primary)" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{lead.phone}</span>
                    </div>
                    {lead.location?.address && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.location.address}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.assignedTo?.name || 'Unassigned'}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <WhatsAppButton phone={lead.phone} name={lead.name} />
                        <button onClick={() => openEdit(lead)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#818cf8', display: 'flex', alignItems: 'center' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(lead._id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <table className="data-table leads-desktop-table" style={{ width: '100%', minWidth: 900 }}>
  
              <thead>
                <tr>
                  <th>R.No</th>
                  <th>Name / Place</th>
                  <th>District</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Avail.</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    No leads found. Click <strong style={{ color: '#adff2f' }}>+ Add Lead</strong> to create one.
                  </td></tr>
                ) : leads.map((lead, idx) => {
                  const statusLabel = getStatusLabel(lead);
                  const sc = STATUS_COLOR[statusLabel] || STATUS_COLOR[normalizeStatus(lead.status)] || {};
                  return (
                    <tr key={lead._id}>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{lead.sno || idx + 1}</td>
                      <td
                        title={lead.sportsPlaceName || lead.name}
                        style={{
                          fontWeight: 600, fontSize: 13,
                          maxWidth: 0, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'default'
                        }}
                      >
                        {lead.sportsPlaceName || lead.name}
                      </td>
                      <td>
                        {lead.district ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 20, padding: '0 8px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', fontSize: 11, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap' }} title={lead.district}>
                            {lead.district}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {lead.category ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 20, padding: '0 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', fontSize: 11, fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap' }} title={lead.category}>
                            {lead.category}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }} title={lead.phone}>
                          <Phone size={11} color="#64748b" /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.phone}</span>
                        </span>
                      </td>
                      <td
                        title={lead.location?.address || ''}
                        style={{
                          fontSize: 12, color: '#94a3b8',
                          maxWidth: 0, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: lead.location?.address ? 'help' : 'default'
                        }}
                      >
                        {lead.location?.address || '—'}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 22, padding: '0 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1,
                          background: lead.contactAvailability === 'No' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                          color: lead.contactAvailability === 'No' ? '#f87171' : '#10b981'
                        }}>
                          {lead.contactAvailability || 'Yes'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 22, padding: '0 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: sc.bg, color: sc.color, lineHeight: 1, verticalAlign: 'middle' }} title={statusLabel}>
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }}
                        title={lead.assignedTo?.name || 'Unassigned'}>
                        {lead.assignedTo?.name || <span style={{ color: '#475569' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <WhatsAppButton phone={lead.phone} name={lead.name} />
                          <button onClick={() => openEdit(lead)}
                            title="Edit"
                            style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#818cf8', display:'flex', alignItems:'center' }}>
                            <Edit2 size={13} />
                          </button>
                          {lead.status !== 'Converted' && (
                            <button onClick={() => handleConvert(lead._id)}
                              title="Mark Converted"
                              style={{ background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#10b981', display:'flex', alignItems:'center' }}>
                              <UserCheck size={13} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(lead._id)}
                            title="Delete"
                            style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#f87171', display:'flex', alignItems:'center' }}>
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
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-window"
            style={{ maxWidth: 820 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                {editLead ? '✏️ Edit Lead' : '➕ Add New Lead'}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
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
                  <input 
                    className="form-input" 
                    value={form.sno}
                    onChange={e => setForm(f => ({ ...f, sno: e.target.value }))}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val && !editLead) {
                        setFetchSNo(val);
                        handleAutoFetch(val);
                      }
                    }}
                    placeholder="R.No" 
                  />
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
                <div style={{ gridColumn: '1 / -1', marginBottom: 4 }}>
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, sportsPlaceName: e.target.value }))}
                    required placeholder="Enter name" />
                </div>

                {/* Address — directly below Name, minimal gap */}
                <div style={{ gridColumn: '1 / -1', marginTop: 0 }}>
                  <label className="form-label">Address</label>
                  <input
                    className="form-input"
                    value={form.location.address}
                    onChange={e => setForm(f => ({ ...f, location: { address: e.target.value } }))}
                    placeholder="Full address"
                    title={form.location.address}
                    style={{ cursor: form.location.address ? 'help' : 'text' }}
                  />
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
        <div className="modal-overlay" onClick={() => setShowDeleteAll(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: 440, border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <AlertTriangle size={26} color="#f87171" />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: '#f87171', marginBottom: 8 }}>Delete ALL Leads?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                This will permanently delete <strong style={{ color: 'var(--text-primary)' }}>{totalLeads.toLocaleString('en-IN')} leads</strong> from the database. This action <strong style={{ color: '#f87171' }}>cannot be undone</strong>.
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#f87171', marginBottom: 6 }}>
                Type <strong>DELETE ALL</strong> to confirm
              </label>
              <input
                className="form-input"
                style={{ border: `1px solid ${deleteConfirmText === 'DELETE ALL' ? '#f87171' : 'var(--border)'}` }}
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
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
