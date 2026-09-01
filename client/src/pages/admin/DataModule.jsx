import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import {
  Search, MapPin, Phone, Plus, ExternalLink, Filter, X,
  CheckCircle2, FileSpreadsheet, Loader2, Target
} from 'lucide-react';

export default function DataModule() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  /* Pre-fill search from URL query param e.g. ?search=11110001 (read once on mount) */
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Add-to-lead modal state
  const [leadTarget, setLeadTarget] = useState(null);
  const [modalLeadType, setModalLeadType] = useState('Offline');
  const [modalSport, setModalSport] = useState('other');
  const [modalNotes, setModalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/leads/locations');
        const locations = data || [];
        setData(locations);

        const REMOVED_CATEGORIES = ['Dindigul','Kanniyakumari','Karur','Nagapattinam','Thoothukudi','Tirunelveli','Tirupattur'];
        const uniqueDistricts = [...new Set(locations.map(item => item.district).filter(Boolean))].sort();
        const uniqueCategories = [...new Set(locations.map(item => item.category).filter(Boolean))].sort().filter(c => !REMOVED_CATEGORIES.includes(c));

        setDistricts(uniqueDistricts);
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Failed to fetch data module records', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = data;
    if (filterDistrict) {
      filtered = filtered.filter(item => item.district === filterDistrict);
    }
    if (filterCategory) {
      filtered = filtered.filter(item => item.category === filterCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.district && item.district.toLowerCase().includes(q)) ||
        (item.phone && String(item.phone).toLowerCase().includes(q)) ||
        (item.sno && String(item.sno).toLowerCase().includes(q)) ||
        (item.displayAddress && item.displayAddress.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [data, search, filterDistrict, filterCategory]);

  const openAddLead = (item) => {
    setLeadTarget(item);
    setModalLeadType('Offline');
    setModalSport(item.category?.toLowerCase() || 'other');
    setModalNotes('');
  };

  const closeAddLead = () => {
    setLeadTarget(null);
  };

  const handleAddLead = async () => {
    if (!leadTarget) return;
    setSubmitting(true);
    try {
      const payload = {
        name: leadTarget.name,
        sportsPlaceName: leadTarget.name,
        phone: leadTarget.phone || '',
        sno: leadTarget.sno || '',
        district: leadTarget.district || '',
        category: leadTarget.category || 'other',
        location: { address: leadTarget.displayAddress || leadTarget.address || leadTarget.name, lat: leadTarget.location?.lat, lng: leadTarget.location?.lng },
        contactAvailability: leadTarget.contactAvailability || 'Yes',
        source: 'excel_import',
        status: 'New Lead',
        leadType: modalLeadType,
        sport: modalSport,
        notes: modalNotes,
      };
      await API.post('/leads', payload);
      setToast({ type: 'success', message: `Lead "${leadTarget.name}" added successfully` });
      closeAddLead();
    } catch (error) {
      console.error('Failed to add lead:', error);
      setToast({ type: 'error', message: error.response?.data?.message || 'Failed to add lead' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <Layout title="Data Module">
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 99999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 18px', borderRadius: 12,
          fontSize: 13, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.25s ease'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h2 className="section-title" style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={20} />
            Tamil Nadu Sports Facilities — Master Data
          </h2>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            {data.length > 0 ? `${filteredData.length} of ${data.length} records from Excel import` : 'Loading records from Excel source...'}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="glass filter-bar">
        <div style={{ position: 'relative', flex: 2, width: '100%'}}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input filter-search" style={{ paddingLeft: 34 }}
            placeholder="Search name, district, phone, R.No..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={12} color="#64748b" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }} />
          <select className="form-input filter-select" style={{ paddingLeft: 26 }} value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={12} color="#64748b" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }} />
          <select className="form-input filter-select" style={{ paddingLeft: 26 }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(filterDistrict || filterCategory || search) && (
          <button className="btn-secondary" onClick={() => { setFilterDistrict(''); setFilterCategory(''); setSearch(''); }}>
            <X size={14} /> Reset
          </button>
        )}
        <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }} className="filter-count">
          Showing {filteredData.length} of {data.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="glass table-wrapper">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Loader2 size={40} style={{ margin: '0 auto 16px', animation: 'spin 0.8s linear infinite', color: 'var(--primary)' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Loading master data...</p>
          </div>
        ) : (
          <div style={{ maxHeight: '75vh', overflow: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#1e1e2d' }}>
                <tr>
                  <th>R.No</th>
                  <th>District</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'center' }}>Maps</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
                      <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.5 }}>🔍</div>
                      No data found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : filteredData.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{item.sno || '—'}</td>
                    <td>
                      {item.district ? (
                        <span style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {item.district}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13, maxWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={13} style={{ flexShrink: 0 }} color="#ff6b6b" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      {item.category ? (
                        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {item.category}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8', maxWidth: 280 }}>{item.displayAddress || '—'}</td>
                    <td>
                      {item.phone ? (
                        <a href={`tel:${item.phone}`} style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                          <Phone size={12} color="#10b981" />
                          {item.phone}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.location?.lat && item.location?.lng ? (
                        <a href={`https://www.google.com/maps?q=${item.location.lat},${item.location.lng}`} target="_blank" rel="noopener noreferrer"
                          title="Open in Google Maps"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}>
                          <ExternalLink size={14} />
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 8 }}
                        onClick={() => openAddLead(item)}>
                        <Plus size={13} /> Add to Lead
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add to Lead Modal ── */}
      {leadTarget && (
        <div className="modal-overlay" onClick={closeAddLead}>
          <div className="modal-window" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAddLead}><X size={18} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(173,255,47,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Target size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Add to Lead</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{leadTarget.name}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label className="form-label">Lead Type</label>
                <select className="form-input" value={modalLeadType} onChange={e => setModalLeadType(e.target.value)}>
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div>
                <label className="form-label">Sport</label>
                <select className="form-input" value={modalSport} onChange={e => setModalSport(e.target.value)}>
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                  <option value="badminton">Badminton</option>
                  <option value="basketball">Basketball</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Notes (Optional)</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical' }}
                placeholder="Add any notes about this facility..."
                value={modalNotes} onChange={e => setModalNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={closeAddLead}>Cancel</button>
              <button className="btn-primary" disabled={submitting} onClick={handleAddLead}
                style={{ background: 'var(--primary)', color: '#000', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Target size={15} />}
                {submitting ? 'Adding...' : 'Create Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
