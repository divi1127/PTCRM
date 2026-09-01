import React, { useEffect, useState, useMemo } from 'react';

const DISTRICT_COORDS = {
  'Ariyalur':        { lat: 11.1400, lng: 79.0800 },
  'Chengalpattu':    { lat: 12.6921, lng: 79.9765 },
  'Chennai':         { lat: 13.0827, lng: 80.2707 },
  'Coimbatore':      { lat: 11.0168, lng: 76.9558 },
  'Cuddalore':       { lat: 11.7480, lng: 79.7714 },
  'Dharmapuri':      { lat: 12.1277, lng: 78.1580 },
  'Dindigul':        { lat: 10.3624, lng: 77.9695 },
  'Erode':           { lat: 11.3410, lng: 77.7172 },
  'Kallakurichi':    { lat: 11.7380, lng: 78.9590 },
  'Kanchipuram':     { lat: 12.8342, lng: 79.7036 },
  'Kanniyakumari':   { lat: 8.0883,  lng: 77.5385 },
  'Karur':           { lat: 10.9601, lng: 78.0766 },
  'Krishnagiri':     { lat: 12.5186, lng: 78.2137 },
  'Madurai':         { lat: 9.9252,  lng: 78.1198 },
  'Mayiladuthurai':  { lat: 11.1015, lng: 79.6520 },
  'Nagapattinam':    { lat: 10.7672, lng: 79.8449 },
  'Namakkal':        { lat: 11.2189, lng: 78.1674 },
  'Nilgiris':        { lat: 11.4916, lng: 76.7337 },
  'Perambalur':      { lat: 11.2342, lng: 78.8802 },
  'Pudukkottai':     { lat: 10.3797, lng: 78.8214 },
  'Ramanathapuram':  { lat: 9.3639,  lng: 78.8395 },
  'Ranipet':         { lat: 12.9228, lng: 79.3331 },
  'Salem':           { lat: 11.6643, lng: 78.1460 },
  'Sivagangai':      { lat: 9.8477,  lng: 78.4800 },
  'Tenkasi':         { lat: 8.9593,  lng: 77.3152 },
  'Thanjavur':       { lat: 10.7870, lng: 79.1378 },
  'Theni':           { lat: 10.0104, lng: 77.4770 },
  'Thoothukudi':     { lat: 8.7642,  lng: 78.1348 },
  'Tirunelveli':     { lat: 8.7139,  lng: 77.7567 },
  'Tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
  'Tirupathur':      { lat: 12.4963, lng: 78.5624 },
  'Tiruppur':        { lat: 11.1085, lng: 77.3411 },
  'Tiruvallur':      { lat: 13.1231, lng: 79.9079 },
  'Tiruvannamalai':  { lat: 12.2253, lng: 79.0747 },
  'Tiruvarur':       { lat: 10.7726, lng: 79.6366 },
  'Vellore':         { lat: 12.9165, lng: 79.1325 },
  'Viluppuram':      { lat: 11.9401, lng: 79.4861 },
  'Virudhunagar':    { lat: 9.5851,  lng: 77.9624 },
};

const getDistrictCoords = (district, idx) => {
  const base = DISTRICT_COORDS[district];
  if (!base) return { lat: 11.1271, lng: 78.6569 };
  const jitter = 0.022;
  const angle = (idx * 137.508) % 360;
  const r = jitter * Math.sqrt((idx % 30) / 30);
  return {
    lat: base.lat + r * Math.cos(angle * Math.PI / 180),
    lng: base.lng + r * Math.sin(angle * Math.PI / 180),
  };
};
import { NavLink, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, Phone, Navigation, MapPin, Filter, X, Target, 
  CheckCircle2, Star, RefreshCw, Map as MapIcon,
  LayoutGrid, Plus, Loader2, Menu, LogOut, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({ 
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', 
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', 
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] 
});

const greenIcon = new L.Icon({ 
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', 
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', 
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] 
});

const yellowIcon = new L.Icon({ 
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png', 
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', 
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] 
});

const getCategoryIcon = (category, isCompleted) => {
  if (isCompleted) return greenIcon;
  const cat = category?.toLowerCase() || '';
  if (cat.includes('stadium') || cat.includes('ground')) return blueIcon;
  if (cat.includes('turf') || cat.includes('football')) return yellowIcon;
  return blueIcon;
};

const MapInvalidator = ({ active }) => {
  const map = useMap();
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => map.invalidateSize(true), 250);
      return () => clearTimeout(t);
    }
  }, [active, map]);
  return null;
};

