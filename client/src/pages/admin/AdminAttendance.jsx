import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Calendar, Search, Filter, CheckCircle, XCircle, Clock, MapPin, Camera, User } from 'lucide-react';

export default function AdminAttendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

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
          <p style={{ fontSize: 24, fontWeight: 800, color: '#f87171' }}>0</p>
        </div>
      </div>

      <div className="glass table-wrapper">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
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
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="var(--primary)" />
                      </div>
                      <span style={{ fontWeight: 600 }}>{a.user?.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 14 }}>{a.checkIn?.time ? new Date(a.checkIn.time).toLocaleTimeString() : '—'}</div>
                  </td>
                  <td>
                     <div style={{ fontSize: 14 }}>{a.checkOut?.time ? new Date(a.checkOut.time).toLocaleTimeString() : '—'}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <MapPin size={12} /> {a.location?.lat ? a.location.lat.toFixed(3) : '—'}, {a.location?.lng ? a.location.lng.toFixed(3) : '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Camera size={16} color="var(--secondary)" style={{ cursor: 'pointer' }} onClick={() => alert('View Selfie placeholder')} />
                      {a.location?.lat && (
                        <MapPin size={16} color="var(--primary)" style={{ cursor: 'pointer' }} onClick={() => window.open(`https://www.google.com/maps?q=${a.location.lat},${a.location.lng}`)} />
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${a.status === 'Present' ? 'badge-converted' : 'badge-lost'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
