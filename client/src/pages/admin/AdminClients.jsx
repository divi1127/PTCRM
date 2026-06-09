import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const EMPTY_FORM = {
  name: '', phone: '', email: '', address: '', organization: '',
  sportsPlaceDetails: { name: '', district: '', type: '' },
  paymentPlan: 'Monthly', status: 'Active'
};

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // District & Place fetch states
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/clients');
      setClients(data);
    } catch { setClients([]); }
    finally { setLoading(false); }
  };

  const fetchDistricts = async () => {
    try {
      const { data } = await API.get('/leads/districts');
      setDistricts(data);
    } catch { }
  };

  useEffect(() => { fetchClients(); fetchDistricts(); }, []);

  const handleDistrictChange = async (district) => {
    setForm(f => ({ ...f, sportsPlaceDetails: { ...f.sportsPlaceDetails, district, name: '' }, phone: '' }));
    setPlaces([]);
    if (!district) return;
    setLoadingPlaces(true);
    try {
      const { data } = await API.get(`/leads/places/${encodeURIComponent(district)}`);
      setPlaces(data);
    } catch { }
    finally { setLoadingPlaces(false); }
  };

  const handlePlaceChange = (placeId) => {
    const selected = places.find(p => p._id === placeId);
    if (!selected) return;
    setForm(f => ({
      ...f,
      name: f.name || selected.sportsPlaceName || selected.name,
      phone: selected.phone || f.phone,
      address: selected.location?.address || f.address,
      sportsPlaceDetails: {
        ...f.sportsPlaceDetails,
        name: selected.sportsPlaceName || selected.name,
      }
    }));
  };

  const openCreate = () => {
    setEditClient(null);
    setForm(EMPTY_FORM);
    setPlaces([]);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditClient(c);
    setForm({
      name: c.name, phone: c.phone, email: c.email || '', address: c.address || '',
      organization: c.organization || '',
      sportsPlaceDetails: c.sportsPlaceDetails || { name: '', district: '', type: '' },
      paymentPlan: c.paymentPlan || 'Monthly', status: c.status || 'Active'
    });
    // Pre-load places for existing district
    if (c.sportsPlaceDetails?.district) {
      API.get(`/leads/places/${encodeURIComponent(c.sportsPlaceDetails.district)}`)
        .then(({ data }) => setPlaces(data)).catch(() => {});
    } else {
      setPlaces([]);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editClient) await API.put(`/clients/${editClient._id}`, form);
      else await API.post('/clients', form);
      setShowModal(false);
      fetchClients();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save client'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return;
    try { await API.delete(`/clients/${id}`); fetchClients(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.organization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Client Directory">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Client Management</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{clients.length} total clients</p>
        </div>
        <div className="page-header-actions">
           <button className="btn-primary" onClick={openCreate}><Plus size={18} /> New Client</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        <div className="kpi-card"><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Clients</p><p style={{ fontSize: 24, fontWeight: 800 }}>{clients.length}</p></div>
        <div className="kpi-card"><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active</p><p style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{clients.filter(c => c.status === 'Active').length}</p></div>
        <div className="kpi-card"><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Inactive</p><p style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{clients.filter(c => c.status === 'Inactive').length}</p></div>
      </div>

      <div className="glass table-wrapper">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', maxWidth: 300 }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div>
          <table className="data-table">
            <thead>
              <tr><th>Client</th><th>Organization</th><th>Place</th><th>District</th><th>Plan</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No clients found.</td></tr>
              ) : filtered.map(c => (
                <tr key={c._id}>
                  <td><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div></td>
                  <td>{c.organization || '—'}</td>
                  <td>{c.sportsPlaceDetails?.name || '—'}</td>
                  <td>{c.sportsPlaceDetails?.district || '—'}</td>
                  <td><span style={{ fontSize: 12, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 6 }}>{c.paymentPlan}</span></td>
                  <td><span style={{ color: c.status === 'Active' ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 600 }}>● {c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#818cf8' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(c._id)} style={{ background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#f87171' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{editClient ? 'Edit Client' : 'Add New Client'}</h3>
            <form onSubmit={handleSubmit}>

              {/* Step 1: District */}
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">District</label>
                <select className="form-input" value={form.sportsPlaceDetails.district}
                  onChange={e => handleDistrictChange(e.target.value)}>
                  <option value="">-- Select District --</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Step 2: Place (loads after district) */}
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Place {loadingPlaces && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>loading...</span>}</label>
                <select className="form-input"
                  value={places.find(p => (p.sportsPlaceName || p.name) === form.sportsPlaceDetails.name)?._id || ''}
                  onChange={e => handlePlaceChange(e.target.value)}
                  disabled={!form.sportsPlaceDetails.district || loadingPlaces}>
                  <option value="">-- Select Place --</option>
                  {places.map(p => (
                    <option key={p._id} value={p._id}>{p.sportsPlaceName || p.name}</option>
                  ))}
                </select>
                             {/* Phone — auto-filled from place, editable */}
              <div className="grid-cols-2" style={{ marginBottom: 12 }}>
                <div className="mobile-col-span-2">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Auto-filled from place" required />
                </div>
                <div className="mobile-col-span-2">
                  <label className="form-label">Place Name</label>
                  <input className="form-input" value={form.sportsPlaceDetails.name}
                    onChange={e => setForm(f => ({ ...f, sportsPlaceDetails: { ...f.sportsPlaceDetails, name: e.target.value } }))}
                    placeholder="Auto-filled from place" />
                </div>
              </div>

              <div className="grid-cols-2" style={{ marginBottom: 12 }}>
                <div className="mobile-col-span-2">
                  <label className="form-label">Client Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="mobile-col-span-2">
                  <label className="form-label">Organization</label>
                  <input className="form-input" value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} />
                </div>
              </div>

              <div className="grid-cols-2" style={{ marginBottom: 12 }}>
                <div className="mobile-col-span-2">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="mobile-col-span-2">
                  <label className="form-label">Place Type</label>
                  <select className="form-input" value={form.sportsPlaceDetails.type}
                    onChange={e => setForm(f => ({ ...f, sportsPlaceDetails: { ...f.sportsPlaceDetails, type: e.target.value } }))}>
                    <option value="">Select</option>
                    {['Turf', 'Academy', 'Ground', 'Stadium', 'Club'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>    </div>

              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Auto-filled from place" />
              </div>

              <div className="grid-cols-2" style={{ marginBottom: 20 }}>
                <div className="mobile-col-span-2">
                  <label className="form-label">Payment Plan</label>
                  <select className="form-input" value={form.paymentPlan}
                    onChange={e => setForm(f => ({ ...f, paymentPlan: e.target.value }))}>
                    {['Monthly', 'Quarterly', 'Yearly', 'One-time'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="mobile-col-span-2">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Saving...' : editClient ? 'Update Client' : 'Add Client'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
