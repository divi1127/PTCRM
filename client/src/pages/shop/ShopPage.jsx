import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { ShoppingCart, Plus, Minus, Trash2, Search, Filter, Package, Star } from 'lucide-react';

const sports = ['all','football','cricket','badminton','basketball','general'];

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSport, setFilterSport] = useState('all');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    API.get('/shop/products').then(r => setProducts(r.data)).finally(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i._id === product._id);
      if (exists) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty } : i));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleOrder = async () => {
    try {
      await API.post('/shop/order', {
        items: cart.map(i => ({ product: i._id, name: i.name, price: i.price, quantity: i.qty })),
        totalAmount: total,
        paymentStatus: 'paid',
      });
      setCart([]);
      setShowCart(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 4000);
    } catch (err) { alert(err.response?.data?.message || 'Order failed'); }
  };

  const filtered = products.filter(p =>
    (filterSport === 'all' || p.sport === filterSport) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout title="Sports Shop">
      {orderSuccess && (
        <div style={{ position: 'fixed', top: 80, right: 28, background: 'rgba(16,185,129,0.95)', borderRadius: 12, padding: '14px 20px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Package size={18} color="white" />
          <span style={{ color: 'white', fontWeight: 600 }}>Order placed successfully! 🎉</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Sports Shop</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>{products.length} products available</p>
        </div>
        <button onClick={() => setShowCart(true)} style={{
          position: 'relative', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer',
          color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <ShoppingCart size={18} />
          Cart
          {cartCount > 0 && (
            <span style={{ background: '#ef4444', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{cartCount}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sports.map(s => (
            <button key={s} onClick={() => setFilterSport(s)}
              style={{
                padding: '8px 16px', borderRadius: 20, border: '1px solid',
                borderColor: filterSport === s ? '#6366f1' : 'rgba(255,255,255,0.1)',
                background: filterSport === s ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: filterSport === s ? '#818cf8' : '#64748b', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s'
              }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {filtered.map(p => {
            const inCart = cart.find(i => i._id === p._id);
            return (
              <div key={p._id} className="glass glass-hover" style={{ borderRadius: 20, overflow: 'hidden' }}>
                <div style={{
                  height: 160, background: `linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.1))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64
                }}>
                  {p.sport === 'football' ? '⚽' : p.sport === 'cricket' ? '🏏' : p.sport === 'badminton' ? '🏸' : p.sport === 'basketball' ? '🏀' : '🎯'}
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{p.category}</div>
                  <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#f1f5f9' }}>{p.name}</h4>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{p.rating}</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>· {p.stock} in stock</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>₹{p.price?.toLocaleString('en-IN')}</span>
                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => updateQty(p._id, inCart.qty - 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={13} /></button>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{inCart.qty}</span>
                        <button onClick={() => updateQty(p._id, inCart.qty + 1)} style={{ background: 'rgba(99,102,241,0.3)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={13} /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(p)} className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>
                        <Plus size={14} /> Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: 60, color: '#64748b' }}>
              <Package size={48} color="#334155" style={{ margin: '0 auto 12px' }} />
              <p>No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCart(false)}>
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: 420,
            background: '#1a1a2e', borderLeft: '1px solid rgba(255,255,255,0.1)',
            padding: 28, overflowY: 'auto', zIndex: 1001
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>🛒 Your Cart ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#f1f5f9' }}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cart is empty</div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item._id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {item.sport === 'football' ? '⚽' : item.sport === 'cricket' ? '🏏' : item.sport === 'badminton' ? '🏸' : item.sport === 'basketball' ? '🏀' : '🎯'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ color: '#10b981', fontWeight: 700, marginTop: 4 }}>₹{item.price?.toLocaleString('en-IN')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <button onClick={() => updateQty(item._id, item.qty - 1)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                        <span style={{ fontWeight: 700 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item._id, item.qty + 1)} style={{ background: 'rgba(99,102,241,0.2)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                        <button onClick={() => removeFromCart(item._id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 16, paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: 22, color: '#10b981' }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <button className="btn-primary" onClick={handleOrder} style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}>
                    Place Order ₹{total.toLocaleString('en-IN')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
