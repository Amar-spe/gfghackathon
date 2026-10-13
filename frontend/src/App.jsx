import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import MapView from './components/MapView';
import Header from './components/Header';
import EmergencyInput from './components/EmergencyInput';
import AmbulancePanel from './components/AmbulancePanel';
import HospitalPanel from './components/HospitalPanel';
import RouteSelector from './components/RouteSelector';
import ControlPanel from './components/ControlPanel';
import AlertSystem from './components/AlertSystem';
import Dashboard from './components/Dashboard';
import SOSOverlay from './components/SOSOverlay';
import DispatchTimeline from './components/DispatchTimeline';
import CitizenDashboard from './components/citizen/CitizenDashboard';
import HospitalDashboard from './components/hospital/HospitalDashboard';
import AmbulanceCockpit from './components/ambulance/AmbulanceCockpit';
import CityEmergenciesPanel from './components/CityEmergenciesPanel';
import RoleLoginModal from './components/auth/RoleLoginModal';
import { Ambulance, Radio, Lock, ArrowRight, ArrowLeft, AlertOctagon, AlertCircle } from 'lucide-react';
import { useHospitalBeds, generateHospitalsAroundLocation } from './context/HospitalBedContext';
import { SimulationContext } from './context/SimulationContext';

import { scoreAmbulance, scoreHospital, getTrafficMultiplier } from './utils/aiEngine';
import {
  generateRoadAmbulances,
  generateDualRoutes, rerouteFromPosition,
  getPickupIndex, calculateDistance,
  fetchHospitalsFromBackend,
} from './utils/geoUtils';
import {
  generateTrafficConditions,
  generateTrafficSegments, shouldReroute,
  fetchRealTimeTraffic, fetchFlowSegment, levelFromFlowSegment, TRAFFIC_LEVELS,
} from './utils/trafficSimulator';

const DEFAULT_CITY_EMERGENCIES = [
  {
    id: 'EMG-801',
    locationName: 'Indiranagar 100ft Rd',
    type: 'Accident',
    lat: 12.9716,
    lng: 77.6412,
    timeReported: '3m ago',
    status: 'PENDING',
    severity: 'CRITICAL'
  },
  {
    id: 'EMG-802',
    locationName: 'Koramangala 5th Block',
    type: 'Cardiac Arrest',
    lat: 12.9352,
    lng: 77.6245,
    timeReported: '1m ago',
    status: 'PENDING',
    severity: 'CODE RED'
  },
  {
    id: 'EMG-803',
    locationName: 'Whitefield Tech Zone',
    type: 'Burn',
    lat: 12.9698,
    lng: 77.7499,
    timeReported: '6m ago',
    status: 'PENDING',
    severity: 'URGENT'
  },
  {
    id: 'EMG-804',
    locationName: 'Jayanagar 4th Block',
    type: 'Trauma',
    lat: 12.9250,
    lng: 77.5938,
    timeReported: '8m ago',
    status: 'PENDING',
    severity: 'SEVERE'
  },
  {
    id: 'EMG-805',
    locationName: 'Malleshwaram 8th Cross',
    type: 'Stroke',
    lat: 12.9982,
    lng: 77.5704,
    timeReported: '2m ago',
    status: 'PENDING',
    severity: 'CRITICAL'
  }
];

