import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, Phone, Navigation, MapPin, Filter, X, Target, 
  CheckCircle2, Star, RefreshCw, Sun, Bell, User, Map as MapIcon,
  ChevronRight, MoreVertical, LayoutGrid, Upload, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';

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

const MapView = ({ items, selectedItem, onItemClick, completedItems }) => {
  const tamilNaduCenter = [11.1271, 78.6569];
  const markerRefs = React.useRef({});
  const map = useMap();

  useEffect(() => {
    if (selectedItem && selectedItem.location?.lat && selectedItem.location?.lng) {
      const { lat, lng } = selectedItem.location;
      map.flyTo([lat, lng], 15, { duration: 1.5 });
      
      const timer = setTimeout(() => {
        const marker = markerRefs.current[selectedItem._id];
        if (marker) {
          marker.openPopup();
        }
      }, 600);
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
                <div className="p-4 min-w-[240px] bg-white rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black bg-primary-600 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                      {item.category || 'OTHER'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">#{(item.sno || 'N/A').toString().padStart(4, '0')}</span>
                  </div>
                  <h4 className="font-black text-slate-900 text-base mb-2 leading-tight">{item.name}</h4>
                  <div className="flex items-start gap-3 mb-5">
                    <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.location?.address || item.address}</p>
                  </div>
                  <div className="flex gap-2 border-t border-slate-100 pt-4">
                     <a href={`tel:${item.phone}`} className="flex-1 flex items-center justify-center py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95">
                       <Phone size={14} className="mr-2" /> Call
                     </a>
                     <a 
                       href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1 flex items-center justify-center py-3 bg-[#1E293B] hover:bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                     >
                       <Navigation size={14} className="mr-2" /> Nave
                     </a>
                  </div>
                </div>
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
        />
      )}
    </>
  );
};

