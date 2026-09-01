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
  const [showSearchMobile, setShowSearchMobile] = useState(false);
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
    <>
      <header className="navbar" style={{
        height: 64, background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', position: 'sticky', top: 0, zIndex: 100, gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <button
            className="navbar-btn"
            onClick={toggleSidebar}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              padding: 6, borderRadius: 8, flexShrink: 0
            }}
          >
            <Menu size={22} />
          </button>
          <div className="navbar-info" style={{ minWidth: 0, flex: 1 }}>
            <h1 className="navbar-title" style={{ 
              fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', 
              margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', 
              textOverflow: 'ellipsis'
            }}>{title}</h1>
            <p className="navbar-subtitle desktop-only" style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Desktop Search */}
          <div className="navbar-search desktop-only" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '6px 12px'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search records..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 12, width: 140 }} />
          </div>

          {/* Mobile Search Toggle */}
          <button className="navbar-btn-circle mobile-only" onClick={() => setShowSearchMobile(true)} style={{ display: 'flex' }}>
            <Search size={18} />
          </button>

          {/* Refresh - desktop only */}
          <button className="navbar-btn-circle desktop-only" onClick={() => window.location.reload()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--text-muted)' }}>
            <RefreshCw size={18} />
          </button>

          {/* Theme toggle - always visible */}
          <button className="navbar-btn-circle" onClick={toggleTheme}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="navbar-btn-circle"
              onClick={() => setShowNotifDropdown(v => !v)}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 3, right: 3,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: '#ef4444', color: 'white',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', border: '2px solid var(--bg-dark)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifDropdown && (
              <div style={{
                position: 'fixed',
                right: 8,
                top: 64,
                width: 'min(320px, calc(100vw - 16px))',
                maxHeight: 420, overflowY: 'auto',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                zIndex: 99999
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Recent Activities</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 11, fontWeight: 600 }}>Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No notifications</div>
                ) : notifications.map(n => (
                  <div key={n._id} onClick={() => !n.read && markOneRead(n._id)} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'rgba(173,255,47,0.03)', cursor: 'pointer', display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{typeIcon(n.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="navbar-avatar" style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(173, 255, 47, 0.1)', border: '1px solid var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {showSearchMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: 'var(--bg-dark)', zIndex: 101, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <Search size={20} color="var(--text-muted)" />
          <input autoFocus placeholder="Search..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 16 }} />
          <button onClick={() => setShowSearchMobile(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Cancel</button>
        </div>
      )}
    </>
  );
}