const LocationPopupContent = ({ item, lat, lng, onAddLead, isCompleted, onToggleComplete }) => (
  <div style={{ width: 270, background: '#fff', borderRadius: 16, overflow: 'hidden', fontFamily: 'inherit' }}>
    {/* Header strip */}
    <div style={{ background: 'linear-gradient(135deg,#1e40af 0%,#2563eb 100%)', padding: '12px 14px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 6 }}>
          {item.category || 'OTHER'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}>#{(item.sno || 'N/A').toString().padStart(4, '0')}</span>
      </div>
      <h4 style={{ color: '#fff', fontWeight: 900, fontSize: 14, lineHeight: 1.3, margin: 0 }}>{item.name}</h4>
    </div>

    {/* Body */}
    <div style={{ padding: '10px 14px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
        <MapPin size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, lineHeight: 1.4 }}>{item.location?.address || item.address || 'Address N/A'}</span>
      </div>

      {item.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Phone size={12} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{item.phone}</span>
        </div>
      )}

      {/* Call + Direction */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <a
          href={`tel:${item.phone}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 36, borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a', fontSize: 11, fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          <Phone size={13} /> CALL
        </a>
        <a
          href={item.googleMapsLink || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 36, borderRadius: 10, background: '#eff6ff', border: '1.5px solid #93c5fd', color: '#1d4ed8', fontSize: 11, fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          <Navigation size={13} /> DIRECTION
        </a>
      </div>

      {/* Mark + Add Lead */}
      <div style={{ display: 'flex', gap: 8 }}>
        {onToggleComplete && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(item._id); }}
            style={{ flex: 1, height: 34, borderRadius: 10, border: isCompleted ? '1.5px solid #a7f3d0' : '1.5px solid #e2e8f0', background: isCompleted ? '#ecfdf5' : '#f8fafc', color: isCompleted ? '#047857' : '#475569', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer' }}
          >
            {isCompleted ? <CheckCircle2 size={13} /> : <Star size={13} />}
            {isCompleted ? 'Visited' : 'Mark'}
          </button>
        )}
        {onAddLead && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddLead(item); }}
            style={{ flex: 1, height: 34, borderRadius: 10, border: item.existingLead ? '1.5px solid #93c5fd' : '1.5px solid #6ee7b7', background: item.existingLead ? '#eff6ff' : '#f0fdf4', color: item.existingLead ? '#1d4ed8' : '#047857', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer' }}
          >
            {item.existingLead ? <Target size={13} /> : <Plus size={13} strokeWidth={2.5} />}
            {item.existingLead ? 'View Lead' : 'Add Lead'}
          </button>
        )}
      </div>
    </div>
  </div>
);

const MapView = ({ items, selectedItem, onItemClick, completedItems, onAddLead, toggleComplete }) => {
  const markerRefs = React.useRef({});
  const map = useMap();

  useEffect(() => {
    if (selectedItem && selectedItem.location?.lat && selectedItem.location?.lng) {
      const { lat, lng } = selectedItem.location;
      const invalidateAndFly = () => {
        map.invalidateSize();
        map.flyTo([lat, lng], 16, { duration: 1.2 });
        setTimeout(() => {
          const marker = markerRefs.current[selectedItem._id];
          if (marker) marker.openPopup();
        }, 1500);
      };
      const timer = setTimeout(invalidateAndFly, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedItem, map]);
  
  return (
    <>
      <TileLayer 
        attribution='&copy; OpenStreetMap contributors' 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />
      <ZoomControl position="bottomright" />
      
      <MarkerClusterGroup 
        chunkedLoading 
        showCoverageOnHover={false} 
        spiderfyOnMaxZoom={true}
      >
        {items.map((item) => {
          const lat = item.location?.lat;
          const lng = item.location?.lng;
          if (!lat || !lng) return null;
          
          return (
            <Marker 
              key={item._id} 
              position={[lat, lng]} 
              ref={(ref) => { if (ref) markerRefs.current[item._id] = ref; }}
              icon={getCategoryIcon(item.category, completedItems.includes(item._id))}
              eventHandlers={{ click: () => onItemClick(item) }}
            >
              <Popup className="custom-popup" offset={[0, -30]}>
                <LocationPopupContent 
                  item={item} 
                  lat={lat} 
                  lng={lng} 
                  onAddLead={onAddLead} 
                  isCompleted={completedItems.includes(item._id)}
                  onToggleComplete={toggleComplete}
                />
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
      
      {selectedItem && selectedItem.location?.lat && (
        <Marker 
          position={[selectedItem.location.lat, selectedItem.location.lng]} 
          icon={redIcon} 
          zIndexOffset={1000}
        >
          <Popup className="custom-popup" offset={[0, -30]}>
            <LocationPopupContent 
              item={selectedItem} 
              lat={selectedItem.location.lat} 
              lng={selectedItem.location.lng} 
              onAddLead={onAddLead} 
              isCompleted={completedItems.includes(selectedItem._id)}
              onToggleComplete={toggleComplete}
            />
          </Popup>
        </Marker>
      )}
    </>
  );
};

export default function MapModule({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [completedItems, setCompletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVisitedOnly, setShowVisitedOnly] = useState(false);
  // mobile: 'list' | 'map'
  const [mobileView, setMobileView] = useState('list');
  // mobile: is the app sidebar nav open?
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [leadTarget, setLeadTarget] = useState(null);
  const [viewLeadTarget, setViewLeadTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [leadType, setLeadType] = useState('Field Visit');
  const [sport, setSport] = useState('other');
  const [contactPerson, setContactPerson] = useState('');
  const [contactRole, setContactRole] = useState('Owner');
  const [leadPhone, setLeadPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [leadStatus, setLeadStatus] = useState('New Lead');
  const [interestLevel, setInterestLevel] = useState('Medium');
  const [clientRequirement, setClientRequirement] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);

  const toggleComplete = async (id) => {
    try {
      const res = await API.post(`/leads/locations/${id}/visit`);
      setItems(prev => prev.map(it => it._id === id ? { 
        ...it, 
        isVisited: true, 
        visitedByName: user?.name, 
        visitedAt: new Date() 
      } : it));
      setCompletedItems(prev => prev.includes(id) ? prev : [...prev, id]);
      showToast('Marked location as visited', 'success');
    } catch (err) {
      console.error('Visit error:', err);
      setCompletedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [locationsRes, districtsRes] = await Promise.all([
          API.get('/leads/locations'),
          API.get('/leads/districts')
        ]);
        
        const districtIdx = {};
        const dataWithCoords = (locationsRes.data || []).map((loc) => {
          if (!loc.location?.lat) {
            const d = loc.district || '';
            districtIdx[d] = (districtIdx[d] || 0) + 1;
            return { ...loc, location: { ...loc.location, ...getDistrictCoords(d, districtIdx[d]) } };
          }
          return loc;
        });
        setItems(dataWithCoords);
        setDistricts(districtsRes.data || []);
      } catch (err) {
        console.error('Error fetching map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = useMemo(() => items.filter(it => {
    if (showVisitedOnly) {
      const isVisited = it.isVisited || completedItems.includes(it._id);
      if (!isVisited) return false;
    }
    if (selectedDistrict && it.district !== selectedDistrict) return false;
    if (selectedCategory && it.category !== selectedCategory) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      it.name?.toLowerCase().includes(q) ||
      it.district?.toLowerCase().includes(q) ||
      it.category?.toLowerCase().includes(q) ||
      it.address?.toLowerCase().includes(q) ||
      it.location?.address?.toLowerCase().includes(q)
    );
  }), [items, selectedDistrict, selectedCategory, searchTerm, showVisitedOnly, completedItems]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [selectedDistrict, selectedCategory, searchTerm, showVisitedOnly]);

  const handleSync = async () => {
    try {
      setLoading(true);
      await API.post('/import/sync');
      const [locationsRes, districtsRes] = await Promise.all([
        API.get('/leads/locations'),
        API.get('/leads/districts')
      ]);
      
      const districtIdx2 = {};
      const dataWithCoords = (locationsRes.data || []).map((loc) => {
        if (!loc.location?.lat) {
          const d = loc.district || '';
          districtIdx2[d] = (districtIdx2[d] || 0) + 1;
          return { ...loc, location: { ...loc.location, ...getDistrictCoords(d, districtIdx2[d]) } };
        }
        return loc;
      });
      setItems(dataWithCoords);
      setDistricts(districtsRes.data || []);
      showToast('Data synced with Excel successfully', 'success');
    } catch (err) {
      console.error('Sync failed:', err);
      showToast(err.response?.data?.message || 'Sync failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddLead = (item) => {
    if (item.existingLead) {
      setViewLeadTarget(item);
      return;
    }
    setLeadTarget(item);
    setContactPerson(item.contactPerson || '');
    setContactRole('Owner');
    setLeadPhone(item.phone || '');
    setAlternatePhone('');
    setLeadType('Field Visit');
    setLeadStatus('New Lead');
    setInterestLevel('Medium');
    setClientRequirement('');
    setFollowUpDate('');
    setNotes('');
  };

  const closeAddLead = () => {
    setLeadTarget(null);
  };

  const handleAddLead = async () => {
    if (!leadTarget) return;
    setSubmitting(true);
    try {
      const payload = {
        sportsPlaceId: leadTarget._id,
        name: leadTarget.name,
        sportsPlaceName: leadTarget.name,
        phone: leadPhone || leadTarget.phone || '',
        alternatePhone,
        contactPerson,
        contactRole,
        sno: leadTarget.sno || '',
        district: leadTarget.district || '',
        category: leadTarget.category || 'Other',
        location: { 
          address: leadTarget.location?.address || leadTarget.address || leadTarget.name, 
          lat: leadTarget.location?.lat, 
          lng: leadTarget.location?.lng 
        },
        contactAvailability: leadTarget.contactAvailability || 'Yes',
        source: 'field',
        status: leadStatus || 'New Lead',
        leadType: leadType || 'Field Visit',
        interestLevel: interestLevel || 'Medium',
        clientRequirement,
        followUpDate: followUpDate || null,
        notes,
      };
      const res = await API.post('/leads', payload);
      showToast(`Lead "${leadTarget.name}" added to Lead Generation!`, 'success');
      
      // Update location list item to reflect lead created
      setItems(prev => prev.map(it => it._id === leadTarget._id ? {
        ...it,
        existingLead: {
          _id: res.data._id,
          status: res.data.status,
          contactPerson: res.data.contactPerson,
          createdAt: res.data.createdAt
        }
      } : it));

      closeAddLead();
    } catch (error) {
      console.error('Failed to create lead:', error);
      if (error.response?.data?.lead) {
        showToast('Lead already exists for this location.', 'error');
        setViewLeadTarget(leadTarget);
        closeAddLead();
      } else {
        showToast(error.response?.data?.message || 'Failed to create lead', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = items.length > 0 ? Math.round((completedItems.length / items.length) * 100) : 0;

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden" id="gis-main-container" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* GIS Header */}
      <div className="h-14 border-b border-slate-200 flex items-center gap-2 px-3 bg-white shrink-0 z-20 shadow-sm">
        {/* Desktop sidebar toggle */}
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 transition-all shrink-0"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>
        )}
        {/* Mobile nav toggle */}
        <button
          onClick={() => setIsNavOpen(true)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 transition-all shrink-0"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Menu size={18} />
        </button>

        {/* Logo + Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#29A0E6] rounded-lg flex items-center justify-center text-white shadow-sm">
            <MapIcon size={17} />
          </div>
          <div className="hidden sm:block">
            <div className="font-black text-[#1A2332] text-[14px] leading-none tracking-tight">TN Sports GIS</div>
            <div className="text-[9px] text-slate-400 font-bold tracking-[0.12em] uppercase mt-0.5">Location Intelligence</div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Visited filter toggle */}
        <button
          onClick={() => setShowVisitedOnly(v => !v)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold transition-all shrink-0"
          style={{
            background: showVisitedOnly ? '#ecfdf5' : '#f8fafc',
            border: showVisitedOnly ? '1.5px solid #6ee7b7' : '1.5px solid #e2e8f0',
            color: showVisitedOnly ? '#047857' : '#64748b',
            cursor: 'pointer',
          }}
        >
          <CheckCircle2 size={13} />
          <span className="hidden sm:inline">{showVisitedOnly ? 'Visited Only' : 'Visited'}</span>
        </button>

        {/* Mobile view toggle */}
        <div className="lg:hidden flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setMobileView('list')}
            className={`flex items-center justify-center gap-1 rounded-md text-xs font-bold px-2.5 h-7 transition-colors ${
              mobileView === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            }`}
            style={{ background: mobileView === 'list' ? '#fff' : 'none', border: 'none', cursor: 'pointer' }}
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`flex items-center justify-center gap-1 rounded-md text-xs font-bold px-2.5 h-7 transition-colors ${
              mobileView === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            }`}
            style={{ background: mobileView === 'map' ? '#fff' : 'none', border: 'none', cursor: 'pointer' }}
          >
            <MapIcon size={13} />
          </button>
        </div>

        {/* Sync */}
        <button
          onClick={handleSync}
          disabled={loading}
          title="Sync with Excel"
          className={`flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 transition-all shrink-0 ${loading ? 'animate-spin' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-slate-50 relative" style={{ paddingTop: 0 }}>

        {/* Map Side */}
        <div className={`flex-1 relative bg-slate-200 ${
          mobileView === 'map' ? 'flex' : 'hidden lg:flex'
        } flex-col`}>
          {loading ? (
            <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw size={40} className="text-primary-600 animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Loading GIS Data...</p>
              </div>
            </div>
          ) : null}
          
          <MapContainer 
            center={[11.1271, 78.6569]} 
            zoom={7} 
            className="w-full h-full z-10" 
            zoomControl={false}
          >
            <MapInvalidator active={mobileView === 'map' || (typeof window !== 'undefined' && window.innerWidth > 1024)} />
            <MapView 
              items={filteredItems} 
              selectedItem={selectedItem} 
              onItemClick={setSelectedItem} 
              completedItems={completedItems}
              onAddLead={openAddLead}
              toggleComplete={toggleComplete}
            />
          </MapContainer>
          
          {/* Map Overlay Badge */}
          <div className="absolute top-4 lg:top-4 left-4 z-20 bg-white/95 backdrop-blur shadow-lg border border-slate-200 rounded-xl p-2 flex items-center gap-2 px-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">GIS ACTIVE</span>
          </div>
        </div>

        {/* Sidebar Side */}
        <div className={`
          ${ mobileView === 'list' ? 'flex' : 'hidden'} 
          lg:flex
          flex-col overflow-hidden bg-white border-l border-slate-200 shadow-xl z-30
          w-full lg:w-[360px] lg:min-w-[350px] lg:max-w-[360px]
          absolute inset-0 lg:relative
          lg:mt-0
        `}>
          {/* Sidebar Header */}
          <div className="px-4 pt-3 pb-3 border-b border-slate-200 shrink-0 bg-white">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className="font-bold text-slate-800">Locations</span>
              <button onClick={() => setMobileView('map')} className="text-slate-400" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Search */}
            <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2.5 gap-2 mb-3 border border-slate-100">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search shops or address..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-700 font-medium placeholder-slate-400 min-w-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button onClick={() => setSearchTerm('')}><X size={14} className="text-slate-400" /></button>}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="relative min-w-0">
                <select 
                  className="w-full min-w-0 border border-slate-200 rounded-lg text-[11px] font-bold uppercase appearance-none bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ height: 34, padding: '0 28px 0 10px', lineHeight: '34px' }}
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="">All Districts</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <Filter size={12} className="absolute right-2.5 top-1/2 pointer-events-none" style={{ transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
              <div className="relative min-w-0">
                <select 
                  className="w-full min-w-0 border border-slate-200 rounded-lg text-[11px] font-bold uppercase appearance-none bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ height: 34, padding: '0 28px 0 10px', lineHeight: '34px' }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {Array.from(new Set(items.map(it => it.category).filter(Boolean))).sort().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Filter size={12} className="absolute right-2.5 top-1/2 pointer-events-none" style={{ transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span style={{ color: '#1e293b' }}>{filteredItems.length}</span> {showVisitedOnly ? 'VISITED' : 'LOCATIONS'}
              </span>
              {(selectedDistrict || selectedCategory || searchTerm || showVisitedOnly) && (
                <button
                  onClick={() => { setSelectedDistrict(''); setSelectedCategory(''); setSearchTerm(''); setShowVisitedOnly(false); }}
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors text-[10px] font-bold uppercase tracking-wider"
                >
                  Reset <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 relative" style={{ scrollbarWidth: 'thin', padding: '14px 12px 14px 12px' }}>
            <AnimatePresence initial={false}>
              {filteredItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="text-center py-24 flex flex-col items-center justify-center px-8 w-full h-full absolute inset-0 z-10 bg-slate-50"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
                    <Search size={36} className="text-slate-400" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg">No Results Found</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">Try adjusting your filters to find what you're looking for.</p>
                </motion.div>
              ) : (
                <>
                {filteredItems.slice(0, visibleCount).map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    key={item._id}
                    className={`bg-white border rounded-2xl cursor-pointer group transition-all overflow-hidden ${
                      selectedItem?._id === item._id 
                        ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' 
                        : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                    }`}
                    style={{ minHeight: 120, height: 'auto', boxSizing: 'border-box', marginBottom: 12 }}
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Card inner padding */}
                    <div style={{ padding: '14px 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

                      {/* Row 1: Category + Status */}
                      <div className="flex items-center justify-between gap-2" style={{ minHeight: 18 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 20, padding: '0 8px', borderRadius: 4, background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 1, maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.category || 'OTHER'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 20, padding: '0 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0, background: completedItems.includes(item._id) ? '#d1fae5' : '#fee2e2', color: completedItems.includes(item._id) ? '#047857' : '#dc2626' }}>
                          {completedItems.includes(item._id) ? 'Visited' : 'Pending'}
                        </span>
                      </div>

                      {/* Row 2: Name */}
                      <h3 
                        className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors"
                        style={{ fontSize: 16, lineHeight: 1.25, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {item.name}
                      </h3>

                      {/* Row 3: Address */}
                      <div className="flex items-start gap-1.5" style={{ minWidth: 0 }}>
                        <MapPin size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <span 
                          className="text-slate-500 font-medium"
                          style={{ fontSize: 12, lineHeight: 1.35, overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                        >
                          {item.location?.address || item.address || 'Address N/A'}
                        </span>
                      </div>

                      {/* Row 4: Phone & Visit Meta */}
                      <div className="flex flex-col gap-1" style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-1.5" style={{ minWidth: 0 }}>
                          <Phone size={13} className="text-emerald-500 shrink-0" />
                          <span className="text-slate-500 font-medium" style={{ fontSize: 12 }}>
                            {item.phone || 'Contact N/A'}
                          </span>
                        </div>
                        {(item.isVisited || item.visitedByName || completedItems.includes(item._id)) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, padding: '4px 8px', borderRadius: 6, background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 700, color: '#047857' }}>
                            <CheckCircle2 size={11} style={{ color: '#059669', flexShrink: 0 }} />
                            Visited by {item.visitedByName || user?.name || 'Employee'}
                          </div>
                        )}
                        {item.existingLead ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, padding: '5px 8px', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 10, fontWeight: 800, color: '#1d4ed8' }}>
                            <Target size={11} style={{ color: '#2563eb', flexShrink: 0 }} />
                            Lead Already Created
                            <span style={{ marginLeft: 'auto', background: '#dbeafe', color: '#1e40af', borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{item.existingLead.status || 'New'}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, padding: '5px 8px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 10, fontWeight: 800, color: '#15803d' }}>
                            <Plus size={11} style={{ color: '#16a34a', flexShrink: 0 }} />
                            Add Lead
                          </div>
                        )}
                      </div>

                      {/* Row 5: Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-1.5" style={{ width: '100%' }}>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedItem(item); 
                            setMobileView('map');
                          }}
                          className="w-full bg-[#1A2332] hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
                          style={{ height: 32, minHeight: 32 }}
                        >
                          <Target size={13} strokeWidth={2} /> Locate
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleComplete(item._id); }}
                          className={`w-full rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border active:scale-95 transition-all shadow-sm ${
                            (item.isVisited || completedItems.includes(item._id)) 
                             ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                             : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                          style={{ height: 32, minHeight: 32 }}
                        >
                          {(item.isVisited || completedItems.includes(item._id)) ? <CheckCircle2 size={13} strokeWidth={2} /> : <Star size={13} strokeWidth={2} />}
                          {(item.isVisited || completedItems.includes(item._id)) ? 'Visited' : 'Mark'}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                ))}
                
                {visibleCount < filteredItems.length && (
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 50)}
                    className="w-full py-3 mt-4 mb-8 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    Load More ({filteredItems.length - visibleCount} remaining)
                  </button>
                )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* GIS Footer */}
      <div className="hidden lg:flex bg-[#0F172A] shrink-0 z-20 flex-col">
        {/* District count pills */}
        <div style={{ padding: '5px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', marginRight: 6, flexShrink: 0 }}>38 DISTRICTS</span>
          {Object.entries(
            items.reduce((acc, it) => { if (it.district) acc[it.district] = (acc[it.district] || 0) + 1; return acc; }, {})
          ).sort((a, b) => b[1] - a[1]).map(([d, count]) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#e2e8f0' }}>{d}</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#38bdf8' }}>{count}</span>
            </div>
          ))}
        </div>
        {/* Status bar */}
        <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em' }}>GIS ACTIVE</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              VISITS: <span style={{ color: '#f1f5f9', fontWeight: 900 }}>{completedItems.length}</span> / <span style={{ color: '#f1f5f9', fontWeight: 900 }}>{items.length}</span>
            </span>
            <button onClick={() => setCompletedItems([])} style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}>
              CLEAR
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              PROGRESS: <span style={{ color: progressPercent > 0 ? '#60a5fa' : '#475569', fontWeight: 900 }}>{progressPercent}%</span>
            </span>
            <div style={{ width: 140, height: 4, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#2563eb,#38bdf8)', borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[99999] animate-fadeIn"
          style={{ background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 8 }} /> : <X size={16} style={{ display: 'inline', marginRight: 8 }} />}
          {toast.msg}
        </div>
      )}

      {/* Redesigned Add to Lead Modal */}
      {leadTarget && (
        <div className="fixed inset-0 z-[99999] bg-black/75 flex items-center justify-center overflow-hidden" style={{ padding: '16px 12px' }} onClick={closeAddLead}>
          <div 
            className="bg-white rounded-3xl w-full max-w-[580px] shadow-2xl relative flex flex-col border border-slate-100" 
            onClick={e => e.stopPropagation()} 
            style={{ animation: 'modalSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)', maxHeight: '92vh', overflow: 'hidden' }}
          >
            {/* 1. FIXED HEADER */}
            <div className="border-b border-slate-100 shrink-0 relative bg-white rounded-t-3xl" style={{ padding: '20px 24px 20px 24px' }}>
              <button 
                onClick={closeAddLead} 
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors" 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 pr-12">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Target size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-md mb-1.5 inline-block leading-none">
                    Master Data Linked
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-snug truncate">Create Lead from Field Visit</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1.5 truncate">{leadTarget.name}</p>
                </div>
              </div>
            </div>

            {/* 2. SCROLLABLE BODY WITH GENEROUS LEFT/RIGHT PADDING */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-6" style={{ padding: '24px 24px 16px 24px' }}>
              
              {/* Linked Location Data (Data Model) Summary */}
              <div className="bg-slate-50 rounded-2xl px-5 py-5 border border-slate-200/80 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-red-500 shrink-0" /> Linked Location Data (Data Model)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-1.5">Category / District</span>
                    <span className="font-extrabold text-slate-800 text-xs block leading-tight">{leadTarget.category || 'Other'} • {leadTarget.district || 'TN'}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-1.5">Master Phone</span>
                    <span className="font-extrabold text-slate-800 text-xs block leading-tight">{leadTarget.phone || 'N/A'}</span>
                  </div>
                  <div className="col-span-1 sm:col-span-2 pt-3.5 border-t border-slate-200/60">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-1.5">Address</span>
                    <span className="font-bold text-slate-700 text-xs leading-relaxed block">{leadTarget.location?.address || leadTarget.address || 'Address N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Enter Sales Visit Information Form */}
              <div className="space-y-5">
                <div className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <Plus size={15} strokeWidth={2.5} />
                  </div>
                  Enter Sales Visit Information
                </div>

                {/* Contact Person Name & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Contact Person Name <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Raj Kumar"
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all box-border bg-white"
                      value={contactPerson}
                      onChange={e => setContactPerson(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Contact Role
                    </label>
                    <select 
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white box-border"
                      value={contactRole}
                      onChange={e => setContactRole(e.target.value)}
                    >
                      <option value="Owner">Owner</option>
                      <option value="Manager">Manager</option>
                      <option value="In-charge">In-charge</option>
                      <option value="Coach">Coach</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Phones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Contact Phone <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Primary contact phone"
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all box-border bg-white"
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Alternate Phone (Optional)
                    </label>
                    <input 
                      type="text"
                      placeholder="Secondary phone"
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all box-border bg-white"
                      value={alternatePhone}
                      onChange={e => setAlternatePhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Lead Status & Lead Type & Interest Level */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Lead Status
                    </label>
                    <select 
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white box-border"
                      value={leadStatus}
                      onChange={e => setLeadStatus(e.target.value)}
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Interested">Interested</option>
                      <option value="Follow Up">Follow Up</option>
                      <option value="Demo Scheduled">Demo Scheduled</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Converted">Converted</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Lead Type
                    </label>
                    <select 
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white box-border"
                      value={leadType}
                      onChange={e => setLeadType(e.target.value)}
                    >
                      <option value="Field Visit">Field Visit</option>
                      <option value="Offline">Offline</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Interest Level
                    </label>
                    <select 
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white box-border"
                      value={interestLevel}
                      onChange={e => setInterestLevel(e.target.value)}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                </div>

                {/* Client Requirement & Follow-up Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Client Requirement
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Booking system, Turf software"
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all box-border bg-white"
                      value={clientRequirement}
                      onChange={e => setClientRequirement(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Follow-up Date
                    </label>
                    <input 
                      type="date"
                      className="w-full px-4 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white box-border"
                      value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Visit Notes */}
                <div>
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 block">
                    Visit Notes / Discussion
                  </label>
                  <textarea 
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none box-border bg-white"
                    rows={3}
                    placeholder="Record key conversation details with owner/manager..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 3. FIXED FOOTER - PINNED AT BOTTOM */}
            <div className="border-t border-slate-100 bg-slate-50/90 shrink-0 flex items-center justify-end gap-3.5 rounded-b-3xl" style={{ padding: '16px 24px 16px 24px' }}>
              <button 
                type="button"
                onClick={closeAddLead}
                className="px-6 h-12 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all active:scale-95 shadow-sm flex items-center justify-center"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleAddLead}
                disabled={submitting}
                className="px-7 h-12 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 min-w-[160px]"
                style={{ opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
                {submitting ? 'Creating Lead...' : 'Create Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Lead Modal (Duplicate Lead Protection) */}
      {viewLeadTarget && (
        <div className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center" style={{ padding: '16px 12px' }} onClick={() => setViewLeadTarget(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative"
            style={{ animation: 'modalSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg,#92400e 0%,#d97706 100%)', padding: '20px 20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Target size={22} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>Active Lead Exists</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>Lead Already Created</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewLeadTarget.name}</div>
                </div>
                <button onClick={() => setViewLeadTarget(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={16} color="#fff" />
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div style={{ padding: '18px 20px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#92400e', marginBottom: 5 }}>Lead Status</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#d97706' }}>{viewLeadTarget.existingLead?.status || 'Active'}</div>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#166534', marginBottom: 5 }}>Phone</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#15803d', wordBreak: 'break-all' }}>{viewLeadTarget.phone || 'N/A'}</div>
                </div>
              </div>

              {viewLeadTarget.existingLead?.contactPerson && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>Contact Person</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{viewLeadTarget.existingLead.contactPerson}</span>
                </div>
              )}

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MapPin size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, lineHeight: 1.4 }}>{viewLeadTarget.location?.address || viewLeadTarget.address || 'Address N/A'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
              <button
                onClick={() => setViewLeadTarget(null)}
                style={{ flex: 1, height: 46, borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <X size={14} /> Close
              </button>
              <button
                onClick={() => { setViewLeadTarget(null); navigate(user?.role === 'admin' ? '/admin/leads' : '/employee/leads'); }}
                style={{ flex: 2, height: 46, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%)', color: '#fff', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
              >
                <Target size={15} /> Open Lead Generation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile App Navigation Drawer */}
      {isNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsNavOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-[#09090b] border-r border-white/10 flex flex-col shadow-2xl" style={{ animation: 'slideInLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={logo} alt="Play Time" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: '#fafafa' }}>Play Time</div>
                  <div style={{ fontSize: 9, color: '#adff2f', fontWeight: 600, letterSpacing: '0.08em' }}>CRM</div>
                </div>
              </div>
              <button onClick={() => setIsNavOpen(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#adff2f' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: '#adff2f', textTransform: 'capitalize', fontWeight: 500 }}>{user?.role}</div>
              </div>
            </div>
            <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, padding: '8px 20px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Navigation</div>
              {(() => {
                const role = user?.role || 'admin';
                const items_nav = role === 'admin' ? [
                  { to: '/admin/dashboard', label: 'Dashboard' },
                  { to: '/admin/data-module', label: 'Data Module' },
                  { to: '/admin/leads', label: 'Lead Generation' },
                  { to: '/admin/import', label: 'Location Map' },
                  { to: '/admin/clients', label: 'Clients' },
                  { to: '/admin/employees', label: 'Employees' },
                  { to: '/admin/attendance', label: 'Attendance' },
                  { to: '/admin/meetings', label: 'Meetings' },
                  { to: '/admin/targets', label: 'Targets' },
                  { to: '/admin/payments', label: 'Payments' },
                  { to: '/reports', label: 'Reports' },
                  { to: '/settings', label: 'Settings' },
                ] : [
                  { to: '/employee/dashboard', label: 'Dashboard' },
                  { to: '/employee/leads', label: 'My Leads' },
                  { to: '/employee/map', label: 'Location Map' },
                  { to: '/employee/attendance', label: 'Attendance' },
                  { to: '/employee/meetings', label: 'My Meetings' },
                  { to: '/employee/targets', label: 'My Targets' },
                  { to: '/settings', label: 'Settings' },
                ];
                return items_nav.map(({ to, label }) => (
                  <NavLink 
                    key={to} 
                    to={to} 
                    onClick={() => setIsNavOpen(false)}
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex' }}
                  >
                    <span style={{ display: 'block', width: '100%' }}>{label}</span>
                  </NavLink>
                ));
              })()}
            </nav>
            <div style={{ padding: '16px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button 
                onClick={() => { logout(); navigate('/login'); }}
                className="sidebar-item" 
                style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
