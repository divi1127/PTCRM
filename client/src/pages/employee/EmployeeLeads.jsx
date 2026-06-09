import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Phone, Search, MapPin, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import WhatsAppButton from '../../components/WhatsAppButton';

const STATUS_LIST = ['New Lead', 'Follow-up', 'Demo Scheduled (Online)', 'Demo Scheduled (Offline)', 'Converted', 'Closed'];

const statusColors = {
  'New Lead':             { bg: 'rgba(173,255,47,0.1)',  color: '#adff2f' },
  'Follow-up':            { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' },
  'Demo Scheduled (Online)':  { bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
  'Demo Scheduled (Offline)': { bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
  'Converted':            { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
  'Closed':               { bg: 'rgba(239,68,68,0.1)',  color: '#f87171' },
};

const normalizeStatus = (status) => {
  if (!status) return 'New Lead';
  const value = String(status).trim();
  if (/^new$/i.test(value)) return 'New Lead';
  if (/follow/i.test(value)) return 'Follow-up';
  if (/demo/i.test(value)) return 'Demo Scheduled';
  if (/convert/i.test(value)) return 'Converted';
  if (/close|reject/i.test(value)) return 'Closed';
  return value;
};

const getStatusLabel = (lead) => {
  const status = normalizeStatus(lead.status);
  if (status === 'Demo Scheduled') {
    return `Demo Scheduled (${lead.leadType || 'Offline'})`;
  }
  return status;
};

const getFilterQueryStatus = (filterStatus) => {
  if (!filterStatus) return '';
  return filterStatus.startsWith('Demo Scheduled') ? 'Demo Scheduled' : filterStatus;
};

const matchStatusFilter = (lead, filter) => {
  if (!filter) return true;
  const status = normalizeStatus(lead.status);
  if (filter.startsWith('Demo Scheduled')) {
    return status === 'Demo Scheduled' && getStatusLabel(lead) === filter;
  }
  return status === filter;
};

const PAGE_SIZE = 30;

export default function EmployeeLeads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (filterStatus) params.status = getFilterQueryStatus(filterStatus);
      if (search) params.search = search;
      const { data } = await API.get('/leads', { params });
      const list = Array.isArray(data) ? data : (data.leads || []);
      setLeads(list);
      setTotal(Array.isArray(data) ? list.length : (data.total || list.length));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [filterStatus, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Layout title="My Leads">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>My Lead Pipeline</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{total} leads assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass filter-bar">
        <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, width: '100%' }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search name, district, phone…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </form>
        <select className="form-input filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" className="btn-secondary" style={{ padding: '10px 16px' }} onClick={() => { setPage(1); fetchLeads(); }}>
          <Filter size={14} /> Apply
        </button>
      </div>

      {/* Status Summary Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_LIST.map((s) => {
          const count = leads.filter(l => matchStatusFilter(l, s)).length;
          const col = statusColors[s] || {};
          return (
            <button key={s}
              onClick={() => { setFilterStatus(filterStatus === s ? '' : s); setPage(1); }}
              style={{
                background: filterStatus === s ? col.bg : 'rgba(255,255,255,0.04)',
                color: filterStatus === s ? col.color : '#64748b',
                border: `1px solid ${filterStatus === s ? col.color + '40' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass table-wrapper" style={{ marginBottom: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sports Place</th>
                  <th>District</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No leads assigned</td></tr>
                ) : leads.map((lead, i) => {
                  const sc = statusColors[lead.status] || statusColors['New'];
                  return (
                    <tr key={lead._id}>
                      <td style={{ color: '#475569', fontSize: 12 }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.sportsPlaceName || lead.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td>
                        {lead.district ? (
                          <span style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                            {lead.district}
                          </span>
                        ) : (
                          <span style={{ color: '#475569', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <Phone size={12} color="#adff2f" />
                          <span style={{ fontFamily: 'monospace' }}>{lead.phone}</span>
                        </div>
                        {lead.location?.address && (
                          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <MapPin size={10} /> {lead.location.address}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ background: sc.bg, color: sc.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {lead.status}
                        </span>
                      </td>
                      <td>
                        <WhatsAppButton phone={lead.phone} name={lead.sportsPlaceName || lead.name} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn-secondary" style={{ padding: '8px 14px' }}
            disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Page <strong style={{ color: '#f1f5f9' }}>{page}</strong> / {totalPages}
          </span>
          <button className="btn-secondary" style={{ padding: '8px 14px' }}
            disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </Layout>
  );
}