// ─── App ───────────────────────────────────────────────────────────
export default function App() {
  // ── Core state ──────────────────────────────────────────────────
  const [phase, setPhase]                           = useState('idle');
  // Landing view = citizen portal by default (no login required)
  const [currentView, setCurrentView]               = useState('citizen'); // 'citizen' | 'dispatch' | 'hospital' | 'ambulance'
  const [dispatcherMobileTab, setDispatcherMobileTab] = useState('map'); // 'queue' | 'map' | 'dispatch'
  const { theme, toggleTheme } = useContext(SimulationContext);
  const darkMode = theme === 'dark';
  // Track which role portals are logged in: { dispatch: {...user}, hospital: {...user}, ambulance: {...user} }
  const [loggedInRoles, setLoggedInRoles] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeline_logged_in_roles');
      return saved ? JSON.parse(saved) : {};
    } catch (_) { return {}; }
  });
  // Which login modal is open (null = none)
  const [loginModalRole, setLoginModalRole]         = useState(null);
  const [emergencyLocation, setEmergencyLocation]   = useState(null);
  const [emergencyType, setEmergencyType]           = useState('Accident');

  const {
    hospitals: liveHospitalsContext,
    registerIncomingAmbulance,
    removeIncomingAmbulance,
    quickAdmit,
    getHospitalFleet,
    assignAmbulanceTask,
    activeMission,
    ambulanceLiveLocation
  } = useHospitalBeds();

  const [cityEmergencies, setCityEmergencies] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeline_city_emergencies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_CITY_EMERGENCIES;
  });
  const [activeEmergencyId, setActiveEmergencyId]   = useState(null);
  const [newCitizenAlert, setNewCitizenAlert]       = useState(null);

  // ── Ambulances ───────────────────────────────────────────────────
  const [ambulances, setAmbulances]                 = useState([]);
  const [selectedAmbulance, setSelectedAmbulance]   = useState(null);

  // ── Hospitals ────────────────────────────────────────────────────
  const [localHospitals, setLocalHospitals]         = useState([]);
  const [hospitalLoading, setHospitalLoading]        = useState(false);
  const [rankedHospitals, setRankedHospitals]       = useState([]);
  const [selectedHospital, setSelectedHospital]     = useState(null);

  // ── Route & animation ────────────────────────────────────────────
  // shortestRoute = blue (normal/fewest km), optimalRoute = green (traffic-avoiding), alternativeRoute = purple
  const [shortestRoute, setShortestRoute]           = useState([]);
  const [optimalRoute, setOptimalRoute]             = useState([]);
  const [alternativeRoute, setAlternativeRoute]     = useState([]);
  const [routeMetrics, setRouteMetrics]             = useState({ normal: null, optimal: null, alternative: null });
  const [activeRouteType, setActiveRouteType]       = useState('optimal');
  const [route, setRoute]                           = useState([]);         // active animated route
  const [alternateRoutes, setAlternateRoutes]       = useState([]);
  const [ambulancePosition, setAmbulancePosition]   = useState(null);
  const [routeProgress, setRouteProgress]           = useState(0);
  const [pickupIndex, setPickupIndex]               = useState(0);
  const [trafficSegments, setTrafficSegments]       = useState([]);

  // ── Traffic & mode ───────────────────────────────────────────────
  const [trafficEnabled, setTrafficEnabled]         = useState(true);
  const [emergencyMode, setEmergencyMode]           = useState(false);
  const [trafficConditions, setTrafficConditions]   = useState({});

  // ── Stats ─────────────────────────────────────────────────────────
  const [eta, setEta]                               = useState(null);
  const [distance, setDistance]                     = useState(null);
  const [normalTime, setNormalTime]                 = useState(null);
  const [optimizedTime, setOptimizedTime]           = useState(null);

  // ── Alerts ───────────────────────────────────────────────────────
  const [alerts, setAlerts]                         = useState([]);

  // ── Clock ────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime]               = useState('');

  // ── Route mode (‘optimal’ = auto-rerouting, ‘normal’ = direct) ───────
  const [routeMode, setRouteMode]                   = useState('optimal');

  // ── Rerouting state ─────────────────────────────────────
  const [rerouteCount, setRerouteCount]             = useState(0);

  // ── Dispatch Timeline ─────────────────────────────────────────────
  const TIMELINE_STEPS = [
    { key: 'created',   label: 'Emergency Created' },
    { key: 'assigned',  label: 'Ambulance Assigned' },
    { key: 'enroute',   label: 'Ambulance En Route' },
    { key: 'pickup',    label: 'Patient Picked Up' },
    { key: 'arrived',   label: 'Reached Hospital' },
  ];
  const [dispatchTimeline, setDispatchTimeline]      = useState([]);

  // ── Refs ──────────────────────────────────────────────────────────
  const animRef            = useRef(null);
  const routeRef           = useRef([]);
  const idxRef             = useRef(0);
  const etaBaseRef         = useRef(0);
  const rerouteTimerRef    = useRef(null);
  const trafficTimerRef    = useRef(null);
  const patientPickedUpRef = useRef(false);
  const pickupIndexRef     = useRef(0);

  // ── Clock tick ───────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Alert helpers ─────────────────────────────────────────────────
  const addAlert = useCallback((message, type = 'info') => {
    const alert = { id: Date.now() + Math.random(), message, type, time: new Date().toLocaleTimeString('en-IN') };
    setAlerts(prev => [alert, ...prev].slice(0, 8));
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // ── Rank helpers ──────────────────────────────────────────────────
  const rankAmbulances = useCallback((ambs, loc, traffic, eMode, eType = 'General') => {
    return [...ambs].map(a => {
      const scoring = scoreAmbulance(a, loc, traffic, eMode, eType);
      const scoreVal = typeof scoring === 'number' ? scoring : (scoring?.score ?? 0);
      const trafficLevel = traffic[`amb_${a.id}`] || 'LOW';
      const mult = getTrafficMultiplier(trafficLevel, eMode);
      const dist = calculateDistance(a.lat, a.lng, loc.lat, loc.lng);
      const effectiveDist = dist * mult;
      const eta = (effectiveDist / 40) * 60;
      return {
        ...a,
        ...(typeof scoring === 'object' ? scoring : {}),
        score: scoreVal,
        distance: parseFloat(dist.toFixed(2)),
        estimatedArrival: parseFloat(eta.toFixed(1)),
        isAvailable: a.status === 'available',
      };
    }).sort((a, b) => {
      // Available units ALWAYS rank ahead of non-available units
      const aAvail = a.status === 'available';
      const bAvail = b.status === 'available';
      if (aAvail && !bAvail) return -1;
      if (!aAvail && bAvail) return 1;
      return b.score - a.score;
    });
  }, []);

  const rankHospitals = useCallback((hospList, loc, eType, traffic, eMode) => {
    return hospList.map(h => {
      const r = scoreHospital(h, loc, eType, traffic, eMode);
      return { ...h, ...r };
    }).sort((a, b) => b.score - a.score);
  }, []);

  // ── Map click → set emergency ─────────────────────────────────────
  const handleMapClick = useCallback(async (latlng) => {
    if (phase !== 'idle' && phase !== 'located') return;
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }

    const loc = { lat: latlng.lat, lng: latlng.lng };
    setEmergencyLocation(loc);
    setPhase('located');
    setRoute([]); setAlternateRoutes([]);
    setAmbulancePosition(null); setRouteProgress(0);
    setEta(null); setDistance(null);
    setNormalTime(null); setOptimizedTime(null);

    // Initialize dispatch timeline — step 1: Emergency Created
    const now = new Date().toLocaleTimeString('en-IN');
    setDispatchTimeline([
      { key: 'created', label: 'Emergency Created', time: now, done: true, active: false },
      { key: 'assigned', label: 'Ambulance Assigned', time: null, done: false, active: false },
      { key: 'enroute', label: 'Ambulance En Route', time: null, done: false, active: false },
      { key: 'pickup', label: 'Patient Picked Up', time: null, done: false, active: false },
      { key: 'arrived', label: 'Reached Hospital', time: null, done: false, active: false },
    ]);

    addAlert('Querying nearby hospital facilities via Ola Maps...', 'info');
    setHospitalLoading(true);

    // Parallel fetch: hospitals (via backend) + real traffic
    const [fetchedHospitals, realTraffic] = await Promise.all([
      fetchHospitalsFromBackend(loc.lat, loc.lng),
      fetchRealTimeTraffic(loc.lat, loc.lng),
    ]);

    setHospitalLoading(false);

    const activeHospitalsPool = (fetchedHospitals && fetchedHospitals.length > 0)
      ? fetchedHospitals
      : (liveHospitalsContext && liveHospitalsContext.length > 0 ? liveHospitalsContext : []);

    // Dynamically guarantee 6 realistic apex trauma & emergency facilities clustered right around the incident (1-4 km)
    const nearbyPool = generateHospitalsAroundLocation(loc.lat, loc.lng, activeHospitalsPool);

    if (nearbyPool.length === 0) {
      addAlert('No hospitals found in this area — please select a different location', 'warning');
      setLocalHospitals([]);
      setRankedHospitals([]);
      setSelectedHospital(null);
      setAmbulances([]);
      setSelectedAmbulance(null);
      return;
    }

    // Enrich fetched hospitals with live bed metrics from context
    const enrichedHospitals = nearbyPool.map(h => {
      const match = (liveHospitalsContext || []).find(lh => lh.id === h.id || (lh.name && h.name && lh.name.toLowerCase().includes(h.name.toLowerCase().slice(0, 6))));
      if (!match) return h;
      return {
        ...h,
        bedsAvailable: match.bedsAvailable,
        bedsTotal: match.bedsTotal,
        icuAvailable: match.icuAvailable,
        icuTotal: match.icuTotal,
        erBaysAvailable: match.erBaysAvailable,
        erBaysTotal: match.erBaysTotal
      };
    });

    setLocalHospitals(enrichedHospitals);

    const rankedH = rankHospitals(enrichedHospitals, loc, emergencyType, {}, emergencyMode);
    // Display all nearby ranked hospitals so the dispatcher and citizen see all options
    setRankedHospitals(rankedH);
    const targetHosp = rankedH[0];
    setSelectedHospital(targetHosp);

    // Load the dedicated ambulance fleet belonging to this selected hospital
    addAlert(`Selected ${targetHosp.name} — Loading dedicated hospital ambulance fleet...`, 'info');
    const newAmbs = getHospitalFleet(targetHosp.id, targetHosp.name, targetHosp.lat, targetHosp.lng);

    // Traffic conditions
    const traffic = generateTrafficConditions(newAmbs, enrichedHospitals, undefined, realTraffic);
    setTrafficConditions(traffic);

    // AI scoring for this hospital's ambulances
    const scored = rankAmbulances(newAmbs, loc, traffic, emergencyMode, emergencyType);
    setAmbulances(scored);
    const bestAvail = scored.find(a => a.status === 'available') || scored[0];
    setSelectedAmbulance(bestAvail);

    // Mark timeline step 2: Ambulance Assigned
    const assignTime = new Date().toLocaleTimeString('en-IN');
    setDispatchTimeline(prev => prev.map(s =>
      s.key === 'assigned' ? { ...s, done: true, active: false, time: assignTime } : s
    ));

    const preEta = (bestAvail?.estimatedArrival || 5) + (targetHosp?.estimatedTime || 5);
    setEta(preEta);

    addAlert('Emergency incident coordinates registered. Evaluating triage matrix...', 'danger');
    setTimeout(() => addAlert(`Unit selected: ${bestAvail.name} (${targetHosp.name} Fleet)`, 'success'), 700);
    setTimeout(() => addAlert(`Hospital ER: ${targetHosp.name} — ${targetHosp.bedsAvailable ? targetHosp.bedsAvailable + ' beds available' : 'Active'}`, 'info'), 1400);
  }, [phase, emergencyMode, emergencyType, liveHospitalsContext, rankAmbulances, rankHospitals, addAlert, getHospitalFleet]);

  // Dispatcher select emergency from citywide queue
  const handleSelectCityEmergency = useCallback(async (emg) => {
    setActiveEmergencyId(emg.id);
    setEmergencyType(emg.type);
    await handleMapClick({ lat: emg.lat, lng: emg.lng });
    addAlert(`Central Dispatch focused incident: ${emg.locationName} (${emg.type})`, 'warning');
  }, [handleMapClick, addAlert]);


  // ── Core dispatch engine ──────────────────────────────────────────
  const executeDispatch = useCallback(async (loc, amb, hosp, traffic, mode, eType, startIdx = 0, currentRouteMode) => {
    if (!loc || !amb || !hosp) return;

    // Use explicitly passed routeMode to avoid stale closure issues
    const activeMode = currentRouteMode ?? routeMode;

    const from    = [amb.lat, amb.lng];
    const through = [loc.lat, loc.lng];
    const to      = [hosp.lat, hosp.lng];

    addAlert('📡 Calculating road routes...', 'info');

    // Fetch all three routes simultaneously
    const { shortest, optimal, alternative, metrics } = await generateDualRoutes(from, through, to);

    // Validate routes — reject if they look like straight lines (too few points)
    const validShortest     = shortest     && shortest.length     > 10 ? shortest     : null;
    const validOptimal      = optimal      && optimal.length      > 10 ? optimal      : null;
    const validAlternative  = alternative  && alternative.length  > 10 ? alternative  : null;

    // If both failed, retry once
    let finalShortest    = validShortest;
    let finalOptimal     = validOptimal;
    let finalAlternative = validAlternative;
    if (!finalShortest || !finalOptimal) {
      addAlert('⚠️ Route API slow — retrying...', 'warning');
      const retry = await generateDualRoutes(from, through, to);
      finalShortest    = finalShortest    || (retry.shortest?.length     > 10 ? retry.shortest     : null);
      finalOptimal     = finalOptimal     || (retry.optimal?.length      > 10 ? retry.optimal      : null);
      finalAlternative = finalAlternative || (retry.alternative?.length  > 10 ? retry.alternative  : null);
    }

    if (!finalShortest && finalOptimal) finalShortest = finalOptimal;
    if (!finalOptimal  && finalShortest) finalOptimal  = finalShortest;
    if (!finalAlternative) finalAlternative = finalOptimal;

    // Store real metrics from routing APIs
    setRouteMetrics(metrics || { normal: null, optimal: null, alternative: null });

    // Active route depends on user's chosen mode
    const activeRoute = activeMode === 'normal'
      ? (finalShortest || finalOptimal)
      : activeMode === 'alternative'
        ? (finalAlternative || finalOptimal)
        : (finalOptimal || finalShortest);
    const pIdx = getPickupIndex(activeRoute);

    routeRef.current           = activeRoute;
    idxRef.current             = startIdx;
    pickupIndexRef.current     = pIdx;
    patientPickedUpRef.current = false;

    setShortestRoute(finalShortest || []);
    setOptimalRoute(finalOptimal || []);
    setAlternativeRoute(finalAlternative || []);
    setRoute(activeRoute);
    setAlternateRoutes([]);
    setActiveRouteType(activeMode);
    setAmbulancePosition(activeRoute[startIdx]);
    setPickupIndex(pIdx);
    setRouteProgress(0);
    setPhase('enroute');
    setTrafficSegments(generateTrafficSegments(activeRoute, traffic, mode));

    const distAmbToEmerg  = calculateDistance(amb.lat, amb.lng, loc.lat, loc.lng);
    const distEmergToHosp = calculateDistance(loc.lat, loc.lng, hosp.lat, hosp.lng);
    const totalDist = distAmbToEmerg + distEmergToHosp;
    setDistance(totalDist.toFixed(2));

    const normalMin = (totalDist / 35) * 60;
    const optMin    = normalMin * (mode ? 0.58 : 0.78);
    setNormalTime(normalMin.toFixed(1));
    setOptimizedTime(optMin.toFixed(1));
    etaBaseRef.current = optMin;

    if (startIdx === 0) {
      addAlert(`${amb.name} dispatched — ${activeMode.toUpperCase()} route active`, 'success');
      addAlert(`${activeMode === 'normal' ? 'Direct route — standard routing' : activeMode === 'alternative' ? 'Alternative road corridor active' : 'Optimal route — dynamic rerouting enabled'}`, 'info');
      if (mode) addAlert('Emergency signal override active — green wave priority', 'danger');
      addAlert(`En route to ${hosp.name}`, 'info');

      // Register incoming ambulance in Hospital Bed Command Center
      registerIncomingAmbulance({
        id: `intake-${amb.id}`,
        ambulanceName: amb.name,
        emergencyType: emergencyType,
        eta: optMin ? `${optMin.toFixed(1)} min` : '3.8 min',
        triageLevel: emergencyType === 'Cardiac Arrest' ? 'Code Red' : 'Severe Trauma',
        hospitalId: hosp.id
      });

      // Update city emergency call status
      if (activeEmergencyId) {
        setCityEmergencies(prev => prev.map(e => e.id === activeEmergencyId ? { ...e, status: 'EN ROUTE' } : e));
      }

      // Timeline step 3: Ambulance En Route
      const enrouteTime = new Date().toLocaleTimeString('en-IN');
      setDispatchTimeline(prev => prev.map(s =>
        s.key === 'enroute' ? { ...s, done: true, active: true, time: enrouteTime } : s
      ));
    } else {
      addAlert('Traffic rerouted — unit following updated road corridor', 'success');
    }

    // If Paramedic / Ambulance person has logged in and is streaming live device GPS:
    // DO NOT SIMULATE IT! Position is driven strictly by live telemetry from the device.
    if (ambulanceLiveLocation?.active) {
      addAlert('Live Paramedic GPS telemetry active — real-time position reporting', 'info');
      setAmbulancePosition([ambulanceLiveLocation.lat, ambulanceLiveLocation.lng]);
      return;
    }

    const realDurMs  = optMin * 60 * 1000;
    const animDurMs  = realDurMs / 60;

    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      idxRef.current++;
      const idx = idxRef.current;
      const currentRoute = routeRef.current;
      const totalPts = currentRoute.length;
      const targetPickupIdx = pickupIndexRef.current;
      const intervalMs = Math.max(40, animDurMs / totalPts);

      if (idx >= totalPts - 1) {
        clearInterval(animRef.current); animRef.current = null;
        if (rerouteTimerRef.current) clearInterval(rerouteTimerRef.current);
        if (trafficTimerRef.current) clearInterval(trafficTimerRef.current);
        setAmbulancePosition(currentRoute[totalPts - 1]);
        setRouteProgress(100);
        setEta(0);
        setPhase('arrived');

        // Hospital Bed Allocation: auto-decrement available bed & remove intake
        quickAdmit(hosp.id, emergencyType === 'Cardiac Arrest');
        removeIncomingAmbulance(`intake-${amb.id}`);

        if (activeEmergencyId) {
          setCityEmergencies(prev => prev.map(e => e.id === activeEmergencyId ? { ...e, status: 'RESOLVED' } : e));
        }

        // Timeline step 5: Reached Hospital
        const arrivedTime = new Date().toLocaleTimeString('en-IN');
        setDispatchTimeline(prev => prev.map(s =>
          s.key === 'arrived' ? { ...s, done: true, active: false, time: arrivedTime }
          : s.key === 'enroute' ? { ...s, active: false } : s
        ));
        addAlert(`Ambulance arrived at ${hosp.name}`, 'success');
        addAlert('Patient handover complete — ER bay confirmed and mission concluded', 'info');
        return;
      }

      setAmbulancePosition(currentRoute[idx]);
      setRouteProgress(Math.min(99, Math.floor((idx / totalPts) * 100)));
      setEta(etaBaseRef.current * Math.max(0, 1 - idx / totalPts));

      if (idx === Math.floor(totalPts * 0.3) && !patientPickedUpRef.current)  addAlert('Approaching incident pickup coordinates', 'info');
      if (idx >= targetPickupIdx && !patientPickedUpRef.current) {
        patientPickedUpRef.current = true;
        addAlert('Patient on board — proceeding to destination emergency department', 'success');
        // Timeline step 4: Patient Picked Up
        const pickupTime = new Date().toLocaleTimeString('en-IN');
        setDispatchTimeline(prev => prev.map(s =>
          s.key === 'pickup' ? { ...s, done: true, active: false, time: pickupTime } : s
        ));
      }
      if (idx === Math.floor(totalPts * 0.75) && patientPickedUpRef.current) addAlert('Approaching hospital facility — alerting trauma team', 'warning');
    }, Math.max(40, (optMin * 60 * 1000 / 60) / (activeRoute.length || 50)));
  }, [addAlert, routeMode, ambulanceLiveLocation]);

  // ── Real-Time Live GPS Stream Sync (Ambulance MDT -> Dispatcher & Citizen) ──
  useEffect(() => {
    if (!ambulanceLiveLocation?.lat || !ambulanceLiveLocation?.lng) return;

    if (ambulanceLiveLocation.active) {
      // Clear synthetic timer animation if running
      if (animRef.current) {
        clearInterval(animRef.current);
        animRef.current = null;
      }

      const currentPos = [ambulanceLiveLocation.lat, ambulanceLiveLocation.lng];
      setAmbulancePosition(currentPos);

      if (phase === 'enroute' || phase === 'located') {
        const targetPt = !patientPickedUpRef.current && emergencyLocation
          ? emergencyLocation
          : selectedHospital;

        if (targetPt) {
          const remDist = calculateDistance(
            ambulanceLiveLocation.lat,
            ambulanceLiveLocation.lng,
            targetPt.lat,
            targetPt.lng
          );
          setDistance(remDist.toFixed(2));
          const effectiveSpeed = ambulanceLiveLocation.speed > 10 ? ambulanceLiveLocation.speed : 45;
          const liveEtaMin = (remDist / effectiveSpeed) * 60;
          setEta(Math.max(0.5, Math.round(liveEtaMin * 10) / 10));

          // Proximity milestone: Patient pickup at scene (within 250m)
          if (!patientPickedUpRef.current && emergencyLocation && remDist <= 0.25) {
            patientPickedUpRef.current = true;
            addAlert('Live Paramedic arrived at scene — patient intake complete', 'success');
            const pickupTime = new Date().toLocaleTimeString('en-IN');
            setDispatchTimeline(prev => prev.map(s =>
              s.key === 'pickup' ? { ...s, done: true, active: false, time: pickupTime } : s
            ));
          }

          // Proximity milestone: Hospital arrival (within 250m)
          if (patientPickedUpRef.current && selectedHospital && remDist <= 0.25 && phase !== 'arrived') {
            setPhase('arrived');
            quickAdmit(selectedHospital.id, emergencyType === 'Cardiac Arrest');
            removeIncomingAmbulance(`intake-${selectedAmbulance?.id || 101}`);
            const arrivedTime = new Date().toLocaleTimeString('en-IN');
            setDispatchTimeline(prev => prev.map(s =>
              s.key === 'arrived' ? { ...s, done: true, active: false, time: arrivedTime }
              : s.key === 'enroute' ? { ...s, active: false } : s
            ));
            addAlert(`Ambulance arrived at ${selectedHospital.name}. ER handover complete.`, 'success');
          }
        }
      }
    }
  }, [ambulanceLiveLocation, phase, emergencyLocation, selectedHospital, selectedAmbulance, emergencyType, quickAdmit, removeIncomingAmbulance, addAlert]);


  // ── Preview both routes when hospital/ambulance selected ─────────
  const previewRoutesRef = useRef(null);
  useEffect(() => {
    if (phase !== 'located' || !selectedAmbulance || !selectedHospital || !emergencyLocation) return;
    // Debounce to avoid firing on every render
    if (previewRoutesRef.current) clearTimeout(previewRoutesRef.current);
    previewRoutesRef.current = setTimeout(async () => {
      const from    = [selectedAmbulance.lat, selectedAmbulance.lng];
      const through = [emergencyLocation.lat, emergencyLocation.lng];
      const to      = [selectedHospital.lat, selectedHospital.lng];
      const { shortest, optimal, alternative, metrics } = await generateDualRoutes(from, through, to);
      if (shortest?.length    > 10) setShortestRoute(shortest);
      if (optimal?.length     > 10) setOptimalRoute(optimal);
      if (alternative?.length > 10) setAlternativeRoute(alternative);
      if (metrics) setRouteMetrics(metrics);
    }, 400);
    return () => clearTimeout(previewRoutesRef.current);
  }, [phase, selectedAmbulance, selectedHospital, emergencyLocation]);

  // ── Hospital Selection & Fleet Switching Handler ───────────────────
  const handleHospitalChange = useCallback((hosp) => {
    if (!hosp) return;
    setSelectedHospital(hosp);

    // Load that hospital's dedicated fleet
    const fleet = getHospitalFleet(hosp.id, hosp.name, hosp.lat, hosp.lng);
    
    if (emergencyLocation) {
      const traffic = generateTrafficConditions(fleet, localHospitals, undefined);
      setTrafficConditions(traffic);
      const scored = rankAmbulances(fleet, emergencyLocation, traffic, emergencyMode, emergencyType);
      setAmbulances(scored);
      const best = scored.find(a => a.status === 'available') || scored[0];
      setSelectedAmbulance(best);
      addAlert(`Selected ${hosp.name} — Loaded dedicated ambulance fleet (${fleet.length} units)`, 'info');
    } else {
      setAmbulances(fleet);
      setSelectedAmbulance(fleet.find(a => a.status === 'available') || fleet[0]);
    }
  }, [emergencyLocation, localHospitals, emergencyMode, emergencyType, rankAmbulances, addAlert, getHospitalFleet]);

  // ── Manual dispatch wrapper with Task Assignment ───────────────────
  const handleDispatch = useCallback(() => {
    if (!selectedAmbulance || !selectedHospital || !emergencyLocation) return;
    setRerouteCount(0);

    // Create full mission task directive assigned to this unit
    const mission = {
      taskId: `TSK-${selectedAmbulance.id}-${Date.now().toString().slice(-4)}`,
      emergencyType,
      patientLocation: {
        lat: emergencyLocation.lat,
        lng: emergencyLocation.lng,
        address: emergencyLocation.address || 'Emergency Incident Scene',
        contact: '+91-98450-12345 (Citizen On Scene)'
      },
      destinationHospital: {
        id: selectedHospital.id,
        name: selectedHospital.name,
        address: selectedHospital.address || 'Hospital Emergency Receiving Bay',
        assignedBay: `ER Trauma Bay #${(selectedHospital.id % 4) + 1} (Red Priority)`,
        receivingDoctor: `Dr. In-Charge (${selectedHospital.shortName || 'ER'} Lead)`,
        bedsAvailable: selectedHospital.bedsAvailable,
        icuAvailable: selectedHospital.icuAvailable
      },
      assignedAmbulance: selectedAmbulance,
      dispatchedAt: new Date().toLocaleTimeString('en-IN'),
      routingEngine: 'Ola Maps Directions API'
    };

    assignAmbulanceTask(selectedHospital.id, selectedAmbulance.id, mission);
    addAlert(`Mission ${mission.taskId} authorized: ${selectedAmbulance.name} (${selectedHospital.name} Fleet) dispatched`, 'danger');

    executeDispatch(emergencyLocation, selectedAmbulance, selectedHospital, trafficConditions, emergencyMode, emergencyType, 0, routeMode);
  }, [emergencyLocation, selectedAmbulance, selectedHospital, trafficConditions, emergencyMode, emergencyType, executeDispatch, routeMode, assignAmbulanceTask, addAlert]);

  // ── Dispatcher Quick Assign & Dispatch from CAD Queue ─────────────
  const handleQuickDispatch = useCallback(async (emg) => {
    if (!emg) return;
    setActiveEmergencyId(emg.id);
    setEmergencyType(emg.type);

    const loc = {
      lat: Number(emg.lat),
      lng: Number(emg.lng),
      address: emg.locationName || 'Emergency Incident Scene'
    };
    setEmergencyLocation(loc);
    setPhase('located');
    setRoute([]);
    setAlternateRoutes([]);
    setAmbulancePosition(null);
    setRouteProgress(0);
    setEta(null);
    setDistance(null);

    // Step 1: Emergency Created timeline
    const now = new Date().toLocaleTimeString('en-IN');
    setDispatchTimeline([
      { key: 'created', label: 'Emergency Created', time: now, done: true, active: false },
      { key: 'assigned', label: 'Ambulance Assigned', time: null, done: false, active: false },
      { key: 'enroute', label: 'Ambulance En Route', time: null, done: false, active: false },
      { key: 'pickup', label: 'Patient Picked Up', time: null, done: false, active: false },
      { key: 'arrived', label: 'Reached Hospital', time: null, done: false, active: false },
    ]);

    addAlert(`Intaking emergency call: ${emg.locationName} (${emg.type}) — assigning nearest unit...`, 'danger');

    // Step 2: Fetch and rank nearby hospitals
    setHospitalLoading(true);
    const [fetchedHospitals, realTraffic] = await Promise.all([
      fetchHospitalsFromBackend(loc.lat, loc.lng),
      fetchRealTimeTraffic(loc.lat, loc.lng),
    ]);
    setHospitalLoading(false);

    const activeHospitalsPool = (fetchedHospitals && fetchedHospitals.length > 0)
      ? fetchedHospitals
      : (liveHospitalsContext && liveHospitalsContext.length > 0 ? liveHospitalsContext : []);

    const nearbyPool = generateHospitalsAroundLocation(loc.lat, loc.lng, activeHospitalsPool);
    const enrichedHospitals = nearbyPool.map(h => {
      const match = (liveHospitalsContext || []).find(lh => lh.id === h.id || (lh.name && h.name && lh.name.toLowerCase().includes(h.name.toLowerCase().slice(0, 6))));
      return match ? {
        ...h,
        bedsAvailable: match.bedsAvailable,
        bedsTotal: match.bedsTotal,
        icuAvailable: match.icuAvailable,
        icuTotal: match.icuTotal,
        erBaysAvailable: match.erBaysAvailable,
        erBaysTotal: match.erBaysTotal
      } : h;
    });

    setLocalHospitals(enrichedHospitals);
    const rankedH = rankHospitals(enrichedHospitals, loc, emg.type, {}, emergencyMode);
    setRankedHospitals(rankedH);
    const targetHosp = rankedH[0] || enrichedHospitals[0];
    setSelectedHospital(targetHosp);

    // Step 3: Fleet & ambulance assignment
    const newAmbs = getHospitalFleet(targetHosp.id, targetHosp.name, targetHosp.lat, targetHosp.lng);
    const traffic = generateTrafficConditions(newAmbs, enrichedHospitals, undefined, realTraffic);
    setTrafficConditions(traffic);

    const scored = rankAmbulances(newAmbs, loc, traffic, emergencyMode, emg.type);
    setAmbulances(scored);
    const bestAvail = scored.find(a => a.status === 'available') || scored[0];
    setSelectedAmbulance(bestAvail);

    // Step 4: Timeline mark assigned
    const assignTime = new Date().toLocaleTimeString('en-IN');
    setDispatchTimeline(prev => prev.map(s =>
      s.key === 'assigned' ? { ...s, done: true, active: false, time: assignTime } : s
    ));

    // Step 5: Construct mission directive
    const mission = {
      taskId: `TSK-${bestAvail.id}-${Date.now().toString().slice(-4)}`,
      emergencyId: emg.id,
      emergencyType: emg.type,
      citizenName: emg.citizenName || 'Citizen Caller',
      patientLocation: {
        lat: loc.lat,
        lng: loc.lng,
        address: emg.locationName || 'Emergency Incident Scene',
        contact: '+91-98450-12345 (Citizen On Scene)',
        isLiveGps: !!emg.isLiveGps
      },
      destinationHospital: {
        id: targetHosp.id,
        name: targetHosp.name,
        address: targetHosp.address || 'Hospital Emergency Receiving Bay',
        assignedBay: `ER Trauma Bay #${(targetHosp.id % 4) + 1} (Red Priority)`,
        receivingDoctor: `Dr. In-Charge (${targetHosp.shortName || 'ER'} Lead)`,
        bedsAvailable: targetHosp.bedsAvailable,
        icuAvailable: targetHosp.icuAvailable
      },
      assignedAmbulance: bestAvail,
      dispatchedAt: new Date().toLocaleTimeString('en-IN'),
      routingEngine: 'Ola Maps Directions API'
    };

    assignAmbulanceTask(targetHosp.id, bestAvail.id, mission);
    try {
      localStorage.setItem('lifeline_active_mission', JSON.stringify(mission));
    } catch (_) {}

    addAlert(`${bestAvail.name} assigned to ${emg.locationName}. Calculating optimal road corridor...`, 'success');

    // Step 6: Execute dispatch and road navigation corridor
    await executeDispatch(loc, bestAvail, targetHosp, traffic, emergencyMode, emg.type, 0, routeMode);

    // Step 7: Update city emergency status to EN ROUTE
    setCityEmergencies(prev => {
      const updated = prev.map(item => item.id === emg.id ? { ...item, status: 'EN ROUTE', assignedAmbulance: bestAvail.name } : item);
      try { localStorage.setItem('lifeline_city_emergencies', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });

    // Step 8: Broadcast dispatch event for Ambulance MDT & Citizen Portal
    window.dispatchEvent(new CustomEvent('lifeline:ambulance-dispatched', {
      detail: { mission, ambulance: bestAvail, hospital: targetHosp, location: loc }
    }));
  }, [emergencyMode, routeMode, liveHospitalsContext, rankAmbulances, rankHospitals, getHospitalFleet, assignAmbulanceTask, executeDispatch, addAlert]);

  // ── Seamless rerouting helper ───────────────────────────────────────
  const performReroute = useCallback(async (conditions) => {
    if (phase !== 'enroute' || !selectedHospital) return;

    const currentIdx = idxRef.current;
    const currentRoute = routeRef.current;
    if (!currentRoute || currentIdx < 0 || currentIdx >= currentRoute.length) return;

    const currentPos = currentRoute[currentIdx];
    if (!currentPos) return;

    addAlert('Traffic congestion surge detected — recalculating road path...', 'warning');

    const isPickedUp = patientPickedUpRef.current || currentIdx >= pickupIndexRef.current;
    let newRemainingPath = null;

    if (isPickedUp) {
      // Patient already picked up: route directly from current ambulance position to hospital
      const rerouteData = await rerouteFromPosition(currentPos, [selectedHospital.lat, selectedHospital.lng]);
      newRemainingPath = rerouteData?.primary;
    } else if (emergencyLocation) {
      // Patient not yet picked up: route from current position through emergency location to hospital
      const dual = await generateDualRoutes(currentPos, [emergencyLocation.lat, emergencyLocation.lng], [selectedHospital.lat, selectedHospital.lng]);
      newRemainingPath = dual.optimal || dual.shortest;
    }

    if (!newRemainingPath || newRemainingPath.length < 2) return;

    setRerouteCount(c => c + 1);

    // Preserve already traveled path and splice new remaining path onto it
    const traveledPath = currentRoute.slice(0, currentIdx + 1);
    const splicedRoute = [...traveledPath, ...newRemainingPath.slice(1)];

    routeRef.current = splicedRoute;
    // idxRef.current remains at currentIdx — seamless continuation without teleporting!

    setOptimalRoute(splicedRoute);
    setRoute(splicedRoute);
    setTrafficSegments(generateTrafficSegments(splicedRoute, conditions || trafficConditions, emergencyMode));

    const newOptMin = etaBaseRef.current * 0.85;
    etaBaseRef.current = newOptMin;

    addAlert('Updated corridor calculated from unit location — seamless reroute applied', 'success');
  }, [phase, selectedHospital, emergencyLocation, trafficConditions, emergencyMode, addAlert]);

  // ── Auto-rerouting engine — only runs in 'optimal' mode ─────────
  useEffect(() => {
    // Skip rerouting entirely in Normal mode
    if (phase !== 'enroute' || routeMode !== 'optimal') {
      if (rerouteTimerRef.current) clearInterval(rerouteTimerRef.current);
      return;
    }

    rerouteTimerRef.current = setInterval(async () => {
      const conditions = trafficConditions;
      const progress   = Math.floor(idxRef.current / (routeRef.current.length || 1) * 100);
      if (!shouldReroute(conditions, progress)) return;
      if (rerouteCount >= 3) return;

      await performReroute(conditions);
    }, 30000);

    return () => clearInterval(rerouteTimerRef.current);
  }, [phase, routeMode, trafficConditions, rerouteCount, performReroute]);


  // ── Real-time traffic refresh every 60s ──────────────────────────
  useEffect(() => {
    if (phase === 'idle') return;
    trafficTimerRef.current = setInterval(async () => {
      if (!emergencyLocation) return;

      // Fetch new incident conditions
      const realTraffic = await fetchRealTimeTraffic(emergencyLocation.lat, emergencyLocation.lng);
      const newConditions = generateTrafficConditions(ambulances, localHospitals, undefined, realTraffic);
      setTrafficConditions(newConditions);

      if (phase === 'enroute' && route.length > 4) {
        // For each of 8 sample points along the route, get real speed ratio from TomTom
        const sampleCount = 8;
        const samplePoints = Array.from({ length: sampleCount }, (_, i) => {
          const idx = Math.floor((i / sampleCount) * route.length);
          return route[idx];
        });

        const flowResults = await Promise.all(
          samplePoints.map(pt => fetchFlowSegment(pt[0], pt[1]))
        );

        // Build a rich per-segment traffic array from actual road speed ratios
        const segLen = Math.floor(route.length / sampleCount);
        const richSegments = samplePoints.map((pt, i) => {
          const start = i * segLen;
          const end   = Math.min(start + segLen + 1, route.length);
          const lvl   = emergencyMode ? 'LOW' : levelFromFlowSegment(flowResults[i]);
          const info  = TRAFFIC_LEVELS[lvl];
          return { positions: route.slice(start, end), level: lvl, color: info.color, weight: info.weight };
        });

        setTrafficSegments(richSegments);
        addAlert('Real-time traffic telemetry refreshed', 'info');
      }
    }, 60000);
    return () => clearInterval(trafficTimerRef.current);
  }, [phase, emergencyLocation, ambulances, localHospitals, emergencyMode, route, addAlert]);

  // ── Real-time listener for incoming Citizen emergency reports & cross-tab sync ─────
  useEffect(() => {
    const handleCitizenEmergencyEvent = (e) => {
      const emg = e.detail;
      if (!emg) return;

      setCityEmergencies(prev => {
        if (prev.some(item => item.id === emg.id)) return prev;
        const updated = [emg, ...prev];
        try { localStorage.setItem('lifeline_city_emergencies', JSON.stringify(updated)); } catch (_) {}
        return updated;
      });

      setNewCitizenAlert(emg);
      addAlert(`Incoming emergency call: ${emg.locationName} (${emg.type}) reported by ${emg.citizenName || 'Citizen'}`, 'danger');
    };

    const handleStorageEvent = (e) => {
      if (e.key === 'lifeline_city_emergencies' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setCityEmergencies(parsed);
        } catch (_) {}
      }
    };

    window.addEventListener('lifeline:citizen-emergency', handleCitizenEmergencyEvent);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('lifeline:citizen-emergency', handleCitizenEmergencyEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [addAlert]);

  // ── Select alternate route ────────────────────────────────────────
  const handleSelectAlternate = useCallback((altIdx) => {
    const alt = alternateRoutes[altIdx];
    if (!alt) return;
    const newRoute = alt.waypoints;
    setRoute(newRoute);
    setAlternateRoutes(prev => prev.filter((_, i) => i !== altIdx));
    setTrafficSegments(generateTrafficSegments(newRoute, trafficConditions, emergencyMode));
    routeRef.current = newRoute;
    idxRef.current   = 0;
    addAlert(`Switched to alternate corridor ${altIdx + 1}`, 'success');
  }, [alternateRoutes, trafficConditions, emergencyMode, addAlert]);

  // ── SOS Automation (Backtick hotkey) ─────────────────────────────
  const triggerSOS = useCallback(async () => {
    if (phase !== 'idle' && phase !== 'located') {
      addAlert('Cannot trigger SOS while response mission is active.', 'warning');
      return;
    }
    if (!navigator.geolocation) {
      addAlert('Geolocation not supported by current browser', 'danger');
      return;
    }

    // Get location first, then show overlay
    navigator.geolocation.getCurrentPosition(async (position) => {
      if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }

      const loc   = { lat: position.coords.latitude, lng: position.coords.longitude };
      const eType = 'Cardiac Arrest';
      const eMode = true;

      // Pre-fetch data while overlay is shown
      addAlert('SOS initiated — acquiring location telemetry...', 'danger');

      const [fetchedHospitals, realTraffic] = await Promise.all([
        fetchHospitalsFromBackend(loc.lat, loc.lng),
        fetchRealTimeTraffic(loc.lat, loc.lng),
      ]);
      const baseHosps = fetchedHospitals?.length > 0 ? fetchedHospitals : liveHospitalsContext;
      const hospitals = generateHospitalsAroundLocation(loc.lat, loc.lng, baseHosps);
      const newAmbs   = await generateRoadAmbulances(loc.lat, loc.lng, 6, hospitals);
      const traffic   = generateTrafficConditions(newAmbs, hospitals, undefined, realTraffic);
      const scoredAmbs  = rankAmbulances(newAmbs, loc, traffic, eMode, eType);
      const scoredHosps = rankHospitals(hospitals, loc, eType, traffic, eMode);

      // Store pending dispatch args and show overlay
      sosPendingRef.current = { loc, eType, eMode, hospitals, newAmbs, traffic, scoredAmbs, scoredHosps };
      setSosVisible(true);
    }, (err) => {
      addAlert('Failed to acquire live GPS location: ' + err.message, 'danger');
    });
  }, [phase, rankAmbulances, rankHospitals, addAlert]);

  const handleSOSConfirm = useCallback(() => {
    setSosVisible(false);
    const p = sosPendingRef.current;
    if (!p) return;
    const { loc, eType, eMode, hospitals, newAmbs, traffic, scoredAmbs, scoredHosps } = p;
    sosPendingRef.current = null;

    const bestAvail = scoredAmbs.find(a => a.status === 'available') || scoredAmbs[0];

    setEmergencyLocation(loc);
    setPhase('located');
    setEmergencyType(eType);
    setEmergencyMode(eMode);
    setRoute([]); setAlternateRoutes([]);
    setAmbulancePosition(null); setRouteProgress(0);
    setEta(null); setDistance(null);
    setRerouteCount(0);
    setLocalHospitals(hospitals);
    setTrafficConditions(traffic);
    setAmbulances(scoredAmbs);
    setSelectedAmbulance(bestAvail);
    setRankedHospitals(scoredHosps.slice(0, 3));
    setSelectedHospital(scoredHosps[0]);

    addAlert('Emergency SOS confirmed — authorizing rapid unit dispatch', 'danger');
    executeDispatch(loc, bestAvail, scoredHosps[0], traffic, eMode, eType, 0, 'optimal');
  }, [executeDispatch, addAlert]);

  const handleSOSCancel = useCallback(() => {
    setSosVisible(false);
    sosPendingRef.current = null;
    addAlert('SOS cancelled — standby status restored', 'info');
  }, [addAlert]);

  // Global backtick key listener for SOS
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === '`') triggerSOS();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSOS]);

  // ── Emergency Mode Toggle ──────────────────────────────────────────
  const handleEmergencyModeToggle = useCallback(() => {
    setEmergencyMode(prev => {
      const next = !prev;
      addAlert(next ? '🟢 Green Corridor Preemption activated for Ambulance' : '⚪ Green Corridor Preemption deactivated', next ? 'success' : 'info');
      return next;
    });
  }, [addAlert]);

  // ── Reset ──────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (animRef.current)         { clearInterval(animRef.current);         animRef.current = null; }
    if (rerouteTimerRef.current) { clearInterval(rerouteTimerRef.current); rerouteTimerRef.current = null; }
    if (trafficTimerRef.current) { clearInterval(trafficTimerRef.current); trafficTimerRef.current = null; }
    patientPickedUpRef.current = false;
    pickupIndexRef.current = 0;
    setPhase('idle');
    setEmergencyLocation(null); setEmergencyType('Accident');
    setAmbulances([]); setSelectedAmbulance(null);
    setRankedHospitals([]); setSelectedHospital(null);
    setRoute([]); setShortestRoute([]); setOptimalRoute([]); setAlternativeRoute([]); setAlternateRoutes([]);
    setAmbulancePosition(null); setRouteProgress(0); setPickupIndex(0);
    setTrafficConditions({}); setTrafficSegments([]);
    setEta(null); setDistance(null); setNormalTime(null); setOptimizedTime(null);
    setAlerts([]); setEmergencyMode(false); setRerouteCount(0); setActiveRouteType('optimal'); setRouteMode('optimal'); setRouteMetrics({ normal: null, optimal: null, alternative: null });
    setDispatchTimeline([]); setHospitalLoading(false); setLocalHospitals([]);
    addAlert('🔄 System reset — ready for new emergency', 'info');
  }, [addAlert]);

  // ── Emergency type change ─────────────────────────────────────────
  const handleEmergencyTypeChange = useCallback((type) => {
    setEmergencyType(type);
    if (emergencyLocation && phase === 'located') {
      const newH = rankHospitals(localHospitals, emergencyLocation, type, trafficConditions, emergencyMode);
      setRankedHospitals(newH.slice(0, 3));
      setSelectedHospital(newH[0]);

      // Re-rank ambulances when emergency category changes (Requirement 7)
      const newA = rankAmbulances(ambulances, emergencyLocation, trafficConditions, emergencyMode, type);
      setAmbulances(newA);
      const bestAvail = newA.find(a => a.status === 'available') || newA[0];
      setSelectedAmbulance(bestAvail);

      addAlert(`🔄 Emergency type changed to ${type} — units & hospitals re-ranked`, 'info');
    }
  }, [emergencyLocation, phase, trafficConditions, emergencyMode, localHospitals, ambulances, rankHospitals, rankAmbulances, addAlert]);

  // ── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => () => {
    if (animRef.current)         clearInterval(animRef.current);
    if (rerouteTimerRef.current) clearInterval(rerouteTimerRef.current);
    if (trafficTimerRef.current) clearInterval(trafficTimerRef.current);
  }, []);

  // ── Mobile sidebar toggle ─────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── SOS overlay state ─────────────────────────────────────────────
  const [sosVisible, setSosVisible]       = useState(false);
  const sosPendingRef                     = useRef(null); // stores the pending dispatch args

  const handleBackToDispatch = useCallback(() => {
    if (!loggedInRoles?.dispatch && !loggedInRoles?.dispatcher) {
      setLoginModalRole('dispatcher');
    } else {
      setCurrentView('dispatch');
    }
  }, [loggedInRoles]);

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-body bg-gray-50 dark:bg-brand-bg text-gray-900 dark:text-brand-text transition-colors duration-300">
      <SOSOverlay
        visible={sosVisible}
        onCancel={handleSOSCancel}
        onConfirm={handleSOSConfirm}
      />
      <Header
        phase={phase}
        currentTime={currentTime}
        currentView={currentView}
        darkMode={darkMode}
        onDarkModeToggle={toggleTheme}
        loggedInRoles={loggedInRoles}
        onLogout={(role) => {
          setLoggedInRoles(prev => {
            const n = { ...prev };
            delete n[role];
            if (role === 'dispatch') delete n.dispatcher;
            if (role === 'dispatcher') delete n.dispatch;
            try {
              localStorage.setItem('lifeline_logged_in_roles', JSON.stringify(n));
            } catch (_) {}
            return n;
          });
          // If currently on that portal, go back to citizen
          if (currentView === role || (role === 'dispatch' && currentView === 'dispatch') || (role === 'ambulance' && currentView === 'ambulance')) {
            setCurrentView('citizen');
          }
        }}
        onNavigate={(target) => {
          if (target.startsWith('login:')) {
            const role = target.slice(6);
            setLoginModalRole(role === 'dispatch' ? 'dispatcher' : role);
            return;
          }
          if (target === 'dispatch' && !loggedInRoles?.dispatch && !loggedInRoles?.dispatcher) {
            setLoginModalRole('dispatcher');
            return;
          }
          if (target === 'ambulance' && !loggedInRoles?.ambulance) {
            setLoginModalRole('ambulance');
            return;
          }
          setCurrentView(target);
        }}
      />
      {/* Role Login Modal */}
      {loginModalRole && (
        <RoleLoginModal
          role={loginModalRole}
          onSuccess={(userData) => {
            const roleKey = (loginModalRole === 'dispatcher' || loginModalRole === 'dispatch') ? 'dispatch' : loginModalRole;
            setLoggedInRoles(prev => {
              const updated = {
                ...prev,
                [roleKey]: userData,
                ...(roleKey === 'dispatch' ? { dispatcher: userData } : {})
              };
              try {
                localStorage.setItem('lifeline_logged_in_roles', JSON.stringify(updated));
              } catch (_) {}
              return updated;
            });
            setCurrentView(roleKey);
            setLoginModalRole(null);
          }}
          onClose={() => setLoginModalRole(null)}
        />
      )}

      {currentView === 'hospital' ? (
        <HospitalDashboard onBackToDispatch={handleBackToDispatch} />
      ) : currentView === 'ambulance' && !loggedInRoles?.ambulance ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md text-white">
          <div className="max-w-md w-full bg-[#10243A] border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emergency/10 border border-emergency/30 text-emergency mx-auto flex items-center justify-center shadow-lg shadow-emergency/10">
              <Ambulance className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emergency/10 text-emergency border border-emergency/20">
                Restricted Field Terminal
              </span>
              <h3 className="text-xl font-black text-slate-100">
                Ambulance MDT Sign In Required
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                In-cab telemetry, CAD dispatch directives, and patient transit routing require verified ambulance crew credentials.
              </p>
            </div>
            <div className="pt-2 space-y-2.5">
              <button
                onClick={() => setLoginModalRole('ambulance')}
                className="w-full py-3 px-4 rounded-xl bg-emergency hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emergency/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Verify Credentials & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('citizen')}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Citizen Portal</span>
              </button>
            </div>
          </div>
        </div>
      ) : currentView === 'ambulance' ? (
        <AmbulanceCockpit
          assignedAmbulance={selectedAmbulance}
          emergencyLocation={emergencyLocation}
          emergencyType={emergencyType}
          selectedHospital={selectedHospital}
          activeMission={activeMission}
          route={route.length ? route : (optimalRoute.length ? optimalRoute : shortestRoute)}
          routeProgress={routeProgress}
          eta={eta}
          distance={distance}
          phase={phase}
          emergencyMode={emergencyMode}
          onEmergencyModeToggle={handleEmergencyModeToggle}
          onBackToDispatch={handleBackToDispatch}
          ambulancePosition={ambulancePosition}
          ambulances={ambulances}
          hospitals={localHospitals}
          rankedHospitals={rankedHospitals}
          shortestRoute={shortestRoute}
          optimalRoute={optimalRoute}
          alternativeRoute={alternativeRoute}
          trafficSegments={trafficSegments}
          pickupIndex={pickupIndex}
          onMapClick={handleMapClick}
        />
      ) : currentView === 'citizen' ? (
        <CitizenDashboard
          onBackToDispatch={handleBackToDispatch}
          assignedAmbulance={selectedAmbulance}
          emergencyLocation={emergencyLocation}
          emergencyType={emergencyType}
          selectedHospital={selectedHospital}
          activeMission={activeMission}
          route={route.length ? route : (optimalRoute.length ? optimalRoute : shortestRoute)}
          routeProgress={routeProgress}
          eta={eta}
          distance={distance}
          phase={phase}
          emergencyMode={emergencyMode}
          ambulancePosition={ambulancePosition}
          ambulances={ambulances}
          hospitals={localHospitals}
          rankedHospitals={rankedHospitals}
          shortestRoute={shortestRoute}
          optimalRoute={optimalRoute}
          alternativeRoute={alternativeRoute}
          trafficSegments={trafficSegments}
          pickupIndex={pickupIndex}
        />
      ) : currentView === 'dispatch' && !loggedInRoles?.dispatch && !loggedInRoles?.dispatcher ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md text-white">
          <div className="max-w-md w-full bg-[#10243A] border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/30 text-primary-400 mx-auto flex items-center justify-center shadow-lg shadow-primary-500/10">
              <Radio className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                Operations Command
              </span>
              <h3 className="text-xl font-black text-slate-100">
                Dispatcher Console Sign In Required
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Central fleet management, real-time green corridor control, and 911 intake routing are restricted to authorized dispatchers.
              </p>
            </div>
            <div className="pt-2 space-y-2.5">
              <button
                onClick={() => setLoginModalRole('dispatcher')}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Verify Credentials & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('citizen')}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Citizen Portal</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Real-time Citizen Emergency Notification Banner */}
          {newCitizenAlert && currentView === 'dispatch' && (
            <div className="bg-red-700 dark:bg-red-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-sm z-30 shrink-0 border-b border-red-900">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertOctagon size={16} className="text-white shrink-0" />
                <span className="truncate">
                  <strong className="tracking-wide uppercase text-[11px] bg-red-900/60 px-1.5 py-0.5 rounded mr-1.5 font-bold">Priority CAD Alert</strong>
                  {newCitizenAlert.locationName} ({newCitizenAlert.type}) reported by {newCitizenAlert.citizenName || 'Citizen'}
                </span>
                {newCitizenAlert.isLiveGps && (
                  <span className="text-[10px] bg-white/15 border border-white/20 px-2 py-0.5 rounded font-mono shrink-0 flex items-center gap-1">
                    <Radio size={10} />
                    <span>Live GPS</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    handleQuickDispatch(newCitizenAlert);
                    setNewCitizenAlert(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-red-800 hover:bg-slate-100 text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Ambulance size={14} />
                  <span>Assign & Route Unit</span>
                </button>
                <button
                  onClick={() => setNewCitizenAlert(null)}
                  className="px-2 py-1 text-white/70 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Mobile Tab Switcher for Dispatcher Workspace (< lg screens) */}
          <div className="lg:hidden flex items-center justify-around bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 py-1.5 shrink-0 z-30">
            <button
              onClick={() => setDispatcherMobileTab('queue')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dispatcherMobileTab === 'queue'
                  ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-slate-100 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Incident Queue ({cityEmergencies.length})
            </button>
            <button
              onClick={() => setDispatcherMobileTab('map')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dispatcherMobileTab === 'map'
                  ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-slate-100 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => setDispatcherMobileTab('dispatch')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dispatcherMobileTab === 'dispatch'
                  ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-slate-100 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Dispatch Details {selectedAmbulance ? `(${selectedAmbulance.name})` : ''}
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden min-h-0 relative">
            {/* ── 1. Left Column: Incident Queue & Rapid Intake ──────────────── */}
            <div className={`
              w-full lg:w-72 xl:w-80 shrink-0 flex flex-col overflow-hidden
              bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800
              ${dispatcherMobileTab === 'queue' ? 'flex' : 'hidden lg:flex'}
            `}>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-3">
                <CityEmergenciesPanel
                  cityEmergencies={cityEmergencies}
                  activeEmergencyId={activeEmergencyId}
                  onSelectEmergency={(emg) => {
                    handleSelectCityEmergency(emg);
                    // On mobile, auto-switch to map view when incident is selected
                    if (window.innerWidth < 1024) setDispatcherMobileTab('map');
                  }}
                  onQuickDispatch={(emg) => {
                    handleQuickDispatch(emg);
                    if (window.innerWidth < 1024) setDispatcherMobileTab('map');
                  }}
                  phase={phase}
                />
                <EmergencyInput
                  emergencyType={emergencyType}
                  onChange={handleEmergencyTypeChange}
                  phase={phase}
                  emergencyLocation={emergencyLocation}
                />
              </div>
            </div>

            {/* ── 2. Central Workspace: Operational Live Map ─────────────────── */}
            <div className={`
              flex-1 relative overflow-hidden
              ${dispatcherMobileTab === 'map' ? 'flex' : 'hidden lg:flex'}
            `}>
              <MapView
                emergencyLocation={emergencyLocation}
                ambulances={ambulances}
                selectedAmbulance={selectedAmbulance}
                hospitals={localHospitals}
                rankedHospitals={rankedHospitals}
                selectedHospital={selectedHospital}
                shortestRoute={shortestRoute}
                optimalRoute={optimalRoute}
                alternativeRoute={alternativeRoute}
                route={route}
                alternateRoutes={alternateRoutes}
                ambulancePosition={ambulancePosition}
                trafficSegments={trafficEnabled ? trafficSegments : []}
                trafficEnabled={trafficEnabled}
                phase={phase}
                onMapClick={handleMapClick}
                onSelectAmbulance={setSelectedAmbulance}
                onSelectHospital={handleHospitalChange}
                onSelectAlternate={handleSelectAlternate}
                pickupIndex={pickupIndex}
                activeRouteType={activeRouteType}
                routeMode={routeMode}
              />

              <Dashboard
                phase={phase}
                selectedAmbulance={selectedAmbulance}
                selectedHospital={selectedHospital}
                eta={eta}
                distance={distance}
                routeProgress={routeProgress}
                trafficConditions={trafficConditions}
                emergencyMode={emergencyMode}
                rerouteCount={rerouteCount}
                onOpenCitizenDashboard={() => setCurrentView('citizen')}
              />

              <div className="absolute top-4 right-2 z-[1000] w-64 md:w-72">
                <AlertSystem alerts={alerts} onRemove={removeAlert} />
              </div>

              {/* Mobile dispatch floating button */}
              {phase === 'located' && selectedAmbulance && selectedHospital && (
                <button
                  onClick={handleDispatch}
                  className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-[900] px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center gap-2"
                >
                  <span>Authorize Dispatch: {selectedAmbulance.name}</span>
                </button>
              )}
            </div>

            {/* ── 3. Right Column: Contextual Dispatch & Unit Assignment ──────── */}
            <div className={`
              w-full lg:w-80 xl:w-88 shrink-0 flex flex-col overflow-hidden
              bg-white dark:bg-slate-900/90 border-l border-slate-200 dark:border-slate-800
              ${dispatcherMobileTab === 'dispatch' ? 'flex' : 'hidden lg:flex'}
            `}>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-3">
                <AmbulancePanel
                  ambulances={ambulances}
                  selectedAmbulance={selectedAmbulance}
                  onSelect={setSelectedAmbulance}
                  trafficConditions={trafficConditions}
                  phase={phase}
                  selectedHospital={selectedHospital}
                />
                <HospitalPanel
                  rankedHospitals={rankedHospitals}
                  selectedHospital={selectedHospital}
                  onSelect={handleHospitalChange}
                  phase={phase}
                  loading={hospitalLoading}
                  emergencyType={emergencyType}
                />
                <RouteSelector
                  routeMode={routeMode}
                  onChange={setRouteMode}
                  phase={phase}
                  selectedHospital={selectedHospital}
                  trafficConditions={trafficConditions}
                  routeMetrics={routeMetrics}
                />
                <DispatchTimeline
                  steps={dispatchTimeline}
                  phase={phase}
                />
              </div>
            </div>
          </div>

          {/* Operational Control Bar */}
          <ControlPanel
            trafficEnabled={trafficEnabled}
            onTrafficToggle={setTrafficEnabled}
            onDispatch={handleDispatch}
            onReset={handleReset}
            phase={phase}
            selectedAmbulance={selectedAmbulance}
            selectedHospital={selectedHospital}
          />
        </>
      )}
    </div>
  );
}

