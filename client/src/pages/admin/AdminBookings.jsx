import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Calendar, Check, X, Search, Filter, Eye } from 'lucide-react';

const statusColors = { pending: 'badge-pending', confirmed: 'badge-confirmed', cancelled: 'badge-cancelled', completed: 'badge-completed' };

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSport) params.sport = filterSport;
      const { data } = await API.get('/bookings', { params });
      setBookings(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [filterStatus, filterSport]);

  const handleConfirm = async (id) => {
    await API.put(`/bookings/${id}/confirm`);
    fetchBookings();
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    await API.put(`/bookings/${id}/cancel`);
    fetchBookings();
  };

  const filtered = bookings.filter(b =>
    (b.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    b.venue.toLowerCase().includes(search.toLowerCase())
  );

  const sportEmoji = { football: '⚽', cricket: '🏏', badminton: '🏸', basketball: '🏀', other: '🎯' };

  return (
    <Layout title="Booking Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>All Bookings</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{bookings.length} total bookings</p>
        </div>
        {/* Summary pills */}
        <div style={{ display: 'flex', gap: 10 }}>
          {['pending','confirmed','cancelled','completed'].map(s => {
            const count = bookings.filter(b => b.status === s).length;
            return <span key={s} className={`badge badge-${s}`} style={{ padding: '6px 14px' }}>{s} ({count})</span>;
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by customer or venue..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {['pending','confirmed','cancelled','completed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="form-input" style={{ width: 150 }} value={filterSport} onChange={e => setFilterSport(e.target.value)}>
          <option value="">All Sports</option>
          {['football','cricket','badminton','basketball','other'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="glass" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sport / Venue</th><th>Customer</th><th>Date & Slot</th>
                  <th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{sportEmoji[b.sport]}</span>
                        <div>
                          <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{b.sport}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{b.venue}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{b.user?.name || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{b.user?.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{new Date(b.slot.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div style={{ fontSize: 12, color: '#6366f1' }}>{b.slot.startTime} – {b.slot.endTime}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#10b981' }}>₹{b.amount?.toLocaleString('en-IN')}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: b.paymentStatus === 'paid' ? 'rgba(16,185,129,0.15)' : b.paymentStatus === 'refunded' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: b.paymentStatus === 'paid' ? '#10b981' : b.paymentStatus === 'refunded' ? '#f87171' : '#fbbf24'
                      }}>{b.paymentStatus}</span>
                    </td>
                    <td><span className={`badge ${statusColors[b.status]}`}>{b.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {b.status === 'pending' && (
                          <button onClick={() => handleConfirm(b._id)} style={{ background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#10b981' }}><Check size={14} /></button>
                        )}
                        {['pending','confirmed'].includes(b.status) && (
                          <button onClick={() => handleCancel(b._id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#f87171' }}><X size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
