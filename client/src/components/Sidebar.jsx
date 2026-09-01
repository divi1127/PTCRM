import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar,
  MapPin, BarChart2, Settings, LogOut, Trophy, Target, Zap, FileSpreadsheet, X
} from 'lucide-react';
import logo from '../assets/logo.jpeg';

const navItems = {
  admin: [
    { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/data-module',icon: FileSpreadsheet,  label: 'Data Module' },
    { to: '/admin/leads',      icon: Target,           label: 'Lead Generation' },
    { to: '/admin/import',     icon: MapPin,           label: 'Location Map' },
    { to: '/admin/clients',    icon: Users,            label: 'Clients' },
    { to: '/admin/employees',  icon: Users,            label: 'Employees' },
    { to: '/admin/attendance', icon: Calendar,         label: 'Attendance' },
    { to: '/admin/meetings',   icon: Calendar,         label: 'Meetings' },
    { to: '/admin/targets',    icon: Trophy,           label: 'Targets' },
    { to: '/admin/payments',   icon: Zap,              label: 'Payments' },
    { to: '/reports',          icon: BarChart2,        label: 'Reports' },
    { to: '/settings',         icon: Settings,         label: 'Settings' },
  ],
  employee: [
    { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employee/leads',     icon: Target,          label: 'My Leads' },
    { to: '/employee/attendance',icon: Calendar,        label: 'Attendance' },
    { to: '/employee/meetings',  icon: Calendar,        label: 'My Meetings' },
    { to: '/employee/targets',   icon: Trophy,          label: 'My Targets' },
    { to: '/settings',           icon: Settings,        label: 'Settings' },
  ],
};

export default function Sidebar({ isOpen, sidebarClass, toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navItems[user?.role] || navItems.employee;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${sidebarClass || (!isOpen ? 'closed' : '')}`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
            <img src={logo} alt="Play Time" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Play Time</div>
            <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.08em' }}>CRM</div>
          </div>
        </div>
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      {/* User info + Logout */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--primary)', textTransform: 'capitalize', fontWeight: 500 }}>{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, flexShrink: 0 }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: '12px 0', flex: '1 1 0', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, padding: '8px 20px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Navigation
        </div>
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
