import { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { User, Bell, Shield, Smartphone, Globe, Save, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState([
    { label: 'Booking Confirmations', desc: 'Get notified when a new booking is confirmed', enabled: true },
    { label: 'Campaign Updates', desc: 'Updates on marketing campaign performance', enabled: true },
    { label: 'System Alerts', desc: 'Important server and database status alerts', enabled: false },
    { label: 'New Lead Assignments', desc: 'Receive alerts when a new lead is assigned to you', enabled: true },
  ]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <Layout title="Settings">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage your profile and system preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {/* Sidebar Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'sticky', top: 100 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12, border: 'none',
                  background: activeTab === tab.id ? 'rgba(173, 255, 47, 0.1)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                  fontSize: 14, fontWeight: 600
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="glass" style={{ padding: 32 }}>
          {activeTab === 'profile' && (
            <div className="fade-in">
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Profile Information</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>Manage your public profile and account details.</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'rgba(173, 255, 47, 0.1)',
                  border: '1px solid var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: 'var(--primary)'
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Change Photo</button>
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>JPG, GIF or PNG. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: 16, marginBottom: 24 }}>
                <div className="mobile-col-span-2">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" defaultValue={user?.name} />
                </div>
                <div className="mobile-col-span-2">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" defaultValue={user?.email} disabled />
                </div>
                <div className="mobile-col-span-2">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" defaultValue={user?.phone} />
                </div>
                <div className="mobile-col-span-2">
                  <label className="form-label">Role</label>
                  <input className="form-input" defaultValue={user?.role} disabled />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <button className="btn-primary">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="fade-in">
              <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Notification Settings</h4>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Control how you receive alerts and updates.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {notificationSettings.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => setNotificationSettings(prev => prev.map((setting, idx) => idx === i ? { ...setting, enabled: !setting.enabled } : setting))}
                      style={{ width: 18, height: 18, accentColor: '#6366f1' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="fade-in">
              <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Security & Privacy</h4>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Manage your password and security sessions.</p>

              <div style={{ maxWidth: 400 }}>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Current Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" placeholder="Enter new password" />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" placeholder="Confirm new password" />
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Update Password</button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="fade-in">
              <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>System Preferences</h4>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Customize your interface experience.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Theme Mode</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Toggle between dark and light mode</div>
                  </div>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
                    <button style={{ padding: '6px 12px', border: 'none', borderRadius: 8, background: 'var(--primary)', color: 'black', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      <Moon size={14} /> Dark
                    </button>
                    <button style={{ padding: '6px 12px', border: 'none', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sun size={14} /> Light
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Language</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Select your preferred language</div>
                  </div>
                  <select className="form-input" style={{ width: 140 }}>
                    <option>English (IN)</option>
                    <option>English (US)</option>
                    <option>Hindi</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
