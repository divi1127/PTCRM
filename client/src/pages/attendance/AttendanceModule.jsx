import React, { useState, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, Clock, User } from 'lucide-react';
import API from '../../api/axios';
import Layout from '../../components/Layout';

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

export default function AttendanceModule() {
  const [location, setLocation] = useState(null);
  const [checking, setChecking] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => {
        console.warn('Geolocation error:', err);
      });
    }
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const { data } = await API.get('/attendance/me');
      setAttendance(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelfieFile(file);
    const base64 = await toBase64(file);
    setSelfiePreview(base64);
  };

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      await API.post('/attendance/check-in', {
        location,
        selfie: selfiePreview,
        notes: 'Face selfie check-in'
      });
      await fetchTodayAttendance();
      alert('Checked in successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Unable to check in.');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    try {
      await API.post('/attendance/check-out', {
        location,
        selfie: selfiePreview,
        notes: 'Face selfie check-out'
      });
      await fetchTodayAttendance();
      alert('Checked out successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Unable to check out.');
    } finally {
      setChecking(false);
    }
  };

  const checkInTime = attendance?.checkIn?.time ? new Date(attendance.checkIn.time).toLocaleTimeString() : null;
  const checkOutTime = attendance?.checkOut?.time ? new Date(attendance.checkOut.time).toLocaleTimeString() : null;

  return (
    <Layout title="Attendance">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Daily Attendance</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Mark attendance with selfie and GPS verification</p>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card glass-hover" style={{ padding: 24, textAlign: 'center', borderRadius: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Clock size={28} />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h2>
          <p style={{ color: '#64748b', marginBottom: 20, fontSize: 13 }}>{new Date().toDateString()}</p>

          <div style={{ marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', color: location ? '#10b981' : '#ef4444', fontSize: 12 }}>
              <MapPin size={14} />
              {location ? `GPS Locked (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Acquiring GPS...'}
            </div>
            <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {checkInTime ? (
                 <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Checked in at <strong style={{ color: '#10b981' }}>{checkInTime}</strong></span>
              ) : 'Not checked in yet'}
              {checkOutTime && (
                 <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Checked out at <strong style={{ color: '#f87171' }}>{checkOutTime}</strong></span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Upload Selfie</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="form-input" style={{ fontSize: 13 }} />
            {selfiePreview && (
              <img src={selfiePreview} alt="Selfie preview" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', marginTop: 12, border: '2px solid var(--primary)', margin: '12px auto' }} />
            )}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <button
              className="btn-primary"
              style={{ padding: '14px', borderRadius: 12, justifyContent: 'center', fontSize: 15 }}
              onClick={handleCheckIn}
              disabled={checking || !location || !selfiePreview || Boolean(attendance?.checkIn?.time)}
            >
              <Camera size={18} /> Check In
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '14px', borderRadius: 12, justifyContent: 'center', fontSize: 15 }}
              onClick={handleCheckOut}
              disabled={checking || !attendance?.checkIn?.time || Boolean(attendance?.checkOut?.time)}
            >
              <CheckCircle size={18} /> Check Out
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
