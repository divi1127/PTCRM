import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Trophy, Wallet, Star, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const sportEmoji = { football: '⚽', cricket: '🏏', badminton: '🏸', basketball: '🏀', other: '🎯' };

export default function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/bookings/my'),
      API.get('/users/membership').catch(() => ({ data: null })),
    ]).then(([b, m]) => {
      setBookings(b.data);
      setMembership(m.data);
    }).finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.slot.date) >= new Date());
  const past = bookings.filter(b => b.status === 'completed' || new Date(b.slot.date) < new Date());

  if (loading) return <Layout title="My Dashboard"><div className="loader"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="My Dashboard">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(16,185,129,0.2))',
        border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '28px 32px',
        marginBottom: 28, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', filter: 'blur(40px)' }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
          Welcome back, <span className="gradient-text">{user?.name}</span> 👋
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Ready to play? You have {upcoming.length} upcoming booking{upcoming.length !== 1 ? 's' : ''}.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Link to="/booking" className="btn-primary"><Calendar size={16} /> Book a Slot</Link>
          <Link to="/shop" className="btn-secondary"><Star size={16} /> Shop Gear</Link>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: '#6366f1' },
          { label: 'Upcoming', value: upcoming.length, icon: Clock, color: '#f59e0b' },
          { label: 'Reward Points', value: user?.rewardPoints || 0, icon: Star, color: '#10b981' },
          { label: 'Wallet Balance', value: `₹${user?.walletBalance || 0}`, icon: Wallet, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="kpi-card glass-hover">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Upcoming Bookings */}
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Upcoming Bookings</h3>
          {upcoming.length === 0 ? (
            <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
              <Calendar size={40} color="#334155" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b' }}>No upcoming bookings</p>
              <Link to="/booking" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Book Now</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.slice(0, 4).map(b => (
                <div key={b._id} className="glass glass-hover" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 32 }}>{sportEmoji[b.sport]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: 15 }}>{b.sport}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{b.venue}</div>
                    <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, marginTop: 4 }}>
                      {new Date(b.slot.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {b.slot.startTime}–{b.slot.endTime}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: 16 }}>₹{b.amount}</div>
                    <span className="badge badge-confirmed" style={{ marginTop: 4 }}>Confirmed</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Bookings */}
          {past.length > 0 && (
            <>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, marginTop: 24 }}>Past Bookings</h3>
              <div className="glass" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                  <thead><tr><th>Sport</th><th>Venue</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {past.slice(0, 5).map(b => (
                      <tr key={b._id}>
                        <td>{sportEmoji[b.sport]} {b.sport}</td>
                        <td style={{ fontSize: 13 }}>{b.venue}</td>
                        <td style={{ fontSize: 13 }}>{new Date(b.slot.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>₹{b.amount}</td>
                        <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Sidebar: Membership + Rewards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Membership Card */}
          <div style={{
            background: membership ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
            border: membership ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Trophy size={20} color={membership ? 'white' : '#64748b'} />
              <span style={{ fontWeight: 700, fontSize: 15, color: membership ? 'white' : '#f1f5f9' }}>Membership</span>
            </div>
            {membership ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', textTransform: 'capitalize', marginBottom: 6 }}>{membership.plan} Plan</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Valid until {new Date(membership.endDate).toLocaleDateString('en-IN')}</div>
                <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Referral Code</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'white', letterSpacing: '0.1em' }}>{membership.referralCode}</div>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Unlock exclusive discounts and priority booking</p>
                <Link to="/membership" className="btn-primary" style={{ display: 'flex', justifyContent: 'center' }}>Get Membership</Link>
              </>
            )}
          </div>

          {/* Rewards */}
          <div className="glass" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Star size={18} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Reward Points</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fbbf24' }}>{user?.rewardPoints || 0}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>points earned</div>
            <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((user?.rewardPoints || 0) / 10, 100)}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 3 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>0</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>1000 pts = ₹100 off</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass" style={{ padding: 20 }}>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Quick Actions</h4>
            {[
              { to: '/booking', label: 'Book a Turf', emoji: '⚽' },
              { to: '/shop', label: 'Shop Gear', emoji: '🛍️' },
              { to: '/membership', label: 'Membership', emoji: '🏆' },
            ].map(({ to, label, emoji }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                textDecoration: 'none', color: '#f1f5f9'
              }}>
                <span style={{ fontSize: 14 }}>{emoji} {label}</span>
                <ArrowRight size={14} color="#6366f1" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
