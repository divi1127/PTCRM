import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Users, Calendar, Target, DollarSign,
  Activity, ArrowUpRight, Clock, CheckCircle, AlertCircle, Zap, MapPin
} from 'lucide-react';

const COLORS = ['#adff2f', '#10b981', '#fbbf24', '#f87171', '#818cf8'];

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [leadStats, setLeadStats] = useState(null);
  const [sportStats, setSportStats] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);
  const [sportsPlaceStats, setSportsPlaceStats] = useState({ byDistrict: [], byCategory: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [k, r, l, s, a, sp] = await Promise.all([
          API.get('/reports/dashboard-kpis'),
          API.get('/reports/revenue'),
          API.get('/reports/leads-conversion'),
          API.get('/reports/bookings-by-sport'),
          API.get('/reports/agent-performance'),
          API.get('/reports/sports-place-stats'),
        ]);
        setKpis(k.data);
        setRevenue(r.data);
        setLeadStats(l.data);
        setSportStats(s.data.map(d => ({ name: d._id, bookings: d.count, revenue: d.revenue })));
        setAgentPerf(a.data.slice(0, 5));
        setSportsPlaceStats(sp.data);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const kpiCards = kpis ? [
    { label: 'Total Leads', value: kpis.totalLeads || 0, icon: Target, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', delta: 'Pipeline' },
    { label: 'Total Clients', value: kpis.totalCustomers || 0, icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.12)', delta: 'Retained' },
    { label: 'Attendance', value: kpis.todayAttendance || '0/0', icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', delta: 'Today' },
    { label: 'Revenue (INR)', value: `₹${(kpis.totalRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', delta: 'Achieved' },
    { label: 'Upcoming Meetings', value: kpis.upcomingMeetings || 0, icon: Calendar, color: '#ec4899', bg: 'rgba(236,72,153,0.12)', delta: 'Scheduled' },
    { label: 'Pending Payments', value: `₹${(kpis.pendingPayments || 0).toLocaleString('en-IN')}`, icon: Zap, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', delta: 'Action Needed' },
    { label: 'Follow-up Reminders', value: kpis.upcomingFollowUps || 0, icon: Clock, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', delta: 'Pending' },
  ] : [];

  const monthlyData = revenue?.monthlyRevenue?.map(m => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id.month - 1],
    revenue: m.total, bookings: m.count
  })) || [];

  const leadFunnel = leadStats?.byStatus?.map(s => ({ name: s._id, value: s.count })) || [];

  if (loading) return (
    <Layout title="Admin Dashboard">
      <div className="loader"><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout title="Admin Dashboard">
      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        {kpiCards.map((card, i) => (
          <div key={i} className="kpi-card glass-hover" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{card.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>{card.value}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <ArrowUpRight size={14} color={card.color} />
                  <span style={{ fontSize: 12, color: card.color, fontWeight: 600 }}>{card.delta}</span>
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <card.icon size={20} color={card.color} />
              </div>
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="chart-row-main" style={{ marginBottom: 20 }}>
        {/* Revenue Chart */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Revenue & Bookings</h3>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Monthly performance overview</p>
            </div>
            <span className="badge badge-active">This Year</span>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Revenue ₹" />
                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Bookings" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              No revenue data yet. Add bookings to see charts.
            </div>
          )}
        </div>

        {/* Lead Funnel */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Lead Pipeline</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Status distribution</p>
          {leadFunnel.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={leadFunnel} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {leadFunnel.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {leadFunnel.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                    <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
              No lead data yet.
            </div>
          )}
          {leadStats && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(99,102,241,0.1)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Conversion Rate</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#818cf8' }}>{leadStats.conversionRate}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="chart-row-equal" style={{ gap: 20 }}>
        {/* Bookings by Sport */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Bookings by Sport</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Revenue & booking count</p>
          {sportStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sportStats} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} name="Bookings" />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue ₹" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
              No sport booking data yet.
            </div>
          )}
        </div>

        {/* Agent Leaderboard */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Agent Leaderboard</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Top performers this month</p>
          {agentPerf.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {agentPerf.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${COLORS[i]}, ${COLORS[(i+1)%COLORS.length]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{a.agent.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{a.leadsCount} leads · {a.convertedCount} converted</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS[i] }}>{a.conversionRate}%</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>conv. rate</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: '#64748b', fontSize: 13 }}>
              <AlertCircle size={32} color="#334155" style={{ marginBottom: 12 }} />
              No agents found. Add field agents to see performance data.
            </div>
          )}
        </div>
      </div>

      {/* Sports Places Section */}
      <div style={{ marginTop: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: '#adff2f' }}>Sports Places Insights</h2>
        <div className="chart-row-equal" style={{ gap: 20 }}>
          {/* Districts Chart */}
          <div className="glass" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <MapPin size={20} color="#adff2f" />
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Places by District</h3>
            </div>
            {sportsPlaceStats.byDistrict.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sportsPlaceStats.byDistrict} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                  <YAxis dataKey="_id" type="category" tick={{ fill: '#f1f5f9', fontSize: 11 }} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                  <Bar dataKey="count" fill="#adff2f" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No location data yet. Import Excel data to see insights.
              </div>
            )}
          </div>

          {/* Categories Chart */}
          <div className="glass" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={20} color="#6366f1" />
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Places by Category</h3>
            </div>
            {sportsPlaceStats.byCategory.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="60%" height={250}>
                  <PieChart>
                    <Pie data={sportsPlaceStats.byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" paddingAngle={4}>
                      {sportsPlaceStats.byCategory.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sportsPlaceStats.byCategory.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                        <span style={{ fontSize: 12, color: '#f1f5f9' }}>{item._id}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No category data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
