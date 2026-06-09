import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, Megaphone,
  MapPin, BarChart2, Settings, LogOut, Trophy, Target, Zap, FileSpreadsheet
} from 'lucide-react';

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
    <aside className={`sidebar ${sidebarClass || (!isOpen ? 'closed' : '')}`}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={20} color="black" />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Play Time</div>
            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.1em' }}>CRM PLATFORM</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'var(--primary)'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--primary)', textTransform: 'capitalize', fontWeight: 500 }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: '12px 0', flex: 1 }}>
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

      {/* Logout */}
      <div style={{ padding: '16px 10px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} className="sidebar-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
