import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { DollarSign, FileText, Download, Filter, Search, Plus, CreditCard, Clock } from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data } = await API.get('/reports/payments');
      setPayments(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Financial Management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Invoices & Collections</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Track payment status and generate invoices</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} /> Record Payment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ padding: 10, background: 'rgba(173, 255, 47, 0.1)', borderRadius: 10 }}><DollarSign size={20} color="var(--primary)" /></div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Collected</p>
              <p style={{ fontSize: 20, fontWeight: 800 }}>₹{payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ padding: 10, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 10 }}><Clock size={20} color="#f59e0b" /></div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending Clearance</p>
              <p style={{ fontSize: 20, fontWeight: 800 }}>₹{payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
             <div style={{ padding: 10, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 10 }}><FileText size={20} color="#8b5cf6" /></div>
             <div>
               <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Invoices</p>
               <p style={{ fontSize: 20, fontWeight: 800 }}>{payments.length}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 20, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : payments.length === 0 ? (
               <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No payment records found.</td></tr>
            ) : payments.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>INV-{p._id.slice(-6).toUpperCase()}</td>
                <td>
                   <div style={{ fontWeight: 600 }}>{p.client?.name || p.customerName}</div>
                   <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.client?.organization}</div>
                </td>
                <td><div style={{ fontWeight: 700 }}>₹{p.amount.toLocaleString()}</div></td>
                <td style={{ fontSize: 13 }}>{new Date(p.date).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <CreditCard size={14} color="var(--text-muted)" /> {p.method}
                  </div>
                </td>
                <td>
                  <span className={`badge ${p.status === 'Paid' ? 'badge-converted' : 'badge-contacted'}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
