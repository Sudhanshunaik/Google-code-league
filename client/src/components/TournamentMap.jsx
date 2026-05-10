import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { supabase } from '../lib/supabase';
import { Loader2, Search, SlidersHorizontal, MapPin, Calendar, Image as ImageIcon, X, Star, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 15.2993,
  lng: 74.1240
};

// "Goan Sunset" Map Theme
// High contrast, deep navy blues, corals, and oranges.
const goanSunsetMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#023e58" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#283d6a" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#3a4762" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] }
];

export default function TournamentMap() {
  const [matches, setMatches] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

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
    if (markerId === activeMarkerId) {
      return;
    }
    setActiveMarkerId(markerId);
  };

  const activeMatch = matches.find(m => m.id === activeMarkerId);

  const filters = ['All', 'Football', 'Cricket', 'Tennis', 'Basketball'];
  
  const filteredMatches = activeFilter === 'All' 
    ? matches 
    : matches.filter(m => m.sport?.toLowerCase() === activeFilter.toLowerCase());

  if (dbLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-goa-ocean" />
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
        {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE' ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm p-6 text-center">
            <h2 className="text-2xl font-bold text-goa-sun mb-2">Google Maps API Key Missing</h2>
            <p className="text-text-secondary mb-4 max-w-md">
              Please add your Google Maps API Key to the <code>.env</code> file as <code>VITE_GOOGLE_MAPS_API_KEY</code> and restart the development server to view the map.
            </p>
          </div>
        ) : null}

        {/* Floating Search & Filter Bar */}
        <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-10 pointer-events-none">
          <div className="bg-surface-card/90 backdrop-blur-md rounded-full shadow-lg p-1.5 flex items-center gap-2 border border-border pointer-events-auto">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full border border-transparent focus-within:border-goa-ocean transition-colors">
              <Search size={18} className="text-text-muted" />
              <input 
                type="text" 
                placeholder="Find turf, court, or sport..." 
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-text-primary placeholder:text-text-muted h-8 outline-none text-sm"
              />
            </div>
            <button className="bg-surface-hover text-goa-ocean rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-surface-input transition-colors">
              <SlidersHorizontal size={16} />
              Filters
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
                {filter}
              </button>
            ))}
          </div>
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          options={{
            styles: goanSunsetMapStyle,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
          onClick={() => setActiveMarkerId(null)}
        >
          {filteredMatches.map((match) => (
            <MarkerF
              key={match.id}
              position={{ lat: match.latitude, lng: match.longitude }}
              onClick={() => handleActiveMarker(match.id)}
              animation={activeMarkerId === match.id ? window.google.maps.Animation.BOUNCE : null}
            />
          ))}
        </GoogleMap>

        {/* Sliding Bottom Card (Selected Turf Info) */}
        <div className={`absolute bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-20 transition-transform duration-300 ease-in-out ${activeMarkerId ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'}`}>
          {activeMatch && (
            <div className="bg-surface-card/95 backdrop-blur-xl rounded-[24px] shadow-2xl overflow-hidden border border-border">
              {/* Card Header/Image */}
              <div className="h-32 relative bg-surface-input overflow-hidden flex items-center justify-center">
                {activeMatch.flyer_url ? (
                  <img src={activeMatch.flyer_url} alt={activeMatch.sport} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={48} className="text-text-muted opacity-50" />
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
    </div>
  );
}
