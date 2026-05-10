import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { Loader2, Search, SlidersHorizontal, MapPin, Calendar, Image as ImageIcon, X, Star, Users, Layers, Navigation, CloudRain } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { getMatchWeather } from '../utils/weather';

// ── Free High-Quality Tile Layers ──────────────────────────────────────
const TILE_LAYERS = {
  cartoDark: {
    name: 'Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    emoji: '🌙'
  },
  cartoVoyager: {
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    emoji: '🗺️'
  },
  cartoPositron: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    emoji: '☀️'
  },
  openStreetMap: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    emoji: '🏘️'
  },
  esriSatellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    emoji: '🛰️'
  },
  openTopo: {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    emoji: '⛰️'
  }
};

// Goa center coordinates
const GOA_CENTER = [15.2993, 74.1240];

// ── Sport-Specific Colors ─────────────────────────────────────────────
const SPORT_COLORS = {
  football: { bg: '#10b981', text: '#fff', icon: '⚽' },
  futsal:   { bg: '#14b8a6', text: '#fff', icon: '⚽' },
  cricket:  { bg: '#f59e0b', text: '#fff', icon: '🏏' },
  tennis:   { bg: '#06b6d4', text: '#fff', icon: '🎾' },
  basketball: { bg: '#f97316', text: '#fff', icon: '🏀' },
  volleyball: { bg: '#8b5cf6', text: '#fff', icon: '🏐' },
  badminton: { bg: '#ec4899', text: '#fff', icon: '🏸' },
  default:  { bg: '#006c49', text: '#fff', icon: '🏆' }
};

