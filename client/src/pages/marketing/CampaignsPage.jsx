import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Plus, Megaphone, TrendingUp, Users, Target } from 'lucide-react';

const typeColors = { whatsapp: '#10b981', sms: '#6366f1', email: '#f59e0b', flyer: '#8b5cf6' };
const typeEmojis = { whatsapp: '💬', sms: '📱', email: '📧', flyer: '🗞️' };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'whatsapp', targetArea: '', targetSport: 'all', budget: '', status: 'draft' });

  useEffect(() => {
    API.get('/marketing/campaigns').then(r => setCampaigns(r.data)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/marketing/campaign', form);
      setCampaigns([data, ...campaigns]);
      setShowModal(false);
      setForm({ title: '', description: '', type: 'whatsapp', targetArea: '', targetSport: 'all', budget: '', status: 'draft' });
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const avgROI = totalReach > 0 ? ((totalConversions / totalReach) * 100).toFixed(1) : 0;

  return (
    <Layout title="Marketing & Campaigns">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Campaign Management</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>{campaigns.length} campaigns total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Campaigns', value: campaigns.length, icon: Megaphone, color: '#6366f1' },
          { label: 'Total Reach', value: totalReach.toLocaleString(), icon: Users, color: '#10b981' },
          { label: 'Conversions', value: totalConversions, icon: Target, color: '#f59e0b' },
          { label: 'Avg. ROI', value: `${avgROI}%`, icon: TrendingUp, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="kpi-card" style={{ padding: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {campaigns.map(c => (
            <div key={c._id} className="glass glass-hover" style={{ padding: 24, borderRadius: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${typeColors[c.type]}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                }}>
                  {typeEmojis[c.type]}
                </div>
                <span className={`badge badge-${c.status}`}>{c.status}</span>
              </div>

              <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.title}</h4>
              {c.description && <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>{c.description}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Type', value: c.type.toUpperCase(), color: typeColors[c.type] },
                  { label: 'Target', value: c.targetSport === 'all' ? 'All Sports' : c.targetSport, color: '#94a3b8' },
                  { label: 'Reach', value: c.reach?.toLocaleString() || '0', color: '#10b981' },
                  { label: 'Conversions', value: c.conversions || 0, color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {c.targetArea && (
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                  📍 {c.targetArea}
                </div>
              )}

              {c.budget > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Budget</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>₹{c.budget?.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          ))}

          {campaigns.length === 0 && (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 60, color: '#64748b' }}>
              <Megaphone size={48} color="#334155" style={{ margin: '0 auto 16px' }} />
              <p style={{ marginBottom: 16 }}>No campaigns yet</p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>Create First Campaign</button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>🚀 Create New Campaign</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 14 }}><label className="form-label">Campaign Title *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div style={{ marginBottom: 14 }}><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div><label className="form-label">Channel Type</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {['whatsapp','sms','email','flyer'].map(t => <option key={t} value={t}>{typeEmojis[t]} {t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Target Sport</label>
                  <select className="form-input" value={form.targetSport} onChange={e => setForm({ ...form, targetSport: e.target.value })}>
                    {['all','football','cricket','badminton','basketball','other'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div><label className="form-label">Target Area</label><input className="form-input" placeholder="e.g. Koramangala" value={form.targetArea} onChange={e => setForm({ ...form, targetArea: e.target.value })} /></div>
                <div><label className="form-label">Budget (₹)</label><input type="number" className="form-input" placeholder="5000" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['draft','active','paused','completed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Launch Campaign</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
