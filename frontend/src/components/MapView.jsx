import React, { useEffect, useRef, useState, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SimulationContext } from '../context/SimulationContext';
import { Search, Navigation, AlertCircle, CheckCircle2, Clock, MapPin, Hospital as HospitalIcon, Crosshair, Target } from 'lucide-react';

// Fix Leaflet default icon path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper to create clean SVG Leaflet icons
function createDivIcon(html, size = [36, 36], anchor = [18, 18]) {
  return L.divIcon({
    html,
    className: 'custom-leaflet-pin',
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -anchor[1]]
  });
}

// Marker definitions
const markerIcons = {
  emergency: createDivIcon(`
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(229, 57, 53, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #E53935; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(229, 57, 53, 0.5); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
    </div>
  `, [36, 36], [18, 18]),

  ambulance: (name, status, isSelected = false) => {
    const bgColor = isSelected ? '#10243A' : status === 'available' ? '#0F9D8A' : '#D97706';
    const borderColor = isSelected ? '#E53935' : '#FFFFFF';
    return createDivIcon(`
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: ${bgColor}; border: 2px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"></path>
            <circle cx="7" cy="17" r="2"></circle>
            <path d="M9 17h6"></path>
            <circle cx="17" cy="17" r="2"></circle>
            <line x1="10" y1="7" x2="10" y2="13"></line>
            <line x1="7" y1="10" x2="13" y2="10"></line>
          </svg>
        </div>
        <div style="margin-top: 3px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9px; font-weight: 700; color: #FFFFFF; background: rgba(16, 36, 58, 0.95); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          ${name}
        </div>
      </div>
    `, [60, 48], [30, 16]);
  },

  hospital: (hospital, rank, showName) => {
    const isTopRank = rank === 1;
    const bgColor = isTopRank ? '#0F9D8A' : '#10243A';
    return createDivIcon(`
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: ${bgColor}; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12"></path>
            <path d="M6 12h12"></path>
          </svg>
        </div>
        ${rank ? `
          <span style="position: absolute; top: -6px; right: -4px; width: 16px; height: 16px; border-radius: 50%; background: #E53935; color: white; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 1.5px solid white;">
            #${rank}
          </span>
        ` : ''}
        ${showName ? `
          <div style="margin-top: 3px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9px; font-weight: 700; color: #FFFFFF; background: rgba(16, 36, 58, 0.95); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${hospital.shortName || hospital.name}
          </div>
        ` : ''}
      </div>
    `, [80, 48], [40, 16]);
  },

  movingAmbulance: createDivIcon(`
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
      <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(15, 157, 138, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <div style="position: relative; width: 32px; height: 32px; border-radius: 8px; background: #0F9D8A; border: 2px solid #FFFFFF; box-shadow: 0 4px 14px rgba(15, 157, 138, 0.5); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <path d="M9 17h6"></path>
          <circle cx="17" cy="17" r="2"></circle>
          <line x1="10" y1="7" x2="10" y2="13"></line>
          <line x1="7" y1="10" x2="13" y2="10"></line>
        </svg>
      </div>
    </div>
  `, [40, 40], [20, 20])
};

// Map events handler component for click and pan tracking
function MapEventsController({ onMapClick, canClick, onUserPan }) {
  useMapEvents({
    click(e) {
      if (canClick && onMapClick) onMapClick(e.latlng);
    },
    dragstart() {
      if (onUserPan) onUserPan();
    }
  });
  return null;
}

