import { Bell, Search, Menu, X, Sun, Moon, RefreshCw, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axios';

export default function Navbar({ title = 'Dashboard', toggleSidebar, isSidebarOpen }) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.body.classList.toggle('light-theme');
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await API.get('/notifications?limit=15');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const markOneRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const typeIcon = (type) => {
    if (type === 'target_assigned') return '🎯';
    if (type === 'lead_assigned')   return '📋';
    return '🔔';
  };

  return (
    <header style={{
      height: 64, background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(12px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Toggle: Menu when closed, X when open */}
        <button
          onClick={toggleSidebar}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            padding: 6, borderRadius: 8, transition: 'background 0.2s'
          }}
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '8px 14px'
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input placeholder="Search..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: 160 }} />
        </div>

        {/* Refresh */}
        <button onClick={() => window.location.reload()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 9, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          <RefreshCw size={18} />
        </button>

        {/* Theme */}
        <button onClick={toggleTheme} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 9, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifDropdown(v => !v)}
            style={{ position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 9, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 5, right: 5,
                minWidth: 16, height: 16, borderRadius: 8,
                background: '#ef4444', color: 'white',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: 46,
              width: 340, maxHeight: 420, overflowY: 'auto',
              background: '#111118', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              zIndex: 99999
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications {unreadCount > 0 && <span style={{ color: '#ef4444', fontSize: 12 }}>({unreadCount} new)</span>}</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              {/* Items */}
              {notifications.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  🔔 No notifications yet
                </div>
              ) : notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markOneRead(n._id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: n.read ? 'transparent' : 'rgba(173,255,47,0.04)',
                    cursor: n.read ? 'default' : 'pointer',
                    display: 'flex', gap: 10, alignItems: 'flex-start'
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(173, 255, 47, 0.1)',
          border: '1px solid var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer'
        }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
