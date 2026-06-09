import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import API from '../../api/axios';
import { Search } from 'lucide-react';

export default function DataModule() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await API.get('/leads/locations');
        const locations = (response.data || []).map((item, index) => ({
          ...item,
          rNo: String(11110001 + index)
        }));
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
        (item.rNo && item.rNo.includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.district && item.district.toLowerCase().includes(q)) ||
        (item.phone && String(item.phone).toLowerCase().includes(q)) ||
        (item.sno && String(item.sno).toLowerCase().includes(q)) ||
        (item.displayAddress && item.displayAddress.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [data, search, filterDistrict, filterCategory]);

  return (
    <Layout title="Data Module">
      {/* ── Filters ── */}
      <div className="glass filter-bar">
        <div style={{ position: 'relative', flex: 2, width: '100%' }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search name, district, phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input filter-select" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="form-input filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          Showing {filteredData.length} of {data.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="glass table-wrapper">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div style={{ maxHeight: '75vh' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#1e1e2d' }}>
                <tr>
                  <th>R.No</th>
                  <th>District</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Address</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>No data found.</td></tr>
                ) : filteredData.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{item.rNo}</td>
                    <td>
                      {item.district ? (
                        <span style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {item.district}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</td>
                    <td>
                      {item.category ? (
                        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {item.category}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8', maxWidth: 300 }}>{item.displayAddress || '—'}</td>
                    <td>{item.phone || '—'}</td>
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