export default function MapModule() {
  const [items, setItems] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [completedItems, setCompletedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleComplete = (id) => {
    setCompletedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [locationsRes, districtsRes] = await Promise.all([
          API.get('/leads/locations'),
          API.get('/leads/districts')
        ]);
        
        const tnCenter = { lat: 11.1271, lng: 78.6569 };
        const dataWithCoords = (locationsRes.data || []).map((loc, idx) => {
          if (!loc.location || !loc.location.lat) {
            const r1 = Math.sin(idx * 0.5) * 2;
            const r2 = Math.cos(idx * 0.3) * 1.5;
            return {
              ...loc,
              location: {
                ...loc.location,
                lat: tnCenter.lat + r1,
                lng: tnCenter.lng + r2
              }
            };
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
  }), [items, selectedDistrict, selectedCategory, searchTerm]);

  const handleSync = async () => {
    try {
      setLoading(true);
      await API.post('/import/sync');
      const [locationsRes, districtsRes] = await Promise.all([
        API.get('/leads/locations'),
        API.get('/leads/districts')
      ]);
      
      const tnCenter = { lat: 11.1271, lng: 78.6569 };
      const dataWithCoords = (locationsRes.data || []).map((loc, idx) => {
        if (!loc.location || !loc.location.lat) {
          const r1 = (Math.sin(idx * 0.5) * 1.5) + (Math.random() * 0.2);
          const r2 = (Math.cos(idx * 0.3) * 1.2) + (Math.random() * 0.2);
          return {
            ...loc,
            location: {
              ...loc.location,
              lat: tnCenter.lat + r1,
              lng: tnCenter.lng + r2
            }
          };
        }
        return loc;
      });

      setItems(dataWithCoords);
      setDistricts(districtsRes.data || []);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = items.length > 0 ? Math.round((completedItems.length / items.length) * 100) : 0;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden -m-6 rounded-lg border border-slate-200">
      {/* GIS Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E293B] rounded-lg flex items-center justify-center text-white shadow-lg">
            <MapIcon size={24} />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg leading-none tracking-tight">TN Sports GIS</h1>
            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">Location Data Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-slate-50 rounded-xl px-4 py-2 gap-3 border border-slate-100 shadow-inner">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search shops or address..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-64 text-slate-600 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center h-10 border-l border-slate-100 ml-2 pl-6 gap-2">
            <button 
              onClick={handleSync}
              disabled={loading}
              className={`p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all active:scale-95 ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
            <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all"><Sun size={20} /></button>
            <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="ml-2 w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-primary-100">
              A
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {/* Map Side */}
        <div className="flex-[7] relative bg-slate-200">
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
            <MapView 
              items={filteredItems} 
              selectedItem={selectedItem} 
              onItemClick={setSelectedItem} 
              completedItems={completedItems} 
            />
          </MapContainer>
          
          {/* Map Overlay Badge */}
          <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur shadow-2xl border border-slate-200 rounded-2xl p-3 flex items-center gap-3 px-5 transition-all hover:scale-105">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.1em]">GIS SYSTEM ACTIVE</span>
          </div>
          
          <button className="absolute top-6 right-6 z-20 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95 group">
            <Upload size={22} className="group-hover:translate-y-[-2px] transition-transform" />
          </button>
        </div>

        {/* Sidebar Side */}
        <div className="flex-[3] min-w-[420px] bg-white border-l border-slate-200 flex flex-col overflow-hidden relative shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
          <div className="p-6 border-b border-slate-100 space-y-5 shrink-0 bg-white sticky top-0 z-10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold transition-colors group-focus-within:text-primary-600" size={18} />
              <input 
                type="text" 
                placeholder="Search shops or address..." 
                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none bg-slate-50/50 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <select 
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl text-[11px] font-black uppercase appearance-none bg-white cursor-pointer focus:border-primary-500 transition-all text-slate-900 shadow-sm"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="" className="text-slate-900">All Districts</option>
                  {districts.map(d => <option key={d} value={d} className="text-slate-900">{d}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-primary-500 transition-colors">
                  <Filter size={14} />
                </div>
              </div>
              <div className="relative group">
                <select 
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl text-[11px] font-black uppercase appearance-none bg-white cursor-pointer focus:border-primary-500 transition-all text-slate-900 shadow-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="" className="text-slate-900">All Categories</option>
                  {Array.from(new Set(items.map(it => it.category).filter(Boolean))).sort().map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-primary-500 transition-colors">
                  <Filter size={14} />
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-between px-1">
              <span className="flex items-center gap-2">
                <span className="text-slate-900 font-black text-xs">{filteredItems.length}</span> Locations
              </span>
              <button 
                onClick={() => { setSelectedDistrict(''); setSelectedCategory(''); setSearchTerm(''); }}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                hidden={!selectedDistrict && !selectedCategory && !searchTerm}
              >
                Reset <X size={10} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50/30">
            <AnimatePresence mode='popLayout'>
              {filteredItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-center py-24 flex flex-col items-center justify-center px-8"
                >
                  <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center mb-6 border border-slate-100">
                    <Search size={36} className="text-slate-200" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg">No Results Found</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">Try adjusting your filters to find what you're looking for.</p>
                </motion.div>
              ) : (
                filteredItems.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item._id}
                    className={`p-6 rounded-[28px] border-2 transition-all cursor-pointer group relative overflow-hidden bg-white ${
                      selectedItem?._id === item._id 
                        ? 'border-primary-500 shadow-2xl shadow-primary-500/10 z-10' 
                        : 'border-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex justify-between items-start mb-5">
                       <span className="text-[9px] font-black bg-primary-600 text-white px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">
                         {item.category || 'OTHER'}
                       </span>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${
                         completedItems.includes(item._id) ? 'text-green-600' : 'text-red-500'
                       }`}>
                         {completedItems.includes(item._id) ? 'Visited' : 'Pending'}
                       </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-xl mb-4 group-hover:text-primary-600 transition-colors leading-tight tracking-tight">
                      {item.name}
                    </h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-4 text-sm text-slate-500 font-medium leading-relaxed">
                        <MapPin size={18} className="shrink-0 text-red-500/60 mt-0.5" />
                        <span>{item.location?.address || item.address}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <Phone size={18} className="shrink-0 text-green-500/60" />
                        <span>{item.phone || 'Contact N/A'}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                        className="flex-1 py-4 bg-[#1E293B] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
                      >
                        <Target size={16} strokeWidth={2.5} /> Locate
                      </button>
                      <button 
                         onClick={(e) => { e.stopPropagation(); toggleComplete(item._id); }}
                         className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all active:scale-95 shadow-md ${
                           completedItems.includes(item._id) 
                            ? 'bg-green-600 border-green-600 text-white' 
                            : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                         }`}
                      >
                        {completedItems.includes(item._id) ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <Star size={16} strokeWidth={2.5} />}
                        {completedItems.includes(item._id) ? 'Visited' : 'Mark'}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* GIS Footer */}
      <div className="h-11 bg-[#0F172A] flex items-center justify-between px-8 text-[10px] text-slate-400 shrink-0 uppercase tracking-[0.2em] font-black z-20">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            GIS SYSTEM ACTIVE
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-500">COMPLETED VISITS: <span className="text-white font-black">{completedItems.length}</span> / {items.length}</span>
            <button 
              onClick={() => setCompletedItems([])}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
            >
              <div className="w-px h-3 bg-slate-800"></div>
              CLEAR PROGRESS
            </button>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
             <span className="text-slate-500">WORKFLOW PROGRESS: <span className={progressPercent > 0 ? 'text-blue-400' : 'text-slate-500'}>{progressPercent}%</span></span>
             <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPercent}%` }}
                 className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
               />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
