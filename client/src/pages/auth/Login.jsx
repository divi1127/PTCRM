import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, Camera, RefreshCw } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [facePhoto, setFacePhoto] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const demoUsers = [
    { label: 'Admin', email: 'admin@playtime.com', password: 'admin123', color: '#8b5cf6' },
    { label: 'Employee', email: 'ravi@playtime.com', password: 'employee123', color: '#10b981' },
  ];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      setFacePhoto('');
    } catch {
      setError('Camera access denied. Please allow camera or use email/password only.');
    }
  };

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setFacePhoto(canvas.toDataURL('image/jpeg', 0.7));
    stopCamera();
  };

  const autoCheckIn = useCallback(async (token, photo) => {
    if (!photo) return;
    try {
      let location = null;
      if (navigator.geolocation) {
        await new Promise(resolve => {
          navigator.geolocation.getCurrentPosition(
            pos => { location = { lat: pos.coords.latitude, lng: pos.coords.longitude }; resolve(); },
            () => resolve(), { timeout: 4000 }
          );
        });
      }
      await API.post('/attendance/check-in', { location, selfie: photo, notes: 'Face login auto check-in' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Already checked in or error — silently ignore
    }
  }, []);

  const doLogin = async (email, password) => {
    setError(''); setLoading(true);
    try {
      // If face captured, try face login first
      if (facePhoto) {
        try {
          const { data } = await API.post('/auth/face-login', { facePhoto });
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data));
          if (facePhoto) await autoCheckIn(data.token, facePhoto);
          if (data.role === 'admin') navigate('/admin/dashboard');
          else navigate('/employee/dashboard');
          return;
        } catch {
          // Face login failed, fallback to email/password
        }
      }
      const user = await login(email, password);
      if (facePhoto) await autoCheckIn(localStorage.getItem('token'), facePhoto);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  const handleLogin = (e) => { e.preventDefault(); doLogin(form.email, form.password); };
  const quickLogin = (email, password) => { setForm({ email, password }); doLogin(email, password); };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.1) 0%, transparent 50%), #0f0f1a',
      padding: 20
    }}>
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', filter: 'blur(60px)' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(16,185,129,0.05)', filter: 'blur(80px)' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 0 40px rgba(99,102,241,0.4)'
          }}><Zap size={32} color="white" /></div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, color: '#f1f5f9' }}>Play Time CRM</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Sports Turf & Booking Platform</p>
        </div>

        <div className="glass" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Welcome back 👋</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Sign in with email/password or face capture</p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <AlertCircle size={16} color="#f87171" />
              <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>
            </div>
          )}

          {/* Face capture section */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Face ID (optional — auto marks attendance)</label>
            {cameraOn ? (
              <div style={{ textAlign: 'center' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', maxHeight: 200, objectFit: 'cover' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center' }}>
                  <button type="button" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={capturePhoto}>
                    <Camera size={14} /> Capture
                  </button>
                  <button type="button" className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={stopCamera}>Cancel</button>
                </div>
              </div>
            ) : facePhoto ? (
              <div style={{ textAlign: 'center' }}>
                <img src={facePhoto} alt="face" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', border: '2px solid #10b981' }} />
                <div style={{ marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Face captured</div>
                <button type="button" onClick={() => { setFacePhoto(''); startCamera(); }} style={{ marginTop: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                  <RefreshCw size={12} /> Retake
                </button>
              </div>
            ) : (
              <button type="button" onClick={startCamera} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 13 }}>
                <Camera size={15} /> Open Camera for Face Login
              </button>
            )}
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" className="form-input" style={{ paddingLeft: 42 }} placeholder="your@email.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
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
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 24px' }} disabled={loading}>
              {loading ? 'Signing in...' : facePhoto ? '🔓 Sign In + Mark Attendance' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
            Don't have an account? <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>Register</Link>
          </p>
        </div>

        <div className="glass" style={{ marginTop: 20, padding: 20 }}>
          <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 14, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>⚡ Quick Demo Access</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {demoUsers.map(u => (
              <button key={u.label} onClick={() => quickLogin(u.email, u.password)}
                style={{ background: `${u.color}15`, border: `1px solid ${u.color}40`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: u.color, fontSize: 12, fontWeight: 600 }}>
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
