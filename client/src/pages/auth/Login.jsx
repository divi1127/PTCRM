import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Camera, CheckCircle } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(''); // 'capturing' | 'done' | 'skipped'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  /* ── Auto-capture selfie + GPS then post attendance ─────── */
  const captureAndCheckIn = async () => {
    setAttendanceStatus('capturing');
    let selfie = '';
    let location = {};

    // 1. Try camera selfie
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      // Give video element a moment to render
      await new Promise(r => setTimeout(r, 800));
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
        await new Promise(r => setTimeout(r, 600));
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        canvas.getContext('2d').drawImage(video, 0, 0);
        selfie = canvas.toDataURL('image/jpeg', 0.6);
      }
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    } catch {
      // Camera not available — proceed without selfie
    }

    // 2. Try GPS
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 })
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      // GPS not available — proceed without location
    }

    // 3. Post check-in
    try {
      await API.post('/attendance/check-in', { selfie, location });
    } catch (err) {
      console.error('Attendance failed:', err);
      // Already checked in or error — silently ignore
    }

    setAttendanceStatus('done');
    // Clear status after 3 seconds
    setTimeout(() => setAttendanceStatus(''), 3000);
  };

  const doLogin = async (email, password) => {
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      // Auto-capture attendance for employees
      if (user.role?.toLowerCase() !== 'admin') {
        await captureAndCheckIn(); // Wait for capture to finish before redirecting
      }
      if (user.role?.toLowerCase() === 'admin') navigate('/admin/dashboard');
      else navigate('/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  const handleLogin = (e) => { e.preventDefault(); doLogin(form.email, form.password); };
  const quickLogin = (email, password) => { setForm({ email, password }); doLogin(email, password); };

  const demoUsers = [
    { label: 'Admin', email: 'admin@playtime.com', password: 'admin123', color: '#8b5cf6' },
    { label: 'Employee', email: 'ravi@playtime.com', password: 'employee123', color: '#10b981' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.1) 0%, transparent 50%), #0f0f1a',
      padding: 20
    }}>
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', filter: 'blur(60px)' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(16,185,129,0.05)', filter: 'blur(80px)' }} />

      {/* Hidden video element for silent selfie capture */}
      <video ref={videoRef} autoPlay playsInline muted style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: 1, height: 1, top: 0, left: 0 }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ margin: '0 auto 16px', width: 80, height: 80, borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 40px rgba(99,102,241,0.35)', border: '2px solid rgba(255,255,255,0.1)' }}>
            <img src={logo} alt="Play Time CRM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, color: '#f1f5f9' }}>Play Time CRM</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Sports Turf &amp; Booking Platform</p>
        </div>

        <div className="glass" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Welcome back 👋</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Sign in — attendance captured automatically</p>

          {/* Quick Demo Access - moved to top */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {demoUsers.map(u => (
              <button key={u.label} onClick={() => quickLogin(u.email, u.password)}
                style={{ background: `${u.color}15`, border: `1px solid ${u.color}40`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: u.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
                ⚡ {u.label}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <AlertCircle size={16} color="#f87171" />
              <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>
            </div>
          )}

          {/* Attendance status Full Screen Overlay for visible capture */}
          {attendanceStatus === 'capturing' && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,15,26,0.95)', zIndex: 9999,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 24, backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                position: 'relative', width: 280, height: 280, borderRadius: '50%',
                overflow: 'hidden', border: '4px solid var(--primary)',
                boxShadow: '0 0 40px rgba(173,255,47,0.3)', marginBottom: 24
              }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.4) 100%)' }} />
              </div>
              <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verifying Identity...</h3>
              <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>Capturing selfie and GPS for attendance tracking.</p>
              <div className="spinner" style={{ marginTop: 24, width: 32, height: 32, borderColor: 'var(--primary)' }} />
            </div>
          )}

          {attendanceStatus === 'done' && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,15,26,0.95)', zIndex: 9999,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <CheckCircle size={40} color="#10b981" />
              </div>
              <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700 }}>Attendance Marked Successfully!</h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>Redirecting to dashboard...</p>
            </div>
          )}


          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" className="form-input" style={{ paddingLeft: 42 }} placeholder="your@email.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type={showPw ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 42, paddingRight: 42 }}
                  placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Attendance info note */}
            <div style={{ background: 'rgba(173,255,47,0.04)', border: '1px solid rgba(173,255,47,0.1)', borderRadius: 8, padding: '8px 12px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={13} color="#adff2f" />
              <span style={{ fontSize: 12, color: '#adff2f' }}>Face &amp; GPS captured automatically on login (employees)</span>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 24px' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
            Don't have an account? <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
