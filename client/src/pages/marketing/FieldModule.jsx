import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { MapPin, LogIn, LogOut, Plus, Camera, FileText, CheckCircle } from 'lucide-react';

export default function FieldModule() {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [visits, setVisits] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [notes, setNotes] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', sport: 'football', notes: '' });
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const { data } = await API.get('/marketing/visits');
      setVisits(data);
      const todayOpen = data.find(v => v.status === 'checked-in' && new Date(v.createdAt).toDateString() === new Date().toDateString());
      if (todayOpen) { setCurrentVisit(todayOpen); setCheckedIn(true); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getGPS = () => new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('GPS not available'));
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), rej, { timeout: 10000 });
  });

  const handleCheckIn = async () => {
    setGpsLoading(true);
    try {
      let lat, lng, address;
      try {
        const pos = await getGPS();
        lat = pos.lat; lng = pos.lng;
        address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch {
        lat = 12.9716; lng = 77.5946; address = 'Bangalore (GPS unavailable)';
      }
      const { data } = await API.post('/marketing/visit/checkin', { lat, lng, address });
      setCurrentVisit(data); setCheckedIn(true);
      setSuccessMsg('✅ Checked in successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Check-in failed'); }
    finally { setGpsLoading(false); }
  };

  const handleCheckOut = async () => {
    setGpsLoading(true);
    try {
      let lat, lng, address;
      try {
        const pos = await getGPS();
        lat = pos.lat; lng = pos.lng; address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch { lat = 12.9716; lng = 77.5946; address = 'Bangalore'; }
      await API.post('/marketing/visit/checkout', { lat, lng, address, notes, dailyReport: report });
      setCheckedIn(false); setCurrentVisit(null); setReport(''); setNotes('');
      setSuccessMsg('✅ Checked out and report submitted!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchVisits();
    } catch (err) { alert(err.response?.data?.message || 'Check-out failed'); }
    finally { setGpsLoading(false); }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      await API.post('/leads', { ...leadForm, source: 'field', status: 'new', assignedTo: user?._id });
      setShowLeadForm(false);
      setLeadForm({ name: '', phone: '', sport: 'football', notes: '' });
      setSuccessMsg('✅ Lead added successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Failed to add lead'); }
  };

  const todayVisits = visits.filter(v => new Date(v.createdAt).toDateString() === new Date().toDateString());

  return (
    <Layout title="Field Agent Module">
      {successMsg && (
        <div style={{ position: 'fixed', top: 80, right: 28, background: 'rgba(16,185,129,0.95)', borderRadius: 12, padding: '14px 20px', zIndex: 9999, fontSize: 14, fontWeight: 600, color: 'white' }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Check-in/out Card */}
        <div className="glass" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>📍 GPS Check-In / Check-Out</h3>
          <div style={{
            background: checkedIn ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
            border: `1px solid ${checkedIn ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
            borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{checkedIn ? '🟢' : '🔴'}</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: checkedIn ? '#10b981' : '#f87171' }}>
              {checkedIn ? 'Currently Checked In' : 'Not Checked In'}
            </div>
            {currentVisit?.checkIn?.time && (
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                Since {new Date(currentVisit.checkIn.time).toLocaleTimeString('en-IN')}
              </div>
            )}
          </div>

          {!checkedIn ? (
            <button className="btn-primary" onClick={handleCheckIn} disabled={gpsLoading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}>
              <LogIn size={18} /> {gpsLoading ? 'Getting GPS...' : 'Check In with GPS'}
            </button>
          ) : (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Field Notes</label>
                <textarea className="form-input" rows={3} placeholder="Notes about today's field activity..."
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">End-of-Day Report</label>
                <textarea className="form-input" rows={4} placeholder="Summary of today's field work, leads captured, areas covered..."
                  value={report} onChange={e => setReport(e.target.value)} />
              </div>
              <button className="btn-danger" onClick={handleCheckOut} disabled={gpsLoading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', borderRadius: 10 }}>
                <LogOut size={16} /> {gpsLoading ? 'Submitting...' : 'Check Out & Submit Report'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Add Lead on Spot */}
          <div className="glass" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontWeight: 700, fontSize: 16 }}>⚡ Add Lead On-Spot</h4>
              <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => setShowLeadForm(!showLeadForm)}>
                <Plus size={14} /> Quick Add
              </button>
            </div>
            {showLeadForm && (
              <form onSubmit={handleAddLead}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label className="form-label">Name *</label><input className="form-input" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} required /></div>
                  <div><label className="form-label">Phone *</label><input className="form-input" value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} required /></div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Interested In</label>
                  <select className="form-input" value={leadForm.sport} onChange={e => setLeadForm({ ...leadForm, sport: e.target.value })}>
                    {['football','cricket','badminton','basketball','other'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}><label className="form-label">Notes</label><input className="form-input" value={leadForm.notes} onChange={e => setLeadForm({ ...leadForm, notes: e.target.value })} /></div>
                <button type="submit" className="btn-success" style={{ width: '100%', borderRadius: 10, padding: '10px 16px' }}>Save Lead</button>
              </form>
            )}
          </div>

          {/* Today's Stats */}
          <div className="glass" style={{ padding: 24 }}>
            <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📊 Today's Activity</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: "Today's Visits", value: todayVisits.length, color: '#6366f1' },
                { label: 'Check-In Time', value: currentVisit?.checkIn?.time ? new Date(currentVisit.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—', color: '#10b981' },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}15`, border: `1px solid ${s.color}30`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {currentVisit?.checkIn && (
              <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>📍 Check-in Location</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{currentVisit.checkIn.address}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: 17 }}>Field Visit History</h3>
          <span className="badge badge-new">{visits.length} total visits</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Agent</th><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Location</th><th>Report</th><th>Status</th></tr></thead>
              <tbody>
                {visits.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No field visits yet</td></tr>
                ) : visits.slice(0, 10).map(v => (
                  <tr key={v._id}>
                    <td><div style={{ fontWeight: 600 }}>{v.agent?.name || 'N/A'}</div><div style={{ fontSize: 11, color: '#64748b' }}>{v.agent?.phone}</div></td>
                    <td style={{ fontSize: 13 }}>{new Date(v.createdAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: 13, color: '#10b981' }}>{v.checkIn?.time ? new Date(v.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td style={{ fontSize: 13, color: '#f87171' }}>{v.checkOut?.time ? new Date(v.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{v.checkIn?.address || '—'}</td>
                    <td>{v.reportSubmitted ? <span style={{ color: '#10b981', fontSize: 12 }}><CheckCircle size={12} style={{ marginRight: 4 }} />Submitted</span> : <span style={{ color: '#64748b', fontSize: 12 }}>Pending</span>}</td>
                    <td><span className={`badge ${v.status === 'checked-in' ? 'badge-pending' : 'badge-completed'}`}>{v.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
