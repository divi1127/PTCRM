import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Target, UploadCloud } from 'lucide-react';

export default function EmployeeTargets() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      // Backend automatically filters by req.user._id if role is employee
      const { data } = await API.get('/targets');
      setTargets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceUpdate = async (targetId, placeId, status) => {
    try {
      await API.patch(`/targets/${targetId}/place/${placeId}`, { status });
      fetchTargets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadPhoto = async (targetId, placeId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('photo', file);
      await API.post(
        `/targets/${targetId}/place/${placeId}/photo`,
        body,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      fetchTargets();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout title="My Targets">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Monthly Targets</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Track and update your assigned places for the month</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : targets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 20 }}>
            <p style={{ color: 'var(--text-muted)' }}>You don't have any targets assigned currently.</p>
          </div>
        ) : (
          targets.map((t) => {
            const places = Array.isArray(t?.places) ? t.places : [];
            const placeNameFor = (p) => p?.placeName || p?.sportsPlaceName || p?.name || '—';
            const addressFor = (p) => p?.address || p?.location?.address || p?.location?.addressLine || '—';

            return (
              <div key={t._id} className="glass" style={{ padding: 24, borderRadius: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(173,255,47,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Target size={20} color="var(--primary)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>Target: {t.month}/{t.year}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Assigned to you</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Monthly Target</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{t.value}</div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(56,189,248,0.04)', borderRadius: 16, border: '1px solid rgba(56,189,248,0.1)' }}>
                    <div style={{ fontSize: 12, color: '#38bdf8', marginBottom: 4 }}>Weekly Target</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{t.weeklyTarget || Math.ceil(Number(t.value || 0) / 4)}</div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(251,191,36,0.03)', borderRadius: 16, border: '1px solid rgba(251,191,36,0.1)' }}>
                    <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 4 }}>Follow Up</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>{t.followUp || 0}</div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(173,255,47,0.03)', borderRadius: 16, border: '1px solid rgba(173,255,47,0.1)' }}>
                    <div style={{ fontSize: 12, color: 'var(--primary)', marginBottom: 4 }}>Completed</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{t.achieved || 0}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.progress ?? 0}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
                  <div style={{ height: '100%', width: `${Math.min(t.progress || 0, 100)}%`, background: 'var(--primary)', boxShadow: '0 0 10px var(--glow)' }} />
                </div>

                <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Assigned Places ({places.length})</h4>
                <div className="table-wrapper">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>R.No</th>
                          <th>Place Name</th>
                          <th>Address</th>
                          <th>Status</th>
                          <th>Upload Proof</th>
                        </tr>
                      </thead>
                      <tbody>
                        {places.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                              No specific places assigned.
                            </td>
                          </tr>
                        ) : (
                          places.map((place) => (
                            <tr key={place._id}>
                              <td style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{place.rNo || '—'}</td>
                              <td style={{ fontWeight: 600 }}>{placeNameFor(place)}</td>
                              <td style={{ fontSize: 12, color: '#94a3b8' }}>{addressFor(place)}</td>
                              <td>
                                <select
                                  className={`form-input ${place.status === 'Completed' ? 'badge-converted' : place.status === 'Follow Up' ? 'badge-interested' : ''}`}
                                  style={{ width: 130, padding: '4px 8px', fontSize: 13 }}
                                  value={place.status}
                                  onChange={(e) => handlePlaceUpdate(t._id, place._id, e.target.value)}
                                >
                                  <option>Pending</option>
                                  <option>Follow Up</option>
                                  <option>Completed</option>
                                </select>
                              </td>
                              <td>
                                <label
                                  style={{
                                    cursor: 'pointer',
                                    color: 'var(--primary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    opacity: uploading ? 0.5 : 1,
                                  }}
                                >
                                  <UploadCloud size={16} />
                                  <span style={{ fontSize: 12 }}>
                                    {(place.photos || []).length > 0 ? `${place.photos.length} uploaded` : 'Upload'}
                                  </span>
                                  <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    disabled={uploading}
                                    onChange={(e) => handleUploadPhoto(t._id, place._id, e.target.files[0])}
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
            );
          })
        )}
      </div>
    </Layout>
  );
}

