import { useState } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Trophy, Star, Gift, RefreshCw } from 'lucide-react';

const plans = [
  { id: 'monthly', name: 'Monthly', price: 999, duration: '30 days', features: ['Priority booking', '10% discount on slots', 'Free cancellation', 'Monthly rewards'] },
  { id: 'quarterly', name: 'Quarterly', price: 2499, duration: '90 days', popular: true, features: ['Priority booking', '15% discount on slots', 'Free cancellation', 'Extra reward points', 'Shop discounts'] },
  { id: 'yearly', name: 'Yearly', price: 7999, duration: '365 days', features: ['Priority booking', '25% discount on slots', 'Free cancellation', '2x reward points', 'Shop discounts', 'Exclusive events'] },
];

export default function MembershipPage() {
  const [selected, setSelected] = useState('quarterly');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [membership, setMembership] = useState(null);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/users/membership', { plan: selected });
      setMembership(data);
      setSuccess(true);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Membership & Loyalty">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
            <Trophy size={32} color="white" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Play Time <span className="gradient-text">Membership</span></h2>
          <p style={{ color: '#64748b', fontSize: 15 }}>Unlock exclusive benefits and priority bookings</p>
        </div>

        {success && membership ? (
          <div style={{ textAlign: 'center', padding: 48 }} className="glass">
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Welcome to {membership.plan.charAt(0).toUpperCase() + membership.plan.slice(1)} Plan!</h3>
            <p style={{ color: '#64748b', marginBottom: 20 }}>Valid until {new Date(membership.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: '2-digit' })}</p>
            <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 16, padding: '20px 40px', display: 'inline-block' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Your Referral Code</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#818cf8', letterSpacing: '0.1em' }}>{membership.referralCode}</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
              {plans.map(plan => (
                <div key={plan.id} onClick={() => setSelected(plan.id)}
                  style={{
                    position: 'relative', borderRadius: 24, padding: 28, cursor: 'pointer', transition: 'all 0.3s',
                    background: selected === plan.id ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${selected === plan.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    transform: selected === plan.id ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: selected === plan.id ? '0 20px 60px rgba(99,102,241,0.3)' : 'none',
                  }}>
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ⭐ Most Popular
                    </div>
                  )}
                  <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{plan.name}</h3>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>₹{plan.price.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>for {plan.duration}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#10b981', fontSize: 10 }}>✓</span>
                        </div>
                        <span style={{ color: '#94a3b8' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button className="btn-primary" onClick={handleSubscribe} disabled={loading}
                style={{ padding: '16px 48px', fontSize: 16, borderRadius: 16 }}>
                <Star size={18} />
                {loading ? 'Processing...' : `Subscribe to ${plans.find(p => p.id === selected)?.name} Plan — ₹${plans.find(p => p.id === selected)?.price}`}
              </button>
              <p style={{ color: '#475569', fontSize: 12, marginTop: 12 }}>Secure payment · Cancel anytime · Instant activation</p>
            </div>
          </>
        )}

        {/* Loyalty Program Info */}
        <div className="glass" style={{ padding: 28, marginTop: 32 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, textAlign: 'center' }}>🎁 Loyalty Rewards Program</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: '⚽', title: 'Earn Points', desc: 'Get 10 points for every booking you make' },
              { icon: '👥', title: 'Referral Bonus', desc: 'Earn 100 points for every friend you refer' },
              { icon: '💰', title: 'Redeem Rewards', desc: '1000 points = ₹100 off on your next booking' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
