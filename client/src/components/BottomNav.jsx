import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Target, Users, Calendar, Settings, Trophy, FileSpreadsheet
} from 'lucide-react';

/* ── Nav items per role ──── */
const BOTTOM_NAV = {
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/admin/leads',      icon: Target,          label: 'Leads' },
    { to: '/admin/clients',    icon: Users,            label: 'Clients' },
    { to: '/admin/meetings',   icon: Calendar,         label: 'Meetings' },
    { to: '/settings',         icon: Settings,         label: 'Settings' },
  ],
  employee: [
    { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/employee/leads',     icon: Target,           label: 'My Leads' },
    { to: '/employee/attendance',icon: FileSpreadsheet,  label: 'Attend' },
    { to: '/employee/meetings',  icon: Calendar,         label: 'Meetings' },
    { to: '/settings',           icon: Settings,         label: 'Settings' },
  ],
};

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const items = BOTTOM_NAV[user?.role] || BOTTOM_NAV.employee;

  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.75}
                color={isActive ? 'var(--primary)' : 'var(--text-muted)'}
              />
            </div>
            <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