// ── Custom SVG Marker Factory ─────────────────────────────────────────
function createSportIcon(sport, isActive = false) {
  const sportKey = sport?.toLowerCase() || 'default';
  const config = SPORT_COLORS[sportKey] || SPORT_COLORS.default;
  const size = isActive ? 48 : 36;
  const pulse = isActive ? `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${config.bg}" opacity="0.25"><animate attributeName="r" from="${size/2}" to="${size*0.8}" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite"/></circle>` : '';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size * 1.6}" height="${size * 1.6}" viewBox="0 0 ${size * 1.6} ${size * 1.6}">
      ${pulse}
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${config.bg}" flood-opacity="0.4"/>
        </filter>
        <linearGradient id="grad_${sportKey}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${config.bg}"/>
          <stop offset="100%" stop-color="${adjustColor(config.bg, -30)}"/>
        </linearGradient>
      </defs>
      <g transform="translate(${size*0.3}, ${size*0.1})" filter="url(#shadow)">
        <path d="M${size/2},${size*1.25} C${size/2},${size*1.25} ${size},${size*0.85} ${size},${size/2} C${size},${size*0.22} ${size*0.78},0 ${size/2},0 C${size*0.22},0 0,${size*0.22} 0,${size/2} C0,${size*0.85} ${size/2},${size*1.25} ${size/2},${size*1.25}Z" 
              fill="url(#grad_${sportKey})" stroke="white" stroke-width="2"/>
        <circle cx="${size/2}" cy="${size*0.42}" r="${size*0.25}" fill="white" opacity="0.95"/>
        <text x="${size/2}" y="${size*0.48}" text-anchor="middle" font-size="${size*0.28}" dominant-baseline="middle">${config.icon}</text>
      </g>
    </svg>
  `;
  
  return L.divIcon({
    html: svg,
    className: 'custom-sport-marker',
    iconSize: [size * 1.6, size * 1.6],
    iconAnchor: [size * 0.8, size * 1.35],
    popupAnchor: [0, -size * 1.1]
  });
}

function adjustColor(hex, amount) {
  let col = hex.replace('#', '');
  let num = parseInt(col, 16);
  let r = Math.min(255, Math.max(0, (num >> 16) + amount));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

// ── Fly-to animation helper ───────────────────────────────────────────
function FlyToMarker({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 14, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [position, zoom, map]);
  return null;
}

// ── Locate user on map ────────────────────────────────────────────────
function LocateUser() {
  const map = useMap();
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 14, enableHighAccuracy: true });
  };
  return (
    <button 
      onClick={handleLocate}
      className="absolute bottom-28 right-4 z-[1000] bg-surface-card/95 backdrop-blur-md p-3 rounded-full shadow-lg border border-border hover:bg-surface-hover transition-all hover:scale-105 active:scale-95"
      title="My Location"
    >
      <Navigation size={18} className="text-goa-ocean" />
    </button>
  );
}


export default function TournamentMap() {
  const [matches, setMatches] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTileLayer, setActiveTileLayer] = useState('cartoDark');
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flyToPos, setFlyToPos] = useState(null);
  const [activeMatchWeather, setActiveMatchWeather] = useState(null);
  const mapRef = useRef(null);

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      // First check if it matches any of our locations exactly (or partially)
      const exactMatch = matches.find(m => 
        m.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.venue?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (exactMatch) {
        setFlyToPos([exactMatch.latitude, exactMatch.longitude]);
        setActiveMarkerId(exactMatch.id);
        return;
      }

      // Otherwise geocode via Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFlyToPos([parseFloat(lat), parseFloat(lon)]);
        setActiveMarkerId(null);
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  useEffect(() => {
    const fetchVerifiedMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('is_verified', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!error && data) {
        setMatches(data);
      }
      setDbLoading(false);
    };

    fetchVerifiedMatches();
  }, []);

  const handleActiveMarker = (markerId) => {
    if (markerId === activeMarkerId) return;
    setActiveMarkerId(markerId);
    const match = matches.find(m => m.id === markerId);
    if (match) {
      setFlyToPos([match.latitude, match.longitude]);
      
      // Fetch weather for this match
      setActiveMatchWeather(null);
      getMatchWeather(match.latitude, match.longitude, match.match_time)
        .then(data => setActiveMatchWeather(data));
    }
  };

  const activeMatch = matches.find(m => m.id === activeMarkerId);

  const filters = ['All', 'Football', 'Futsal', 'Cricket', 'Tennis', 'Basketball'];
  
  const filteredMatches = useMemo(() => {
    let result = matches;
    if (activeFilter !== 'All') {
      result = result.filter(m => m.sport?.toLowerCase() === activeFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.sport?.toLowerCase().includes(q) || 
        m.location?.toLowerCase().includes(q) ||
        m.venue?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [matches, activeFilter, searchQuery]);

  const currentTile = TILE_LAYERS[activeTileLayer];

  if (dbLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-goa-ocean mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">
          <span className="gradient-text">Discover Map</span> 🗺️
        </h1>
        <p className="text-text-secondary mt-2">
          Find verified local tournaments happening around Goa.
        </p>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-border shadow-xl h-[600px] relative">

        {/* Floating Search & Filter Bar */}
        <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-[1000] pointer-events-none">
          <div className="bg-surface-card/90 backdrop-blur-md rounded-full shadow-lg p-1.5 flex items-center gap-2 border border-border pointer-events-auto">
            <form onSubmit={handleSearchLocation} className="flex-1 flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full border border-transparent focus-within:border-goa-ocean transition-colors">
              <button type="submit" className="text-text-muted hover:text-goa-ocean transition-colors border-none bg-transparent cursor-pointer p-0 flex items-center">
                <Search size={18} />
              </button>
              <input 
                type="text" 
                placeholder="Find location, turf, or sport... (Press Enter)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-text-primary placeholder:text-text-muted h-8 outline-none text-sm"
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setFlyToPos(GOA_CENTER); }} className="text-text-muted hover:text-text-primary transition-colors border-none bg-transparent cursor-pointer p-0 flex items-center">
                  <X size={14} />
                </button>
              )}
            </form>
            <button 
              onClick={() => setShowLayerPicker(!showLayerPicker)}
              className="bg-surface-hover text-goa-ocean rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-surface-input transition-colors"
            >
              <Layers size={16} />
              Map Style
            </button>
          </div>

          {/* Quick Filters (Chips) */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide px-1 pointer-events-auto">
            {filters.map(filter => (
              <button 
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setActiveMarkerId(null);
                }}
                className={`flex-shrink-0 px-5 py-1.5 rounded-full text-sm font-medium shadow-sm whitespace-nowrap transition-colors border ${
                  activeFilter === filter 
                    ? 'bg-goa-ocean/20 text-goa-ocean border-goa-ocean/50' 
                    : 'bg-surface-card/90 backdrop-blur-md text-text-secondary border-border hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {SPORT_COLORS[filter.toLowerCase()]?.icon || '🏆'} {filter}
              </button>
            ))}
          </div>

          {/* Layer Picker Dropdown */}
          {showLayerPicker && (
            <div className="mt-2 bg-surface-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border p-3 pointer-events-auto animate-in">
              <p className="text-xs text-text-muted font-semibold mb-2 uppercase tracking-wider px-1">Map Style</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTileLayer(key);
                      setShowLayerPicker(false);
                    }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                      activeTileLayer === key 
                        ? 'bg-goa-ocean/15 text-goa-ocean border border-goa-ocean/40 shadow-sm' 
                        : 'bg-surface-hover/50 text-text-secondary border border-transparent hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    <span className="text-lg">{layer.emoji}</span>
                    <span>{layer.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Match Count Badge */}
        <div className="absolute top-4 right-4 z-[1000] bg-surface-card/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md border border-border">
          <span className="text-xs font-semibold text-text-primary">{filteredMatches.length}</span>
          <span className="text-xs text-text-muted ml-1">matches</span>
        </div>

        {/* Leaflet Map */}
        <MapContainer
          center={GOA_CENTER}
          zoom={10}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          ref={mapRef}
          className="leaflet-map-container"
        >
          <TileLayer
            key={activeTileLayer}
            url={currentTile.url}
            attribution={currentTile.attribution}
            maxZoom={19}
          />
          <ZoomControl position="bottomright" />

          {flyToPos && <FlyToMarker position={flyToPos} zoom={14} />}

          {filteredMatches.map((match) => (
            <Marker
              key={match.id}
              position={[match.latitude, match.longitude]}
              icon={createSportIcon(match.sport, activeMarkerId === match.id)}
              eventHandlers={{
                click: () => handleActiveMarker(match.id),
              }}
            >
              <Popup className="custom-popup" closeButton={false} maxWidth={220}>
                <div style={{ fontFamily: "'Outfit', sans-serif", padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{SPORT_COLORS[match.sport?.toLowerCase()]?.icon || '🏆'}</span>
                    <strong style={{ fontSize: '14px', color: '#161d19' }}>{match.sport} Tournament</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#3c4a42', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📍</span> {match.location}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c7a71', marginTop: '4px' }}>
                    {match.match_time ? format(new Date(match.match_time), 'EEE, MMM d · h:mm a') : 'Time TBD'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          <LocateUser />
        </MapContainer>

        {/* Sliding Bottom Card (Selected Turf Info) */}
        <div className={`absolute bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-[1001] transition-transform duration-300 ease-in-out ${activeMarkerId ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'}`}>
          {activeMatch && (
            <div className="bg-surface-card/95 backdrop-blur-xl rounded-[24px] shadow-2xl overflow-hidden border border-border">
              {/* Card Header/Image */}
              <div className="h-32 relative bg-surface-input overflow-hidden flex items-center justify-center">
                {activeMatch.flyer_url ? (
                  <img src={activeMatch.flyer_url} alt={activeMatch.sport} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">{SPORT_COLORS[activeMatch.sport?.toLowerCase()]?.icon || '🏆'}</span>
                    <ImageIcon size={24} className="text-text-muted opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-card to-transparent/20"></div>
                
                {/* Close Button */}
                <button 
                  onClick={() => setActiveMarkerId(null)}
                  className="absolute top-3 right-3 bg-surface/50 backdrop-blur p-1.5 rounded-full text-text-primary shadow-sm hover:bg-surface-hover hover:text-goa-coral transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Card Content */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary mb-1">{activeMatch.sport} Tournament</h2>
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <MapPin size={14} className="text-goa-ocean" />
                      <span className="truncate max-w-[200px]">{activeMatch.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary mt-1">
                      <Calendar size={14} className="text-goa-sun" />
                      <span>{format(new Date(activeMatch.match_time), 'EEE, MMM d · h:mm a')}</span>
                    </div>
                  </div>
                  <div className="bg-goa-sun/10 text-goa-sun px-2 py-1 rounded-md flex items-center gap-1 text-sm font-semibold border border-goa-sun/20">
                    <Star size={14} fill="currentColor" />
                    Verified
                  </div>
                </div>

                {/* Rain Alert Banner */}
                {activeMatchWeather && activeMatchWeather.isHighRainRisk && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <CloudRain size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-blue-400 font-bold text-xs mb-0.5">High Rain Risk ({activeMatchWeather.rainProbability}%)</h3>
                      <p className="text-[11px] text-text-secondary leading-tight">Rain is expected during this match. Bring rain gear!</p>
                    </div>
                  </div>
                )}

                {/* Active Matches/Amenities */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center border border-border">
                      <Users size={18} className="text-goa-ocean" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">
                        ₹{activeMatch.price || 0} <span className="text-xs text-text-secondary font-normal">entry</span>
                      </div>
                      <div className="text-xs text-goa-palm font-medium">Book your spot</div>
                    </div>
                  </div>
                  
                  <Link to={`/match/${activeMatch.id}`}>
                    <button className="btn-primary py-2 px-6 shadow-lg shadow-goa-ocean/20">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Legend / Quick Stats */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {Object.entries(SPORT_COLORS).filter(([k]) => k !== 'default').map(([sport, config]) => {
          const count = matches.filter(m => m.sport?.toLowerCase() === sport).length;
          if (count === 0) return null;
          return (
            <button
              key={sport}
              onClick={() => setActiveFilter(sport.charAt(0).toUpperCase() + sport.slice(1))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-card border border-border hover:border-goa-ocean/40 transition-all hover:shadow-sm"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.bg }}></span>
              <span className="capitalize text-text-primary">{sport}</span>
              <span className="text-text-muted">({count})</span>
            </button>
          );
        })}
        <div className="ml-auto text-xs text-text-muted flex items-center gap-1">
          <span>🌍</span> Free maps powered by OpenStreetMap & CARTO
        </div>
      </div>
    </div>
  );
}
