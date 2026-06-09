import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import { Download, TrendingUp, Target, Users, DollarSign } from 'lucide-react';

const COLORS = ['#adff2f', '#38bdf8', '#fbbf24', '#f87171', '#a78bfa'];

export default function ReportsPage() {
  const [revenue, setRevenue] = useState(null);
  const [leadStats, setLeadStats] = useState(null);
  const [sportStats, setSportStats] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/revenue'),
      API.get('/reports/leads-conversion'),
      API.get('/reports/bookings-by-sport'),
      API.get('/reports/agent-performance'),
    ]).then(([r, l, s, a]) => {
      setRevenue(r.data);
      setLeadStats(l.data);
      setSportStats(s.data.map(d => ({ name: d._id?.charAt(0).toUpperCase() + d._id?.slice(1), bookings: d.count, revenue: d.revenue })));
      setAgentPerf(a.data);
    }).finally(() => setLoading(false));
  }, []);

  const monthlyData = revenue?.monthlyRevenue?.map(m => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id.month - 1],
    revenue: m.total, bookings: m.count
  })) || [];

  const funnelData = leadStats?.byStatus?.map(s => ({ name: s._id, value: s.count })) || [];

  const handleExport = () => {
    const rows = [
      ['Month', 'Revenue', 'Bookings'],
      ...monthlyData.map(m => [m.month, m.revenue, m.bookings])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'playtime_revenue_report.csv'; a.click();
  };

  if (loading) return <Layout title="Reports & Analytics"><div className="loader"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="Reports & Analytics">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Analytics Dashboard</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Comprehensive business performance overview</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: `₹${(revenue?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: '#10b981' },
          { label: 'Total Bookings', value: revenue?.totalBookings || 0, icon: TrendingUp, color: '#6366f1' },
          { label: 'Total Leads', value: leadStats?.totalLeads || 0, icon: Target, color: '#f59e0b' },
          { label: 'Conversion Rate', value: `${leadStats?.conversionRate || 0}%`, icon: Users, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="kpi-card" style={{ padding: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>📈 Monthly Revenue Trend</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} name="Revenue ₹" />
              <Bar dataKey="bookings" fill="#10b981" radius={[8, 8, 0, 0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No revenue data yet — add confirmed paid bookings to see trends.</div>
        )}
      </div>

      <div className="chart-row-equal" style={{ marginBottom: 20 }}>
        {/* Lead Conversion Funnel */}
        <div className="glass" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>🎯 Lead Conversion Funnel</h3>
          {funnelData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={funnelData} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={4}>
                    {funnelData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {funnelData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                    <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{leadStats.convertedLeads}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Converted</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(99,102,241,0.1)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#818cf8' }}>{leadStats.conversionRate}%</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Conv. Rate</div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No lead data</div>
          )}
        </div>

        {/* Bookings by Sport */}
        <div className="glass" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>⚽ Bookings by Sport</h3>
          {sportStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sportStats} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#f1f5f9', fontSize: 13 }} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="bookings" name="Bookings" radius={[0, 8, 8, 0]}>
                  {sportStats.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No booking data yet</div>
          )}
        </div>
      </div>

      {/* Agent Performance */}
      <div className="glass table-wrapper">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 17 }}>🏆 Field Agent Performance</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Rank</th><th>Employee</th><th>Leads Assigned</th><th>Converted</th><th>Visits</th><th>Conversion Rate</th><th>Score</th></tr>
            </thead>
            <tbody>
              {agentPerf.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No agent data yet</td></tr>
              ) : agentPerf.map((a, i) => (
                <tr key={a.agent._id}>
                  <td>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : i === 1 ? 'linear-gradient(135deg,#94a3b8,#cbd5e1)' : i === 2 ? 'linear-gradient(135deg,#b45309,#d97706)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{i + 1}</div>
                  </td>
                  <td><div style={{ fontWeight: 600 }}>{a.agent.name}</div><div style={{ fontSize: 12, color: '#64748b' }}>{a.agent.email}</div></td>
                  <td style={{ fontWeight: 600 }}>{a.leadsCount}</td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>{a.convertedCount}</td>
                  <td style={{ color: '#6366f1', fontWeight: 600 }}>{a.visitsCount}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${a.conversionRate}%`, background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', width: 40 }}>{a.conversionRate}%</span>
                    </div>
                  </td>
                  <td><span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{((a.convertedCount * 10) + a.visitsCount * 2).toFixed(0)} pts</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
