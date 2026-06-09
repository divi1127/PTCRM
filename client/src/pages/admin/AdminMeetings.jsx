import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Clock, User, Video, MapPin, Plus, Edit2, Trash2,
  PhoneIncoming, BarChart2, X, Search, Building2, UserCircle
} from 'lucide-react';

const MEETING_TYPES = ['Marketing Appointment', 'Client Meeting'];

const EMPTY_FORM = {
  meetingCategory: 'Marketing Appointment', // 'Marketing Appointment' | 'Client Meeting'
  title: '', description: '',
  type: 'Offline',            // Online | Offline | Call
  scheduledAt: '',
  employeeId: '',
  // Marketing Appointment
  rNoSearch: '', leadId: '',
  // Client Meeting
  clientId: '',
};

const TYPE_COLORS = {
  'Online':  { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
  'Offline': { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  'Call':    { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
};

export default function AdminMeetings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('meetings');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rNoResults, setRNoResults] = useState([]);
  const [rNoSearching, setRNoSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMeetings();
    if (user?.role === 'admin') { fetchEmployees(); fetchClients(); fetchLocations(); }
  }, [user]);

  const fetchLocations = async () => {
    try {
      const { data } = await API.get('/leads/locations');
      // Generate rNo consistently with Leads module
      const mapped = (data || []).map((item, index) => ({
        ...item,
        rNo: String(11110001 + index),
        displayName: item.sportsPlaceName || item.name || 'Unknown',
      }));
      setLocations(mapped);
    } catch (err) { console.error(err); }
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try { const { data } = await API.get('/meetings'); setMeetings(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try { const { data } = await API.get('/users?role=employee'); setEmployees(data); } catch { }
  };

  const fetchClients = async () => {
    try { const { data } = await API.get('/clients'); setClients(data); } catch { }
  };

  // Search locations by R.No or name
  const handleRNoSearch = (val) => {
    setForm(f => ({ ...f, rNoSearch: val, leadId: '' }));
    setSelectedLocation(null);
    if (!val.trim()) { setRNoResults([]); return; }
    const lower = val.toLowerCase();
    const results = locations.filter(l =>
      (l.rNo && l.rNo.includes(val)) ||
      (l.sno && l.sno.includes(val)) ||
      (l.displayName && l.displayName.toLowerCase().includes(lower)) ||
      (l.district && l.district.toLowerCase().includes(lower))
    ).slice(0, 10);
    setRNoResults(results);
  };

  const selectLocation = (loc) => {
    setSelectedLocation(loc);
    setForm(f => ({ ...f, leadId: loc._id, rNoSearch: `${loc.rNo} — ${loc.displayName}` }));
    setRNoResults([]);
  };

  const handleQuickFetch = async () => {
    if (!form.rNoSearch) return;
    setRNoSearching(true);
    try {
      let locs = locations;
      if (locs.length === 0) {
        const { data } = await API.get('/leads/locations');
        locs = (data || []).map((item, index) => ({
          ...item,
          rNo: String(11110001 + index),
          displayName: item.sportsPlaceName || item.name || 'Unknown',
        }));
        setLocations(locs);
      }
      
      const searchTerm = form.rNoSearch.trim();
      const p = locs.find(l => l.rNo === searchTerm || l.sno === searchTerm || l.sNo === searchTerm);
      if (p) {
        selectLocation(p);
      } else {
        alert('No record found with that R.No');
      }
    } catch { 
      alert('Error fetching data'); 
    } finally { 
      setRNoSearching(false); 
    }
  };

  const handleClientChange = (id) => {
    setForm(f => ({ ...f, clientId: id }));
    setSelectedClient(clients.find(c => c._id === id) || null);
  };

  const openCreate = () => {
    setEditMeeting(null);
    setForm(EMPTY_FORM);
    setSelectedLocation(null);
    setSelectedClient(null);
    setRNoResults([]);
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditMeeting(m);
    const isClient = !!m.client;
    setForm({
      meetingCategory: isClient ? 'Client Meeting' : 'Marketing Appointment',
      title: m.title || '',
      description: m.description || '',
      type: m.type || 'Offline',
      scheduledAt: m.scheduledAt?.slice(0, 16) || '',
      employeeId: m.employee?._id || '',
      rNoSearch: m.lead?.sno ? `${m.lead.sno} — ${m.lead.name || ''}` : '',
      leadId: m.lead?._id || m.lead || '',
      clientId: m.client?._id || '',
    });
    setSelectedLocation(null);
    setSelectedClient(isClient ? clients.find(c => c._id === (m.client?._id || m.client)) || null : null);
    setRNoResults([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMeeting(null);
    setForm(EMPTY_FORM);
    setSelectedLocation(null);
    setSelectedClient(null);
    setRNoResults([]);
  };

  const handleSave = async () => {
    if (!form.scheduledAt) { alert('Please set a date & time.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title || (form.meetingCategory === 'Marketing Appointment'
          ? (selectedLocation?.displayName || 'Marketing Visit')
          : (selectedClient?.name || 'Client Meeting')),
        description: form.description,
        type: form.type,
        category: form.meetingCategory,
        scheduledAt: form.scheduledAt,
        employeeId: form.employeeId || user._id,
      };
      if (form.meetingCategory === 'Marketing Appointment' && form.leadId) {
        payload.leadId = form.leadId;
      }
      if (form.meetingCategory === 'Client Meeting' && form.clientId) {
        payload.clientId = form.clientId;
      }

      if (editMeeting) {
        await API.put(`/meetings/${editMeeting._id}`, payload);
      } else {
        await API.post('/meetings', payload);
      }
      closeModal();
      fetchMeetings();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save meeting'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this meeting?')) return;
    try { await API.delete(`/meetings/${id}`); fetchMeetings(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleStatusChange = async (id, status) => {
    try { await API.patch(`/meetings/${id}/status`, { status }); fetchMeetings(); }
    catch (err) { console.error(err); }
  };

  const getTypeIcon = (type) =>
    type === 'Online' ? <Video size={14} /> : type === 'Call' ? <PhoneIncoming size={14} /> : <MapPin size={14} />;

  // Analysis
  const totalMeetings = meetings.length;
  const completed = meetings.filter(m => m.status === 'Completed').length;
  const scheduled = meetings.filter(m => m.status === 'Scheduled').length;
  const marketingMeetings = meetings.filter(m => m.lead || m.category === 'Marketing Appointment' || m.category === 'Visiting').length;
  const clientMeetings = meetings.filter(m => m.client).length;
  const byType = ['Offline', 'Online', 'Call'].map(t => ({ type: t, count: meetings.filter(m => m.type === t).length }));
  const byEmployee = employees.map(e => ({
    name: e.name,
    count: meetings.filter(m => m.employee?._id === e._id || m.employee === e._id).length
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);

  return (
    <Layout title="Meetings & Appointments">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Meetings</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{totalMeetings} total meetings</p>
        </div>
        <div className="page-header-actions">
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {['meetings', 'analysis'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: tab === t ? 'rgba(99,102,241,0.25)' : 'none',
                color: tab === t ? '#a5b4fc' : 'var(--text-muted)'
              }}>
                {t === 'meetings' ? '📋 List' : '📊 Analysis'}
              </button>
            ))}
          </div>
          {user?.role === 'admin' && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={18} /> Schedule
            </button>
          )}
        </div>
      </div>

      {tab === 'analysis' ? (
        <div>
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total', val: totalMeetings, color: '#a5b4fc' },
              { label: 'Completed', val: completed, color: '#10b981' },
              { label: 'Marketing Appt.', val: marketingMeetings, color: '#adff2f' },
              { label: 'Client Meetings', val: clientMeetings, color: '#38bdf8' },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.val}</p>
              </div>
            ))}
          </div>
          <div className="chart-row-equal" style={{ gap: 20 }}>
            <div className="glass" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 16, fontWeight: 700 }}>By Type</h4>
              {byType.map(b => (
                <div key={b.type} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{b.type}</span><span style={{ fontWeight: 700 }}>{b.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${totalMeetings > 0 ? (b.count / totalMeetings) * 100 : 0}%`, background: 'var(--primary)', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="glass" style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 16, fontWeight: 700 }}>By Employee</h4>
              {byEmployee.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</p>
                : byEmployee.map(b => (
                  <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{b.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{b.count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : meetings.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No meetings yet. Click Schedule to add one.</p>
            </div>
          ) : meetings.map(m => {
            const isMarketing = !m.client && (m.lead || m.category === 'Marketing Appointment' || m.category === 'Visiting');
            const tc = TYPE_COLORS[m.type] || TYPE_COLORS['Offline'];
            return (
              <div key={m._id} className="glass" style={{ padding: 20, borderRadius: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center', background: tc.bg, color: tc.color, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                      {getTypeIcon(m.type)} {m.type?.toUpperCase()}
                    </span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: isMarketing ? 'rgba(173,255,47,0.08)' : 'rgba(56,189,248,0.08)',
                      color: isMarketing ? '#adff2f' : '#38bdf8',
                      padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700
                    }}>
                      {isMarketing ? <Building2 size={11} /> : <UserCircle size={11} />}
                      {isMarketing ? 'Marketing' : 'Client'}
                    </span>
                  </div>
                  {user?.role === 'admin' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(m)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#818cf8' }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(m._id)} style={{ background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#f87171' }}><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                  {m.title || m.lead?.name || m.client?.name || 'Meeting'}
                </h3>
                {isMarketing && m.lead?.sno && (
                  <div style={{ fontSize: 12, color: '#adff2f', marginBottom: 4 }}>
                    📌 R.No: {m.lead.sno} {m.lead.name ? `— ${m.lead.name}` : ''}
                  </div>
                )}
                {m.client && (
                  <div style={{ fontSize: 12, color: '#38bdf8', marginBottom: 4 }}>
                    👤 Client: {m.client.name}
                  </div>
                )}
                {m.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>{m.description}</p>}
                <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Calendar size={13} color="var(--primary)" />
                    {new Date(m.scheduledAt).toLocaleDateString('en-IN')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Clock size={13} color="var(--primary)" />
                    {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <User size={13} color="var(--primary)" />
                    <span style={{ color: 'var(--text-muted)' }}>{m.employee?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${m.status === 'Scheduled' ? 'badge-interested' : m.status === 'Proceeding' ? 'badge-active' : 'badge-converted'}`}>{m.status}</span>
                  {m.status !== 'Completed' && (user?.role === 'admin' || m.employee?._id === user?._id) && (
                    <button onClick={() => handleStatusChange(m._id, 'Completed')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-window" style={{ maxWidth: 640, width: '100%', padding: 28 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editMeeting ? '✏️ Edit Meeting' : '📅 Schedule Meeting'}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            {/* Meeting Category Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 22, gap: 4 }}>
              {MEETING_TYPES.map(cat => (
                <button key={cat} onClick={() => setForm(f => ({ ...f, meetingCategory: cat, leadId: '', clientId: '', rNoSearch: '' }))}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: form.meetingCategory === cat
                      ? (cat === 'Marketing Appointment' ? 'rgba(173,255,47,0.15)' : 'rgba(56,189,248,0.15)')
                      : 'none',
                    color: form.meetingCategory === cat
                      ? (cat === 'Marketing Appointment' ? '#adff2f' : '#38bdf8')
                      : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}>
                  {cat === 'Marketing Appointment' ? '🏢 Marketing Appointment' : '👤 Client Meeting'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Title */}
              <div>
                <label className="form-label">Title (optional — auto-filled)</label>
                <input className="form-input" value={form.title} placeholder="Leave blank to auto-fill"
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief notes about this meeting..." />
              </div>

              {/* Type + Date */}
              <div className="grid-cols-2" style={{ gap: 12 }}>
                <div className="mobile-col-span-2">
                  <label className="form-label">Meeting Mode</label>
                  <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option>Offline</option><option>Online</option><option>Call</option>
                  </select>
                </div>
                <div className="mobile-col-span-2">
                  <label className="form-label">Date & Time *</label>
                  <input className="form-input" type="datetime-local" value={form.scheduledAt}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
              </div>

              {/* Marketing Appointment — R.No Search */}
              {form.meetingCategory === 'Marketing Appointment' && (
                <div>
                   {!editMeeting && (
                    <div style={{ background: 'rgba(173,255,47,0.04)', border: '1px solid rgba(173,255,47,0.15)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                      <p style={{ fontSize: 13, color: '#adff2f', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                        ⚡ Quick Fetch from Database
                      </p>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label className="form-label" style={{ color: '#adff2f' }}>Enter R.No (e.g. 11110001)</label>
                          <input className="form-input" value={form.rNoSearch} onChange={e => setForm(f => ({ ...f, rNoSearch: e.target.value }))} placeholder="11110001" />
                        </div>
                        <button type="button" className="btn-primary" onClick={handleQuickFetch} disabled={rNoSearching} style={{ padding: '9px 20px', height: 42 }}>
                          {rNoSearching ? '...' : 'Fetch'}
                        </button>
                      </div>
                    </div>
                  )}

                  <label className="form-label">Search by R.No / Name / District</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 36 }}
                      value={form.rNoSearch}
                      onChange={e => handleRNoSearch(e.target.value)}
                      placeholder="Type R.No e.g. 11110001 or place name..."
                    />
                    {/* Dropdown results */}
                    {rNoResults.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: '#16162a', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10, zIndex: 9999, maxHeight: 220, overflowY: 'auto',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.7)', marginTop: 4
                      }}>
                        {rNoResults.map(loc => (
                          <div key={loc._id} onClick={() => selectLocation(loc)}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(173,255,47,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                              <span style={{ color: '#adff2f', marginRight: 8 }}>R.No: {loc.rNo || loc.sno}</span>
                              {loc.displayName}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                              {loc.district || ''} {loc.phone ? `• ${loc.phone}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Selected location preview */}
                  {selectedLocation && (
                    <div style={{ marginTop: 10, padding: 14, background: 'rgba(173,255,47,0.06)', border: '1px solid rgba(173,255,47,0.2)', borderRadius: 10 }}>
                      <div style={{ fontWeight: 700, color: '#adff2f', marginBottom: 6, fontSize: 13 }}>📋 Data Record Details</div>
                      <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>R.No: </span><strong>{selectedLocation.rNo || selectedLocation.sno}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Name: </span><strong>{selectedLocation.displayName}</strong></div>
                        {selectedLocation.phone && <div><span style={{ color: 'var(--text-muted)' }}>Phone: </span>{selectedLocation.phone}</div>}
                        {selectedLocation.district && <div><span style={{ color: 'var(--text-muted)' }}>District: </span>{selectedLocation.district}</div>}
                        {selectedLocation.location?.address && <div><span style={{ color: 'var(--text-muted)' }}>Address: </span>{selectedLocation.location.address}</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Client Meeting — Client Dropdown */}
              {form.meetingCategory === 'Client Meeting' && (
                <div>
                  <label className="form-label">Select Client *</label>
                  <select className="form-input" value={form.clientId} onChange={e => handleClientChange(e.target.value)}>
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.name} — {c.organization || c.phone}</option>
                    ))}
                  </select>
                  {selectedClient && (
                    <div style={{ marginTop: 10, padding: 14, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10 }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6, fontSize: 13 }}>📋 Client Details</div>
                      <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Name: </span><strong>{selectedClient.name}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Phone: </span>{selectedClient.phone}</div>
                        {selectedClient.email && <div><span style={{ color: 'var(--text-muted)' }}>Email: </span>{selectedClient.email}</div>}
                        {selectedClient.organization && <div><span style={{ color: 'var(--text-muted)' }}>Organization: </span>{selectedClient.organization}</div>}
                        {selectedClient.sportsPlaceDetails?.district && <div><span style={{ color: 'var(--text-muted)' }}>District: </span>{selectedClient.sportsPlaceDetails.district}</div>}
                        <div><span style={{ color: 'var(--text-muted)' }}>Status: </span>
                          <span style={{ color: selectedClient.status === 'Active' ? '#10b981' : '#ef4444' }}>● {selectedClient.status}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assign Employee */}
              {employees.length > 0 && (
                <div>
                  <label className="form-label">Assign Employee</label>
                  <select className="form-input" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                    <option value="">Select employee</option>
                    {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                  </select>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editMeeting ? 'Update Meeting' : 'Save Meeting'}
                </button>
                <button className="btn-secondary" onClick={closeModal} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
