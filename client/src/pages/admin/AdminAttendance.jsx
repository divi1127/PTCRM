import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Calendar, Search, Filter, CheckCircle, XCircle, Clock, MapPin, Camera, User, X } from 'lucide-react';

export default function AdminAttendance() {
  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [date, setDate] = useState(getLocalToday());
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSelfie, setShowSelfie] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/reports/attendance?date=${date}`);
      setAttendance(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Attendance Dashboard">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Daily Monitoring</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>GPS Verified login/logout logs</p>
        </div>
        <div className="page-header-actions">
          <div style={{ position: 'relative' }}>
            <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              style={{ width: 'auto', paddingLeft: 36 }}
            />
          </div>
          <button className="btn-primary" onClick={fetchAttendance}>Refresh</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        <div className="kpi-card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Strength</p>
          <p style={{ fontSize: 24, fontWeight: 800 }}>{attendance.length || 0}</p>
        </div>
        <div className="kpi-card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Present</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{attendance.filter(a => a.status === 'Present').length}</p>
        </div>
        <div className="kpi-card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>On Field</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>{attendance.filter(a => a.workFrom === 'Field').length}</p>
        </div>
        <div className="kpi-card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Late</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#f87171' }}>{attendance.filter(a => a.status === 'Late').length}</p>
        </div>
      </div>

      <div className="glass table-wrapper">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Location</th>
                <th>Verification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : attendance.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found for this date.</td></tr>
              ) : attendance.map((a, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(173,255,47,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {a.checkIn?.selfie ? (
                          <img src={a.checkIn.selfie} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => setShowSelfie(a.checkIn.selfie)} />
                        ) : (
                          <User size={20} color="var(--primary)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.user?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} /> {a.checkIn?.time ? new Date(a.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                      {a.checkIn?.location?.address && <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.checkIn.location.address}</div>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} /> {a.checkOut?.time ? new Date(a.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
                        <MapPin size={12} color="var(--primary)" /> {a.location?.lat ? a.location.lat.toFixed(5) : '—'}, {a.location?.lng ? a.location.lng.toFixed(5) : '—'}
                      </div>
                      {a.location?.address && <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.location.address}</div>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {a.checkIn?.selfie && (
                        <div 
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          onClick={() => setShowSelfie(a.checkIn.selfie)}
                          title="View Check-in Selfie"
                        >
                          <Camera size={16} color="#818cf8" />
                        </div>
                      )}
                      {a.location?.lat && (
                        <div 
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          onClick={() => window.open(`https://www.google.com/maps?q=${a.location.lat},${a.location.lng}`)}
                          title="View on Google Maps"
                        >
                          <MapPin size={16} color="#10b981" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${a.status === 'Present' ? 'badge-converted' : a.status === 'Late' ? 'badge-interested' : 'badge-lost'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSelfie && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSelfie(null)}>
          <div className="modal-window" style={{ maxWidth: 400, padding: 0, overflow: 'hidden', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowSelfie(null)} 
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={20} />
            </button>
            <img src={showSelfie} alt="Selfie" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: 16, background: 'var(--bg-card)' }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Check-in Selfie Verification</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Captured automatically during login</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
