import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Calendar, Clock, MapPin, CreditCard, CheckCircle } from 'lucide-react';

const sports = [
  { id: 'football', label: 'Football', emoji: '⚽', color: '#6366f1', price: 800 },
  { id: 'cricket', label: 'Cricket', emoji: '🏏', color: '#10b981', price: 1200 },
  { id: 'badminton', label: 'Badminton', emoji: '🏸', color: '#f59e0b', price: 400 },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', color: '#ef4444', price: 600 },
  { id: 'other', label: 'Other', emoji: '🎯', color: '#8b5cf6', price: 500 },
];

const venues = {
  football: ['Play Time Arena - Ground A', 'Play Time Arena - Ground B'],
  cricket: ['Play Time Arena - Ground B', 'Play Time Arena - Ground C'],
  badminton: ['Play Time Arena - Court 1', 'Play Time Arena - Court 2', 'Play Time Arena - Court 3'],
  basketball: ['Play Time Arena - Court 2'],
  other: ['Multi-Purpose Area'],
};

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (selectedDate && selectedSport && selectedVenue) {
      fetchSlots();
    }
  }, [selectedDate, selectedSport, selectedVenue]);

  const fetchSlots = async () => {
    try {
      const { data } = await API.get('/bookings/slots', { params: { date: selectedDate, sport: selectedSport.id, venue: selectedVenue } });
      setAvailableSlots(data.available || []);
    } catch { setAvailableSlots([]); }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      await API.post('/bookings', {
        sport: selectedSport.id,
        venue: selectedVenue,
        slot: { date: selectedDate, startTime: selectedSlot, endTime: `${parseInt(selectedSlot) + 1}:00` },
        amount: selectedSport.price,
        paymentStatus: 'paid',
        status: 'confirmed',
      });
      setSuccess(true);
    } catch (err) { alert(err.response?.data?.message || 'Booking failed'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <Layout title="Sports Booking">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={40} color="#10b981" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Booking Confirmed! 🎉</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Your {selectedSport.label} slot at {selectedVenue} on {selectedDate} ({selectedSlot}) is confirmed.</p>
          <button className="btn-primary" onClick={() => { setSuccess(false); setStep(1); setSelectedSport(null); setSelectedSlot(''); }}>Book Another Slot</button>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout title="Sports Booking">
      {/* Progress Steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        {[{ n: 1, label: 'Sport' }, { n: 2, label: 'Venue & Date' }, { n: 3, label: 'Time Slot' }, { n: 4, label: 'Confirm' }].map(({ n, label }, i, arr) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step >= n ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: step >= n ? 'white' : '#64748b'
              }}>{n}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: step >= n ? '#f1f5f9' : '#64748b' }}>{label}</span>
            </div>
            {i < arr.length - 1 && <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.1)' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Sport */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Choose Your Sport</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {sports.map(sport => (
              <button key={sport.id} onClick={() => { setSelectedSport(sport); setStep(2); }}
                style={{
                  background: selectedSport?.id === sport.id ? `${sport.color}25` : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${selectedSport?.id === sport.id ? sport.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20, padding: '32px 20px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${sport.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{sport.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{sport.label}</div>
                <div style={{ fontSize: 13, color: sport.color, fontWeight: 600, marginTop: 6 }}>₹{sport.price}/hr</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Venue & Date */}
      {step === 2 && (
        <div style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            {selectedSport.emoji} {selectedSport.label} — Choose Venue & Date
          </h2>
          <div className="glass" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Venue</label>
              <select className="form-input" value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)}>
                <option value="">Select Venue</option>
                {venues[selectedSport.id]?.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 28 }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" min={today} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(3)} disabled={!selectedVenue || !selectedDate} style={{ flex: 1, justifyContent: 'center' }}>Check Availability</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Slot Selection */}
      {step === 3 && (
        <div style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Available Time Slots</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>{selectedVenue} · {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {availableSlots.map(slot => (
              <button key={slot} onClick={() => setSelectedSlot(slot)}
                style={{
                  background: selectedSlot === slot ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedSlot === slot ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12, padding: '14px 10px', cursor: 'pointer',
                  color: selectedSlot === slot ? 'white' : '#f1f5f9', fontWeight: 600, fontSize: 14,
                  transition: 'all 0.2s'
                }}>
                {slot}
              </button>
            ))}
            {availableSlots.length === 0 && <p style={{ gridColumn: 'span 4', color: '#64748b', textAlign: 'center', padding: 20 }}>No slots available for this date. Try another date.</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(4)} disabled={!selectedSlot} style={{ flex: 1, justifyContent: 'center' }}>Continue</button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div style={{ maxWidth: 500 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Confirm Your Booking</h2>
          <div className="glass" style={{ padding: 28, marginBottom: 20 }}>
            {[
              { label: 'Sport', value: `${selectedSport.emoji} ${selectedSport.label}` },
              { label: 'Venue', value: selectedVenue },
              { label: 'Date', value: new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: 'Time Slot', value: `${selectedSlot} – ${`${parseInt(selectedSlot) + 1}:00`}` },
              { label: 'Duration', value: '1 hour' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', marginTop: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Total Amount</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#10b981' }}>₹{selectedSport.price}</span>
            </div>
          </div>
          <div style={{ class: 'glass', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={18} color="#6366f1" />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Payment will be processed securely via Razorpay</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setStep(3)}>Back</button>
            <button className="btn-primary" onClick={handleBook} disabled={loading} style={{ flex: 1, justifyContent: 'center', padding: '13px 24px' }}>
              {loading ? 'Booking...' : '✓ Confirm & Pay ₹' + selectedSport.price}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
