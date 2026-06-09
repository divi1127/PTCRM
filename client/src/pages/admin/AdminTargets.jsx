import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Edit2, Trash2, CheckCircle, UploadCloud, X } from 'lucide-react';

const EMPTY_FORM = { employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), value: 10, district: '', selectedPlaces: [] };

export default function AdminTargets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [districtPlaces, setDistrictPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTargets();
    if (user?.role === 'admin') { fetchEmployees(); fetchDistricts(); }
  }, [user]);

  const fetchTargets = async () => {
    setLoading(true);
    try { const { data } = await API.get('/reports/targets'); setTargets(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try { const { data } = await API.get('/users?role=employee'); setEmployees(data); } catch { }
  };

  const fetchDistricts = async () => {
    try { const { data } = await API.get('/leads/districts'); setDistricts(data); } catch { }
  };

  const fetchPlacesByDistrict = async (district) => {
    if (!district) { setDistrictPlaces([]); return; }
    setLoadingPlaces(true);
    try {
      const { data } = await API.get(`/leads/places/${encodeURIComponent(district)}`);
      setDistrictPlaces(data);
      // Auto-select up to form.value places
      const autoSelected = data.slice(0, Number(form.value)).map(p => ({ _id: p._id, placeName: p.sportsPlaceName || p.name, rNo: p.sno || '', address: p.location?.address || '' }));
      setForm(f => ({ ...f, district, selectedPlaces: autoSelected }));
    } catch { setDistrictPlaces([]); }
    finally { setLoadingPlaces(false); }
  };

  const togglePlace = (place) => {
    setForm(f => {
      const exists = f.selectedPlaces.find(p => p._id?.toString() === place._id?.toString());
      if (exists) return { ...f, selectedPlaces: f.selectedPlaces.filter(p => p._id?.toString() !== place._id?.toString()) };
      const newPlace = { _id: place._id, placeName: place.sportsPlaceName || place.name, rNo: place.sno || '', address: place.location?.address || '' };
      return { ...f, selectedPlaces: [...f.selectedPlaces, newPlace] };
    });
  };

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setDistrictPlaces([]); setShowModal(true); };

  const openEdit = (t) => {
    setEditTarget(t);
    setForm({ employeeId: t.employee?._id || '', month: t.month, year: t.year, value: t.value, district: '', selectedPlaces: t.places.map(p => ({ _id: p._id, placeName: p.placeName, rNo: p.rNo || '', address: p.address || '' })) });
    setDistrictPlaces([]);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const placeItems = form.selectedPlaces.map(p => ({ placeName: p.placeName, address: p.address, rNo: p.rNo }));
      if (editTarget) {
        await API.put(`/targets/${editTarget._id}`, { employeeId: form.employeeId, month: Number(form.month), year: Number(form.year), value: Number(form.value), placeItems });
      } else {
        await API.post('/targets', { employeeId: form.employeeId, month: Number(form.month), year: Number(form.year), value: Number(form.value), placeItems });
      }
      setShowModal(false);
      fetchTargets();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save target'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this target?')) return;
    try { await API.delete(`/targets/${id}`); fetchTargets(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handlePlaceUpdate = async (targetId, placeId, status) => {
    try {
      await API.patch(`/targets/${targetId}/place/${placeId}`, { status });
      fetchTargets();
      setShowDetail(prev => prev ? { ...prev, places: prev.places.map(p => p._id === placeId ? { ...p, status } : p) } : null);
    } catch (err) { console.error(err); }
  };

  const handleUploadPhoto = async (targetId, placeId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData(); body.append('photo', file);
      await API.post(`/targets/${targetId}/place/${placeId}/photo`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchTargets();
    } catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <Layout title="Sales Targets & Performance">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Employee Goals</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Assign monthly place targets and track progress</p>
        </div>
        <div className="page-header-actions">
           {user?.role === 'admin' && <button className="btn-primary" onClick={openCreate}><Plus size={18} /> Assign New Target</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : targets.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 20 }}>
            <p style={{ color: 'var(--text-muted)' }}>No targets yet.</p>
          </div>
        ) : targets.map((t) => (
          <div key={t._id} className="glass" style={{ padding: 24, borderRadius: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(173,255,47,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t.employee?.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.month}/{t.year}</p>
                </div>
              </div>
              {user?.role === 'admin' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(t)} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: 'none', color: '#818cf8', cursor: 'pointer' }}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(t._id)} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <div className="grid-cols-3" style={{ gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Target</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{t.value}</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(56,189,248,0.04)', borderRadius: 12, border: '1px solid rgba(56,189,248,0.1)' }}>
                <div style={{ fontSize: 10, color: '#38bdf8', marginBottom: 2 }}>Week</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>{t.weeklyTarget || Math.ceil(t.value / 4)}</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(173,255,47,0.03)', borderRadius: 12, border: '1px solid rgba(173,255,47,0.1)' }}>
                <div style={{ fontSize: 10, color: 'var(--primary)', marginBottom: 2 }}>Done</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{t.achieved || 0}</div>
              </div>
            </div>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.progress ?? 0}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', width: `${Math.min(t.progress || 0, 100)}%`, background: 'var(--primary)', boxShadow: '0 0 10px var(--glow)' }} />
            </div>
            <button onClick={() => setShowDetail(t)} style={{ width: '100%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '8px', color: '#a5b4fc', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>View Places</button>
          </div>
        ))}
      </div>

      {/* Assign / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-window" style={{ maxWidth: 720, width: '100%', padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editTarget ? 'Edit Target' : 'Assign Monthly Target'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div><label className="form-label">Employee</label>
                <select className="form-input" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label className="form-label">Month</label><input className="form-input" type="number" min="1" max="12" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></div>
                <div><label className="form-label">Year</label><input className="form-input" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></div>
                <div><label className="form-label">No. of Places</label><input className="form-input" type="number" min="1" max="100" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
              </div>

              <div><label className="form-label">Select District (auto-loads places)</label>
                <select className="form-input" value={form.district} onChange={e => fetchPlacesByDistrict(e.target.value)}>
                  <option value="">-- Select District --</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {loadingPlaces && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading places...</div>}

              {districtPlaces.length > 0 && (
                <div>
                  <label className="form-label">Places in {form.district} — select up to {form.value}</label>
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
                    {districtPlaces.map(p => {
                      const selected = form.selectedPlaces.some(sp => sp._id?.toString() === p._id?.toString());
                      return (
                        <div key={p._id} onClick={() => togglePlace(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: selected ? 'rgba(99,102,241,0.15)' : 'transparent', marginBottom: 4 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? '#818cf8' : 'var(--border)'}`, background: selected ? '#818cf8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selected && <CheckCircle size={10} color="white" />}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.sportsPlaceName || p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>R.No: {p.sno || '—'} • {p.location?.address || '—'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {form.selectedPlaces.length > 0 && (
                <div>
                  <label className="form-label">Selected Places ({form.selectedPlaces.length})</label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
                    {form.selectedPlaces.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', fontSize: 13 }}>
                        <span><strong>{p.placeName}</strong> {p.rNo && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(R.No: {p.rNo})</span>}</span>
                        <button onClick={() => setForm(f => ({ ...f, selectedPlaces: f.selectedPlaces.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSubmit}>{editTarget ? 'Update Target' : 'Assign Target'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDetail(null)}>
          <div className="modal-window" style={{ maxWidth: 780, width: '100%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ marginBottom: 6, fontWeight: 700, fontSize: 18 }}>{showDetail.employee?.name}'s Target</h3>
                <p style={{ color: 'var(--text-muted)' }}>{showDetail.month}/{showDetail.year} • {showDetail.value} places • Weekly Target: {showDetail.weeklyTarget || Math.ceil(showDetail.value / 4)}</p>
              </div>
              <button onClick={() => setShowDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <div className="table-wrapper">
              <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>R.No</th><th>Place</th><th>District</th><th>Address</th><th>Status</th><th>Photos</th><th>Upload</th></tr>
                </thead>
                <tbody>
                  {(Array.isArray(showDetail?.places) ? showDetail.places : []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No places defined.</td>
                    </tr>
                  ) : (
                    Array.isArray(showDetail?.places) && showDetail.places.map((place) => (
                      <tr key={place._id}>
                        <td style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{place.rNo || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{place.placeName || place.sportsPlaceName || place.name || '—'}</td>
                        <td style={{ fontSize: 12, color: '#a5b4fc' }}>{showDetail.district || '—'}</td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>{place.address || place.location?.address || '—'}</td>
                        <td>
                          <select
                            className={`form-input ${place.status === 'Completed' ? 'badge-converted' : place.status === 'Follow Up' ? 'badge-interested' : ''}`}
                            style={{ width: 130, padding: '4px 8px', fontSize: 13 }}
                            value={place.status}
                            onChange={(e) => handlePlaceUpdate(showDetail._id, place._id, e.target.value)}
                          >
                            <option>Pending</option>
                            <option>Follow Up</option>
                            <option>Completed</option>
                          </select>
                        </td>
                        <td>{(place.photos || []).length}</td>
                        <td>
                          <label style={{ cursor: 'pointer', color: 'var(--primary)' }}>
                            <UploadCloud size={16} />
                            <input
                              type="file"
                              style={{ display: 'none' }}
                              accept="image/*"
                              onChange={(e) => handleUploadPhoto(showDetail._id, place._id, e.target.files[0])}
                            />
                          </label>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
                </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
