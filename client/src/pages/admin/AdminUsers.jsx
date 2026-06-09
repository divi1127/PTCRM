import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Plus, Search, Edit2, Trash2, KeyRound, Camera, RefreshCw, X } from 'lucide-react';

const roleColors = { admin: '#8b5cf6', employee: '#10b981' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'employee', isActive: true, facePhoto: '' });
  const [cameraOn, setCameraOn] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetUserName, setResetUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = filterRole ? { role: filterRole } : {};
      const { data } = await API.get('/users', { params });
      setUsers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filterRole]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
    } catch { alert('Camera access denied.'); }
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
    setForm(f => ({ ...f, facePhoto: canvas.toDataURL('image/jpeg', 0.7) }));
    stopCamera();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        await API.put(`/users/${editUser._id}`, form);
      } else {
        await API.post('/auth/register', form);
      }
      closeModal();
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
    setForm({ name: '', email: '', password: '', phone: '', role: 'employee', isActive: true, facePhoto: '' });
    stopCamera();
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', role: user.role, isActive: user.isActive, facePhoto: user.facePhoto || '' });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', phone: '', role: 'employee', isActive: true, facePhoto: '' });
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete employee "${user.name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/users/${user._id}`);
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const openResetPassword = (user) => {
    setResetUserId(user._id);
    setResetUserName(user.name);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { alert('Password must be at least 6 characters.'); return; }
    setResetting(true);
    try {
      await API.patch(`/users/${resetUserId}/reset-password`, { newPassword });
      setShowResetModal(false);
      alert(`Password for "${resetUserName}" has been reset successfully.`);
    } catch (err) { alert(err.response?.data?.message || 'Failed to reset password'); }
    finally { setResetting(false); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Employees">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Team Management</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{users.length} total team members</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass filter-bar">
        <div style={{ position: 'relative', flex: 1, width: '100%' }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {['admin', 'employee'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th><th>Email</th><th>Phone</th><th>Role</th>
                  <th>Face ID</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No employees found.</td></tr>
                ) : filtered.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 12,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, color: 'var(--primary)'
                        }}>{u.name.charAt(0).toUpperCase()}</div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: '#94a3b8' }}>{u.email}</td>
                    <td style={{ fontSize: 13 }}>{u.phone || '—'}</td>
                    <td><span style={{ background: `${roleColors[u.role]}20`, color: roleColors[u.role], padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{u.role}</span></td>
                    <td>{u.facePhoto ? <span style={{ color: '#10b981', fontSize: 12 }}>✓ Registered</span> : <span style={{ color: '#64748b', fontSize: 12 }}>—</span>}</td>
                    <td><span style={{ color: u.isActive ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 600 }}>{u.isActive ? '● Active' : '● Inactive'}</span></td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(u)} title="Edit"
                          style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#818cf8' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => openResetPassword(u)} title="Reset Password"
                          style={{ background: 'rgba(245,158,11,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#fbbf24' }}>
                          <KeyRound size={13} />
                        </button>
                        <button onClick={() => handleDelete(u)} title="Delete"
                          style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#f87171' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editUser ? '✏️ Edit Employee' : '➕ Add New Employee'}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div style={{ marginBottom: 14 }}><label className="form-label">Email Address</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              {!editUser && (
                <div style={{ marginBottom: 14 }}><label className="form-label">Password</label><input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
              )}
              <div style={{ marginBottom: 14 }}><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div style={{ marginBottom: 14 }}><label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {['admin', 'employee'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>

              {/* Face capture */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Face ID (for face login)</label>
                {cameraOn ? (
                  <div style={{ textAlign: 'center' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', maxHeight: 200, objectFit: 'cover' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center' }}>
                      <button type="button" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={capturePhoto}><Camera size={14} /> Capture</button>
                      <button type="button" className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={stopCamera}>Cancel</button>
                    </div>
                  </div>
                ) : form.facePhoto ? (
                  <div style={{ textAlign: 'center' }}>
                    <img src={form.facePhoto} alt="face" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', border: '2px solid #10b981' }} />
                    <div style={{ marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Face registered</div>
                    <button type="button" onClick={() => { setForm(f => ({ ...f, facePhoto: '' })); startCamera(); }} style={{ marginTop: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                      <RefreshCw size={12} /> Retake
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={startCamera} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 13 }}>
                    <Camera size={15} /> Open Camera to Register Face
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16 }} />
                <label htmlFor="isActive" style={{ fontSize: 14, color: '#f1f5f9' }}>Active Account</label>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editUser ? 'Update Employee' : 'Create Account'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeModal} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowResetModal(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>🔑 Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Setting new password for <strong style={{ color: 'var(--text-primary)' }}>{resetUserName}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">New Password (min 6 chars)</label>
                <input
                  type="password" className="form-input"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password" required minLength={6}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-primary" disabled={resetting} style={{ flex: 1, justifyContent: 'center', opacity: resetting ? 0.7 : 1 }}>
                  {resetting ? 'Resetting…' : 'Reset Password'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowResetModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