export default function MapView({
  emergencyLocation,
  ambulances = [],
  selectedAmbulance,
  hospitals = [],
  rankedHospitals = [],
  selectedHospital,
  shortestRoute = [],
  optimalRoute = [],
  alternativeRoute = [],
  route = [],
  alternateRoutes = [],
  ambulancePosition,
  trafficSegments = [],
  trafficEnabled = true,
  phase = 'idle',
  onMapClick,
  onSelectAmbulance = () => {},
  onSelectHospital = () => {},
  pickupIndex = 0,
  onSelectAlternate = () => {},
  activeRouteType = 'optimal',
  routeMode = 'optimal',
  autoFocus = false,
  destinationLocation = null,
}) {
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoFocusActive, setIsAutoFocusActive] = useState(Boolean(autoFocus));
  const [userPanned, setUserPanned] = useState(false);
  const lastFitTimeRef = useRef(0);
  const { theme } = useContext(SimulationContext);
  const tomtomKey = import.meta.env.VITE_TOMTOM_KEY;
  const olaKey = import.meta.env.VITE_OLA_MAPS_API_KEY;

  // Helper to safely parse coordinates into numeric [lat, lng]
  const parseCoords = (pos) => {
    if (!pos) return null;
    if (Array.isArray(pos) && pos.length >= 2 && !isNaN(pos[0]) && !isNaN(pos[1])) {
      return [Number(pos[0]), Number(pos[1])];
    }
    if (pos.lat != null && pos.lng != null && !isNaN(pos.lat) && !isNaN(pos.lng)) {
      return [Number(pos.lat), Number(pos.lng)];
    }
    return null;
  };

  // 1. Current Driver / Ambulance Location
  const driverCoords = parseCoords(ambulancePosition) || (
    selectedAmbulance ? parseCoords([selectedAmbulance.lat, selectedAmbulance.lng]) : null
  );

  // 2. Destination to Reach (Incident Scene or Hospital ER)
  const targetCoords = parseCoords(destinationLocation) || (
    phase === 'arrived' && selectedHospital
      ? parseCoords(selectedHospital)
      : (parseCoords(emergencyLocation) || parseCoords(selectedHospital))
  );

  // Fit bounds to show BOTH driver current location AND destination location
  const fitDriverAndTarget = (force = false) => {
    if (!mapRef.current) return;
    const now = Date.now();
    if (!force && now - lastFitTimeRef.current < 1200) return;
    lastFitTimeRef.current = now;

    const points = [];
    if (driverCoords) points.push(driverCoords);
    if (targetCoords) points.push(targetCoords);

    if (points.length >= 2) {
      // Both driver and destination exist: frame both in view with padding
      const bounds = L.latLngBounds(points);
      mapRef.current.fitBounds(bounds, {
        padding: [65, 65],
        maxZoom: 16,
        animate: true,
        duration: 1.0
      });
    } else if (points.length === 1) {
      mapRef.current.flyTo(points[0], 15, { animate: true, duration: 1.0 });
    } else if (route && route.length > 5) {
      mapRef.current.fitBounds(L.latLngBounds(route), { padding: [60, 60], duration: 1.0 });
    }
  };

  // Sync autoFocus prop changes
  useEffect(() => {
    if (autoFocus) {
      setIsAutoFocusActive(true);
      setUserPanned(false);
      const timer = setTimeout(() => fitDriverAndTarget(true), 350);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Keep driver and destination in focus on position updates
  useEffect(() => {
    if (isAutoFocusActive && !userPanned && (driverCoords || targetCoords)) {
      fitDriverAndTarget(false);
    }
  }, [ambulancePosition, emergencyLocation, selectedHospital, destinationLocation, isAutoFocusActive, userPanned]);

  // Search location handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      let coords = null;
      if (olaKey) {
        try {
          const olaRes = await fetch(`https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(searchQuery)}&api_key=${olaKey}`);
          if (olaRes.ok) {
            const olaData = await olaRes.json();
            const loc = olaData?.geocodingResults?.[0]?.geometry?.location;
            if (loc?.lat && loc?.lng) coords = { lat: loc.lat, lon: loc.lng };
          }
        } catch (_) {}
      }

      if (!coords) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }

      if (coords && coords.lat && coords.lon && mapRef.current) {
        mapRef.current.flyTo([coords.lat, coords.lon], 14, { duration: 1.5 });
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleLiveLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => mapRef.current?.flyTo([coords.latitude, coords.longitude], 15, { duration: 1.5 }),
        (err) => alert('Location error: ' + err.message)
      );
    }
  };

  useEffect(() => {
    if (!autoFocus && emergencyLocation && mapRef.current) {
      mapRef.current.flyTo([emergencyLocation.lat, emergencyLocation.lng], 14, { duration: 1.2 });
    }
  }, [emergencyLocation, autoFocus]);

  useEffect(() => {
    if (!autoFocus && route && route.length > 5 && mapRef.current) {
      mapRef.current.fitBounds(L.latLngBounds(route), { padding: [60, 60], duration: 1.5 });
    }
  }, [route, autoFocus]);

  const canClick = phase === 'idle' || phase === 'located';
  const showHospitalNames = phase === 'enroute' || phase === 'arrived';

  const hospitalRankMap = {};
  rankedHospitals.forEach((h, i) => { hospitalRankMap[h.id] = i + 1; });

  const isOlaConfigured = Boolean(olaKey && olaKey.trim().length > 0);
  const tileUrl = isOlaConfigured
    ? `https://api.olamaps.io/tiles/default/v1/styles/${theme === 'dark' ? 'default-dark-standard' : 'default-light-standard'}/{z}/{x}/{y}.png?api_key=${olaKey}`
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attributionText = isOlaConfigured
    ? '&copy; <a href="https://maps.ola.com" target="_blank" rel="noopener noreferrer">Ola Maps</a> • Krutrim Mobility'
    : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      {/* ── Top Left Floating Search, Quick Location & Auto Focus Bar ─── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 bg-white/95 dark:bg-[#10243A]/95 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-card backdrop-blur-md">
        <div className="flex items-center px-2 text-slate-400">
          <Search size={14} />
        </div>
        <input
          type="text"
          placeholder="Search location or area..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-32 md:w-52"
        />
        <button
          onClick={handleSearch}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-primary-700 text-white hover:bg-primary-800 dark:bg-primary dark:hover:bg-slate-800 transition-colors"
        >
          Find
        </button>
        <button
          onClick={handleLiveLocation}
          title="My Location"
          className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Navigation size={14} />
        </button>

        {/* Auto Focus Driver & Target Button */}
        {(driverCoords || targetCoords || autoFocus) && (
          <button
            type="button"
            onClick={() => {
              setIsAutoFocusActive(true);
              setUserPanned(false);
              fitDriverAndTarget(true);
            }}
            title="Auto Focus: Keep Driver Location and Destination Target in View"
            className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-sm ${
              isAutoFocusActive && !userPanned
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-1 ring-emerald-400'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black animate-pulse'
            }`}
          >
            <Crosshair size={13} className={isAutoFocusActive && !userPanned ? 'animate-pulse' : ''} />
            <span className="hidden sm:inline">
              {isAutoFocusActive && !userPanned
                ? '🎯 Auto Focus (Driver ➔ Target)'
                : '🎯 Focus Driver & Target'}
            </span>
            <span className="sm:hidden">
              {isAutoFocusActive && !userPanned ? '🎯 Focus ON' : '🎯 Re-Focus'}
            </span>
          </button>
        )}
      </div>

      {/* ── Top Right Tile Provider Status Badge ────────────────────── */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 bg-white/95 dark:bg-[#10243A]/95 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-card text-[11px] font-medium text-slate-700 dark:text-slate-200 backdrop-blur-md">
        <span className={`w-2 h-2 rounded-full ${isOlaConfigured ? 'bg-teal' : 'bg-primary-500'}`} />
        <span>{isOlaConfigured ? 'Ola Maps Real-Time Cartography' : 'OpenStreetMap Live Basemap'}</span>
      </div>

      {/* ── Alternate Routes Legend (Floating Top-Right) ─────────────── */}
      {alternateRoutes && alternateRoutes.length > 0 && (
        <div className="absolute top-12 right-3 z-[1000] bg-white/95 dark:bg-[#10243A]/95 border border-slate-200 dark:border-slate-700/80 rounded-lg p-2.5 shadow-card text-xs backdrop-blur-md max-w-xs space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Alternate Road Corridors
          </div>
          {alternateRoutes.map((alt, i) => (
            <button
              key={i}
              onClick={() => onSelectAlternate && onSelectAlternate(i)}
              className="w-full text-left px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-[11px] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            >
              Corridor {i + 1}: {Math.round(alt.distanceMeters / 1000 * 10) / 10} km · {Math.round(alt.durationSecs / 60)} min
            </button>
          ))}
        </div>
      )}

      {/* ── Leaflet Interactive Map ──────────────────────────────────── */}
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          key={`base-${theme}-${isOlaConfigured}`}
          url={tileUrl}
          attribution={attributionText}
          maxZoom={19}
        />

        {tomtomKey && trafficEnabled && (
          <TileLayer
            key={`traffic-${theme}`}
            url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${tomtomKey}&tileSize=256`}
            attribution='Traffic &copy; TomTom'
            opacity={0.65}
            maxZoom={19}
            zIndex={400}
          />
        )}

        <MapEventsController onMapClick={onMapClick} canClick={canClick} onUserPan={() => setUserPanned(true)} />

        {/* ── Alternate routes (amber dashed) ────────────────────────── */}
        {alternateRoutes && alternateRoutes.map((alt, i) => (
          alt.waypoints?.length > 1 && (
            <Polyline
              key={`alt-${i}`}
              positions={alt.waypoints}
              pathOptions={{ color: '#D97706', weight: 4, opacity: 0.7, dashArray: '8 6' }}
            />
          )
        ))}

        {/* ── Traffic segments on active route ───────────────────────── */}
        {trafficEnabled && trafficSegments.map((seg, i) =>
          seg.positions?.length > 1 && (
            <Polyline
              key={`traffic-${i}`}
              positions={seg.positions}
              pathOptions={{ color: seg.color, weight: seg.weight || 6, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }}
            />
          )
        )}

        {/* ── Shortest route (Navy / Blue) ───────────────────────────── */}
        {shortestRoute?.length > 1 && (
          <Polyline
            positions={shortestRoute}
            pathOptions={{
              color: '#3B82F6',
              weight: routeMode === 'normal' ? 5 : 2,
              opacity: routeMode === 'normal' ? 0.9 : 0.35,
              dashArray: routeMode === 'normal' ? undefined : '6 6',
            }}
          />
        )}

        {/* ── Optimal route (Teal / Primary) ─────────────────────────── */}
        {optimalRoute?.length > 1 && (
          <>
            <Polyline
              positions={optimalRoute}
              pathOptions={{
                color: '#0F9D8A',
                weight: routeMode === 'optimal' ? 6 : 3,
                opacity: routeMode === 'optimal' ? 0.95 : 0.4,
              }}
            />
            {routeMode === 'optimal' && pickupIndex > 0 && (
              <Polyline
                positions={optimalRoute.slice(0, pickupIndex + 1)}
                pathOptions={{ color: '#E53935', weight: 4, opacity: 0.9 }}
              />
            )}
          </>
        )}

        {/* ── Alternative route (Purple) ─────────────────────────────── */}
        {alternativeRoute?.length > 1 && (
          <Polyline
            positions={alternativeRoute}
            pathOptions={{
              color: '#8B5CF6',
              weight: routeMode === 'alternative' ? 5 : 2,
              opacity: routeMode === 'alternative' ? 0.9 : 0.35,
              dashArray: routeMode === 'alternative' ? undefined : '6 6',
            }}
          />
        )}

        {/* ── Hospital Markers ───────────────────────────────────────── */}
        {hospitals.map(hospital => (
            <Marker
              key={`hosp-${hospital.id}`}
              position={[hospital.lat, hospital.lng]}
              icon={markerIcons.hospital(hospital, hospitalRankMap[hospital.id], showHospitalNames || hospital.id === selectedHospital?.id)}
              eventHandlers={{ click: () => onSelectHospital(hospital) }}
              zIndexOffset={hospital.id === selectedHospital?.id ? 600 : 100}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-slate-800 dark:text-slate-100">
                  <div className="font-bold text-sm text-primary dark:text-slate-100">{hospital.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{hospital.type}</div>
                  <div className="flex items-center gap-3 text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-teal">{hospital.beds || hospital.bedsAvailable || 50} Available Beds</span>
                    <span>⭐ {hospital.rating || '4.8'}</span>
                  </div>
                  {hospital.address && <div className="text-[11px] text-slate-500">{hospital.address}</div>}
                  {hospitalRankMap[hospital.id] && (
                    <div className="text-xs font-bold text-teal pt-1">
                      AI Recommended #{hospitalRankMap[hospital.id]}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* ── Ambulance Markers ──────────────────────────────────────── */}
        {ambulances.map(amb =>
          (phase !== 'enroute' && phase !== 'arrived') && (
            <Marker
              key={`amb-${amb.id}`}
              position={[amb.lat, amb.lng]}
              icon={markerIcons.ambulance(amb.name, amb.status, selectedAmbulance?.id === amb.id)}
              eventHandlers={{ click: () => onSelectAmbulance(amb) }}
              zIndexOffset={selectedAmbulance?.id === amb.id ? 500 : 0}
            >
              <Popup>
                <div className="p-1 space-y-1 text-slate-800 dark:text-slate-100">
                  <div className="font-bold text-sm">{amb.name}</div>
                  <div className="text-xs text-slate-500">{amb.type}</div>
                  <div className="text-xs font-semibold">
                    Status: <span className={amb.status === 'available' ? 'text-teal' : 'text-amber-600'}>{amb.status?.toUpperCase()}</span>
                  </div>
                  {amb.distance && <div className="text-xs text-slate-600 dark:text-slate-300">Distance: {amb.distance} km away</div>}
                  {amb.score && <div className="text-xs font-semibold text-teal">Dispatch Score: {amb.score}/100</div>}
                </div>
              </Popup>
            </Marker>
          )
        )}

        {/* ── Emergency Location Pin ─────────────────────────────────── */}
        {emergencyLocation && (
          <Marker
            position={[emergencyLocation.lat, emergencyLocation.lng]}
            icon={markerIcons.emergency}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="p-1 text-slate-800 dark:text-slate-100">
                <div className="font-bold text-sm text-emergency">Emergency Incident Location</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {emergencyLocation.lat.toFixed(4)}, {emergencyLocation.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ── Live Moving Ambulance Marker ───────────────────────────── */}
        {ambulancePosition && (
          <Marker
            position={ambulancePosition}
            icon={markerIcons.movingAmbulance}
            zIndexOffset={2000}
          >
            <Popup>
              <div className="p-1 text-slate-800 dark:text-slate-100">
                <div className="font-bold text-sm text-teal">{selectedAmbulance?.name || 'Unit En Route'}</div>
                <div className="text-xs text-slate-500">Live GPS Telemetry Active</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ── Bottom Click Prompt (when idle) ─────────────────────────── */}
      {canClick && !emergencyLocation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[800] bg-white/95 dark:bg-[#10243A]/95 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-elevated text-xs font-medium text-slate-800 dark:text-slate-200 backdrop-blur-md flex items-center gap-2 pointer-events-none">
          <MapPin size={14} className="text-emergency" />
          <span>Click anywhere on the map to place an emergency incident coordinate</span>
        </div>
      )}

      {/* ── Bottom Route Corridor Legend ─────────────────────────────── */}
      {(shortestRoute?.length > 1 || optimalRoute?.length > 1 || alternativeRoute?.length > 1) && (
        <div className="absolute bottom-4 left-3 z-[900] bg-white/95 dark:bg-[#10243A]/95 border border-slate-200 dark:border-slate-700/80 rounded-lg p-2.5 shadow-card text-[11px] backdrop-blur-md flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Navigation Routes
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 rounded bg-teal" />
              <span className={`text-[11px] ${routeMode === 'optimal' ? 'font-bold text-teal' : 'text-slate-500'}`}>
                Optimal
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 rounded bg-blue-500" />
              <span className={`text-[11px] ${routeMode === 'normal' ? 'font-bold text-blue-500' : 'text-slate-500'}`}>
                Shortest
              </span>
            </div>
            {alternativeRoute?.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 rounded bg-purple-500" />
                <span className={`text-[11px] ${routeMode === 'alternative' ? 'font-bold text-purple-500' : 'text-slate-500'}`}>
                  Alt
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
