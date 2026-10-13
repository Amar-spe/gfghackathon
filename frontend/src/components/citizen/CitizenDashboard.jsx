import React, { useState, useEffect } from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import { useHospitalBeds } from '../../context/HospitalBedContext';
import MyImpactPanel from './MyImpactPanel';
import CommunityLeaderboard from './CommunityLeaderboard';
import CitizenAuthGate from './CitizenAuthGate';
import CitizenHospitalFinder from './CitizenHospitalFinder';
import MapView from '../MapView';
import { formatETA } from '../../utils/aiEngine';
import { 
  Building2, Activity, Award, Users, ShieldAlert, Plus, 
  MapPin, CheckCircle2, AlertCircle, AlertOctagon, X, ArrowRight, ShieldCheck, HeartPulse,
  Navigation, Loader2, Ambulance, Phone, Star, Gauge, Clock, Milestone,
  Compass, RadioTower, Zap, Radio, CircleDot
} from 'lucide-react';

export default function CitizenDashboard({
  onBackToDispatch,
  assignedAmbulance,
  emergencyLocation,
  emergencyType,
  selectedHospital,
  activeMission,
  route = [],
  routeProgress = 0,
  eta,
  distance,
  phase = 'idle',
  emergencyMode = false,
  ambulancePosition,
  ambulances = [],
  hospitals = [],
  rankedHospitals = [],
  shortestRoute = [],
  optimalRoute = [],
  alternativeRoute = [],
  trafficSegments = [],
  pickupIndex = 0
}) {
  const {
    currentUser,
    isLoggedIn,
    logoutCitizen,
    config,
    pendingVerifications = [],
    lastNotification,
    clearNotification,
    submitCitizenReport,
    resetToBaseline,
  } = useCitizenRescue();

  const {
    citizenLocation,
    requestCitizenLiveLocation,
    isLocatingCitizen,
    citizenGpsAccuracy,
    ambulanceLiveLocation
  } = useHospitalBeds();

  // Active mission synchronization
  const [persistedMission, setPersistedMission] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeline_active_mission');
      return saved ? JSON.parse(saved) : null;
    } catch (_) { return null; }
  });

  const effectiveMission = activeMission || persistedMission;
  const isAssigned = (phase === 'located' || phase === 'enroute' || phase === 'arrived') ||
    !!effectiveMission ||
    pendingVerifications.some(p => (p.ambulanceAssigned && p.ambulanceAssigned.includes('AMB')));

  const effectiveAmbulance = assignedAmbulance || effectiveMission?.assignedAmbulance || (ambulances.length ? ambulances[0] : { name: 'AMB-101', driver: 'Rajesh Kumar', paramedic: 'Sneha Menon' });

  const effectiveCitizenLocation = emergencyLocation || effectiveMission?.patientLocation || (
    citizenLocation?.lat ? citizenLocation : { lat: 12.9352, lng: 77.6245, address: 'Koramangala 5th Block' }
  );

  const effectiveHospital = selectedHospital || effectiveMission?.destinationHospital || (hospitals.length ? hospitals[0] : { name: 'Victoria Hospital ER Complex' });

  const [activeTab, setActiveTab] = useState(isAssigned ? 'tracking' : 'hospitalBeds');
  const [showReportModal, setShowReportModal] = useState(false);

  // Speedometer fluctuation for realism when ambulance is in motion
  const [speed, setSpeed] = useState(54);
  useEffect(() => {
    if (phase !== 'enroute') return;
    const interval = setInterval(() => {
      setSpeed(Math.floor(50 + Math.random() * 15));
    }, 1400);
    return () => clearInterval(interval);
  }, [phase]);

  const liveSpeed = ambulanceLiveLocation?.speed > 0
    ? ambulanceLiveLocation.speed
    : (phase === 'enroute' ? speed : (phase === 'arrived' ? 0 : 48));

  // Auto-switch to tracking tab when central dispatch assigns ambulance
  useEffect(() => {
    const handleDispatched = (e) => {
      if (e.detail?.mission) {
        setPersistedMission(e.detail.mission);
        setActiveTab('tracking');
      }
    };
    window.addEventListener('lifeline:ambulance-dispatched', handleDispatched);
    return () => window.removeEventListener('lifeline:ambulance-dispatched', handleDispatched);
  }, []);

  // Form State for new report
  const [reportActionKey, setReportActionKey] = useState('VALID_INCIDENT_REPORT');
  const [reportEmergencyType, setReportEmergencyType] = useState('Road Collision');
  const [customEmergencyText, setCustomEmergencyText] = useState('');
  const [reportLocation, setReportLocation] = useState('Koramangala Sony World Signal');
  const [reportCoordinates, setReportCoordinates] = useState(null);
  const [isDetectingReportLocation, setIsDetectingReportLocation] = useState(false);
  const [reportDetails, setReportDetails] = useState('');
  const [reportHospital, setReportHospital] = useState('Victoria Hospital ER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When modal opens, sync with citizen's live GPS if available
  const handleOpenReportModal = () => {
    if (citizenLocation?.lat && citizenLocation?.isLive) {
      setReportCoordinates({
        lat: citizenLocation.lat,
        lng: citizenLocation.lng,
        accuracy: citizenLocation.accuracy || 15,
        isLive: true
      });
      setReportLocation(citizenLocation.address || `Live Location (${citizenLocation.lat.toFixed(4)}, ${citizenLocation.lng.toFixed(4)})`);
    }
    setShowReportModal(true);
  };

  // Explicit button to detect and use device GPS for the report
  const handleUseCurrentLocationForReport = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingReportLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setReportCoordinates({ lat, lng, accuracy: acc, isLive: true });
        setReportLocation(`Live GPS Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        setIsDetectingReportLocation(false);
      },
      (err) => {
        setIsDetectingReportLocation(false);
        if (citizenLocation?.lat) {
          setReportCoordinates({
            lat: citizenLocation.lat,
            lng: citizenLocation.lng,
            accuracy: citizenLocation.accuracy || 20,
            isLive: true
          });
          setReportLocation(citizenLocation.address || `Live GPS (${citizenLocation.lat.toFixed(4)}, ${citizenLocation.lng.toFixed(4)})`);
        } else {
          alert(`Location access notice: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      alert('Please sign in or select a citizen profile to submit verified community reports.');
      return;
    }

    const finalEmergencyType = reportEmergencyType === 'Other'
      ? (customEmergencyText.trim() || 'Custom Emergency')
      : reportEmergencyType;

    setIsSubmitting(true);
    await submitCitizenReport({
      actionKey: reportActionKey,
      emergencyType: finalEmergencyType,
      location: reportLocation,
      details: reportDetails,
      receivingHospital: reportHospital,
      lat: reportCoordinates?.lat,
      lng: reportCoordinates?.lng,
      isLiveGps: !!reportCoordinates
    });
    setIsSubmitting(false);
    setShowReportModal(false);
    setReportDetails('');
    setCustomEmergencyText('');
    setReportCoordinates(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* ── Notification Banner (if any) ────────────────────────────── */}
      {lastNotification && (
        <div className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between border-b transition-all ${
          lastNotification.type === 'success'
            ? 'bg-teal/10 text-teal border-teal/20'
            : lastNotification.type === 'danger'
            ? 'bg-red-50 text-emergency dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/40'
            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{lastNotification.message}</span>
          </div>
          <button onClick={clearNotification} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Sub-Header: Identity & Quick Actions ─────────────────────── */}
      <div className="shrink-0 px-4 md:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emergency flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <HeartPulse size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Citizen Healthcare & Emergency Access
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                v{config?.version || '2.0'}
              </span>
            </div>

            {isLoggedIn && currentUser ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.fullName}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-teal">{currentUser.citizenId}</span>
                <span>•</span>
                <span>{currentUser.communityZone}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 mt-0.5">
                Public citizen directory & instant emergency ambulance summon.
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isLoggedIn && currentUser ? (
            <button
              onClick={logoutCitizen}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emergency border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('impact')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              Citizen Sign-In
            </button>
          )}

          <button
            onClick={handleOpenReportModal}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-all flex items-center gap-1.5 shadow-md border border-red-700 cursor-pointer"
          >
            <Plus size={15} className="text-white" strokeWidth={2.5} />
            <span className="text-white font-bold">Report Emergency Incident</span>
          </button>
        </div>
      </div>

      {/* ── Mandatory Ethical Safeguard Directive Banner ────────────── */}
      <div className="shrink-0 px-4 md:px-8 py-2 bg-slate-100 dark:bg-[#131F33] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
        <ShieldCheck size={15} className="text-teal flex-shrink-0" />
        <span className="text-[11px] leading-tight">
          <strong>Clinical & Safety Protocol: </strong>
          Emergency triage tiers and ambulance dispatch priorities are strictly governed by medical urgency. Points and badges reflect verified civic reporting and do not influence emergency priority.
        </span>
      </div>

      {/* ── Active Ambulance Assigned Banner (Sticky when on other tabs) ── */}
      {isAssigned && activeTab !== 'tracking' && (
        <div className="shrink-0 mx-4 md:mx-8 mt-3 p-3 rounded-xl bg-red-700 dark:bg-red-800 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm border border-red-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-red-800 flex items-center justify-center font-bold shrink-0">
              <Ambulance size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/15 border border-white/20 text-white tracking-wider flex items-center gap-1 w-fit">
                <AlertOctagon size={10} />
                <span>Emergency Unit Dispatched</span>
              </span>
              <div className="font-bold text-xs sm:text-sm text-white mt-0.5">
                Unit {effectiveAmbulance?.name || 'AMB-101'} is en route to your emergency scene
              </div>
              <div className="text-[11px] font-mono text-white/90 font-medium flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1"><Clock size={10} /> ETA: <strong>{eta !== null ? formatETA(eta) : '3.5 mins'}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin size={10} /> Distance: <strong>{distance ? parseFloat(distance).toFixed(1) : '1.8'} km</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1"><Zap size={10} /> Speed: <strong>{liveSpeed} km/h</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('tracking')}
            className="px-4 py-2 rounded-xl bg-white text-red-600 hover:bg-slate-100 font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🗺️ Track Live on Map</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── Tab Navigation ──────────────────────────────────────────── */}
      <div className="shrink-0 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1">
          {[
            ...(isAssigned ? [{
              id: 'tracking',
              label: '⚡ Live Ambulance Tracking',
              icon: Ambulance,
              badge: 'LIVE RESCUE'
            }] : []),
            { id: 'hospitalBeds', label: 'Nearby Hospitals & Summon', icon: Building2 },
            { id: 'impact',       label: 'My Impact & Reports',       icon: Activity, lock: !isLoggedIn },
            { id: 'community',    label: 'Community Leaderboard',     icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'border-primary-700 text-primary-900 dark:border-teal dark:text-teal font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                    tab.id === 'tracking'
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.lock && <span className="text-[10px] text-slate-400">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Tab Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* ── 1. LIVE AMBULANCE TRACKING VIEW ────────────────────────── */}
          {activeTab === 'tracking' && (
            <div className="space-y-4">
              {/* Emergency Top Hero Card */}
              <div className="bg-white dark:bg-[#121B2B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Emergency Badge */}
                    <div className="w-13 h-13 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md flex-shrink-0">
                      <Ambulance className="w-7 h-7 text-white" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white flex items-center gap-1 shadow-xs">
                          <AlertOctagon size={11} />
                          <span>Live Emergency Tracker</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                          {phase === 'arrived' ? 'AMBULANCE ARRIVED ON SCENE' : 'AMBULANCE CREW EN ROUTE TO YOU'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                          <RadioTower className="w-3 h-3 text-teal-600" />
                          <span>Live Telemetry Active</span>
                        </span>
                      </div>

                      <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        Unit {effectiveAmbulance?.name || 'AMB-101'} • Emergency Rescue Approaching
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live real-time GPS location and road corridor navigation mapped to your location.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Signal Corridor</span>
                      <strong className="text-teal font-semibold flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-teal" />
                        <span>Green Wave Priority Active</span>
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ── LIVE TRACKING STATS: ETA + DISTANCE ────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {/* 1. Probable Time to Reach */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-left">
                    <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Probable Time to Reach</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-display">
                        {eta !== null ? formatETA(eta) : '3.2m'}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] font-mono text-slate-500">
                      Dynamic Countdown ETA
                    </div>
                  </div>

                  {/* 2. Distance Remaining */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-left">
                    <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Milestone className="w-3.5 h-3.5 text-teal-600" />
                      <span>Distance From You</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
                        {distance ? parseFloat(distance).toFixed(1) : '1.8'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">km</span>
                    </div>
                    <div className="mt-1 text-[10px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
                      Ola Maps Road Route
                    </div>
                  </div>
                </div>
              </div>

              {/* ── AMBULANCE CREW & SCENE GUIDANCE BAR ─────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Emergency Driver & Crew Card */}
                <div className="md:col-span-6 bg-white dark:bg-[#121B2B] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      <Ambulance className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {effectiveAmbulance?.driver || 'Rajesh Kumar'} (Emergency Driver)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          EMT CERTIFIED
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        Paramedic: {effectiveAmbulance?.paramedic || 'Sneha Menon'} • Unit: {effectiveAmbulance?.name || 'AMB-101'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Calling Ambulance Driver ${effectiveAmbulance?.driver || 'Rajesh Kumar'} (+91-98450-AMB01)...`)}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
                    title="Call Ambulance Driver"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>

                {/* Patient Scene Guidance */}
                <div className="md:col-span-6 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-200 flex flex-col justify-center">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                    <ShieldAlert size={15} />
                    <span>Instructions While Unit is Reaching:</span>
                  </div>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-1 leading-relaxed">
                    Keep your phone free for gate entry. Send someone to the main road to wave down Unit <strong>{effectiveAmbulance?.name || 'AMB-101'}</strong>. Pre-allocated destination: <strong>{effectiveHospital?.name || 'Victoria ER'}</strong>.
                  </p>
                </div>
              </div>

              {/* ── INTERACTIVE LIVE MAP (FULL WIDTH) ────────────────────── */}
              <div className="bg-white dark:bg-[#121B2B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary-600 dark:text-teal" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                      Live Road Corridor & Ambulance Position (Emergency Navigation)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Ola Maps / Leaflet Real-Time Layer
                  </span>
                </div>

                {/* Embedded Live Leaflet Map */}
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm h-96 md:h-[480px] w-full relative z-10 min-h-[380px]">
                      <MapView
                        emergencyLocation={effectiveCitizenLocation}
                        ambulances={ambulances.length ? ambulances : (effectiveAmbulance ? [effectiveAmbulance] : [])}
                        selectedAmbulance={effectiveAmbulance}
                        hospitals={hospitals}
                        rankedHospitals={rankedHospitals}
                        selectedHospital={effectiveHospital}
                        shortestRoute={shortestRoute}
                        optimalRoute={optimalRoute}
                        alternativeRoute={alternativeRoute}
                        route={route}
                        alternateRoutes={[]}
                        ambulancePosition={ambulancePosition || (
                          effectiveCitizenLocation?.lat
                            ? [effectiveCitizenLocation.lat - 0.012, effectiveCitizenLocation.lng - 0.012]
                            : [12.9716, 77.5946]
                        )}
                        trafficSegments={trafficSegments}
                        trafficEnabled={true}
                        phase={phase}
                        onMapClick={() => {}}
                        onSelectAmbulance={() => {}}
                        onSelectHospital={() => {}}
                        pickupIndex={pickupIndex}
                        routeMode="optimal"
                        autoFocus={true}
                        destinationLocation={effectiveCitizenLocation || effectiveHospital}
                      />
                    </div>

                    {/* Turn-by-Turn Waypoint Cards beneath map */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">1. Origin Point</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          Ambulance Base Station
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono">Dispatched ✓</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">2. Path Traversed</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          Emergency Corridor
                        </span>
                        <span className="text-[10px] text-amber-500 font-mono">Moving at {liveSpeed} km/h</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">3. Reaching You</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          Your Pickup Location
                        </span>
                        <span className="text-[10px] text-teal-600 font-mono">ETA {eta !== null ? formatETA(eta) : '3.2m'}</span>
                      </div>
                    </div>
                  </div>
              </div>
            )}

          {activeTab === 'hospitalBeds' && (
            <CitizenHospitalFinder />
          )}

          {activeTab === 'impact' && (
            <MyImpactPanel
              onOpenReportModal={() => setShowReportModal(true)}
              onSwitchToHospitalPortal={() => setActiveTab('hospital')}
            />
          )}

          {activeTab === 'community' && (
            <CommunityLeaderboard />
          )}
        </div>
      </div>

      {/* ── Incident Report Modal ────────────────────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-modal">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  File Community Incident Report
                </h3>
                <p className="text-xs text-slate-500">
                  Transmits scene details to Central Dispatcher & nearest hospital.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Incident Category
                </label>
                <select
                  value={reportEmergencyType}
                  onChange={e => setReportEmergencyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="Road Collision">Road Collision / Vehicle Crash</option>
                  <option value="Acute Cardiac Arrest">Acute Cardiac Arrest</option>
                  <option value="Severe Trauma / Bleeding">Severe Trauma / Bleeding</option>
                  <option value="Structural Fire / Burn">Structural Fire / Burn</option>
                  <option value="Other">Other (Custom Emergency)</option>
                </select>
              </div>

              {reportEmergencyType === 'Other' && (
                <input
                  type="text"
                  value={customEmergencyText}
                  onChange={e => setCustomEmergencyText(e.target.value)}
                  placeholder="Specify emergency nature..."
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                />
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Location / Cross Street
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocationForReport}
                    disabled={isDetectingReportLocation}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-teal dark:hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isDetectingReportLocation ? (
                      <Loader2 size={12} className="animate-spin text-primary-600" />
                    ) : (
                      <MapPin size={12} className="text-primary-600" />
                    )}
                    <span>{isDetectingReportLocation ? 'Detecting GPS...' : '📍 Use My Current Location'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={reportLocation}
                  onChange={e => setReportLocation(e.target.value)}
                  placeholder="e.g. 100ft Rd, Indiranagar or click Use My Current Location"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                />
                {reportCoordinates && (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>GPS Attached: {reportCoordinates.lat.toFixed(5)}, {reportCoordinates.lng.toFixed(5)} (±{reportCoordinates.accuracy || 10}m)</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-200">
                      Live Verified
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scene Observations & Patient Condition
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  placeholder="Describe number of patients, road blockage, consciousness level..."
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs tracking-wide transition-colors shadow-md border border-red-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Transmitting Report...' : 'Transmit Report to Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
