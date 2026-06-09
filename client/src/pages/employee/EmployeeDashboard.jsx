import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Target, Calendar, Clock, ArrowUpRight, CheckCircle, TrendingUp } from 'lucide-react';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock or real API for employee specific stats
    API.get('/reports/employee-stats').then(r => {
      setStats(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'My Leads', value: stats?.leads || 0, icon: Target, color: '#adff2f', route: '/employee/leads' },
    { label: 'Today Meetings', value: stats?.meetings || 0, icon: Calendar, color: '#FB923C', route: '/employee/meetings' },
    { label: 'Attendance', value: stats?.attendance || 'Not Marked', icon: Clock, color: '#38bdf8', route: '/employee/attendance' },
    { label: 'Monthly Target', value: `${stats?.targetProgress || 0}%`, icon: TrendingUp, color: '#a78bfa', route: '/employee/targets' },
  ];

  if (loading) return <Layout><div className="loader"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="Employee Dashboard">
      <div className="kpi-grid" style={{ marginBottom: 30 }}>
        {cards.map((card, i) => (
          <div key={i} className="kpi-card glass-hover" onClick={() => navigate(card.route)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 5 }}>{card.label}</p>
                <h3 style={{ fontSize: 28, fontWeight: 800 }}>{card.value}</h3>
              </div>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                <card.icon size={22} color={card.color} />
              </div>
            </div>
            <div style={{ marginTop: 15, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: card.color }}>
              <ArrowUpRight size={14} /> <span>View Details</span>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-row-main" style={{ gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Upcoming Follow-ups</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats?.upcomingFollowUps?.length > 0 ? (
              stats.upcomingFollowUps.map(lead => (
                <div key={lead._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700 }}>{lead.name}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lead.phone}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, marginBottom: 4 }}>
                      {new Date(lead.followUpDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </p>
                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => navigate('/employee/leads')}>Update</button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No follow-ups scheduled for today.</p>
            )}
          </div>
        </div>
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/employee/attendance')}>Mark Attendance</button>
            <button className="btn-secondary" style={{ width: '100%', border: '1px solid var(--border)' }} onClick={() => navigate('/employee/leads')}>Add New Lead</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
