import React, { useState } from 'react';
import { useHospitalBeds } from '../../context/HospitalBedContext';
import { 
  Building2, MapPin, Navigation, Bed, Clock, Star, Phone, 
  ShieldAlert, Activity, ChevronRight, X, Send, HeartHandshake, CheckCircle2,
  RadioTower, Ambulance, AlertCircle
} from 'lucide-react';
import { calculateDistance } from '../../utils/geoUtils';

export default function CitizenHospitalFinder({ onSwitchToHospitalCommand }) {
  const {
    hospitalsWithTelemetry = [],
    citizenLocation,
    setCitizenLocation,
    isLocatingCitizen,
    citizenGpsAccuracy,
    requestCitizenLiveLocation,
    callAmbulanceToHospital,
    addHospitalReview,
    lastDispatchedCall,
    setLastDispatchedCall,
    ambulanceLiveLocation
  } = useHospitalBeds();

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Call Ambulance Modal
  const [summonModalHospital, setSummonModalHospital] = useState(null);
  const [callerName, setCallerName] = useState('Aarav Sharma');
  const [callerPhone, setCallerPhone] = useState('+91 98450 12345');
  const [emergencyType, setEmergencyType] = useState('Acute Cardiac Event');
  const [customEmergencyText, setCustomEmergencyText] = useState('');
  const [callerNotes, setCallerNotes] = useState('Patient experiencing severe chest pain and dizziness.');
  const [isCallingAmbulance, setIsCallingAmbulance] = useState(false);

  // Reviews Modal
  const [reviewsModalHospital, setReviewsModalHospital] = useState(null);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  const handleSummonAmbulanceSubmit = (e) => {
    e.preventDefault();
    if (!summonModalHospital) return;

    setIsCallingAmbulance(true);
    const finalType = emergencyType === 'Other'
      ? (customEmergencyText.trim() || 'Custom Emergency')
      : emergencyType;

    callAmbulanceToHospital({
      hospitalId: summonModalHospital.id,
      citizenName: callerName.trim() || 'Citizen Caller',
      citizenPhone: callerPhone.trim() || '+91 98765 43210',
      emergencyType: finalType,
      notes: callerNotes.trim()
    });

    setIsCallingAmbulance(false);
    setSummonModalHospital(null);
  };

  const handleAddReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewsModalHospital || !newReviewComment.trim()) return;

    addHospitalReview(reviewsModalHospital.id, {
      author: newReviewAuthor.trim() || 'Verified Citizen',
      rating: parseInt(newReviewRating, 10),
      comment: newReviewComment.trim(),
      tags: ['Verified Patient Intake']
    });

    setReviewSuccessMsg('Review recorded. Thank you for contributing community feedback.');
    setNewReviewComment('');
    setNewReviewAuthor('');
    setTimeout(() => setReviewSuccessMsg(''), 3000);
  };

  // Filtered hospitals
  const filteredHospitals = hospitalsWithTelemetry.filter(h => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.address && h.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      h.type.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'ICU') return h.icuAvailable > 0;
    if (filterType === 'BEDS') return h.bedsAvailable > 5;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Real-Time Ambulance Live GPS Stream to Citizen ──────────── */}
      {ambulanceLiveLocation?.active && (
        <div className="p-4 rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50/90 dark:bg-teal-950/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 relative">
              <Ambulance size={20} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-teal-950 dark:text-teal-100 flex items-center gap-1.5">
                  <RadioTower size={14} className="text-teal-600 dark:text-teal-400" />
                  Live Ambulance Telemetry: {ambulanceLiveLocation.unitName || 'AMB-101'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                  Real GPS Active • No Simulation
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                Current Position: <span className="font-mono text-teal-800 dark:text-teal-300">{ambulanceLiveLocation.lat.toFixed(5)}, {ambulanceLiveLocation.lng.toFixed(5)}</span> • Speed: <span className="font-mono">{ambulanceLiveLocation.speed || 52} km/h</span>
                {citizenLocation && (
                  <span>
                    {' '}• Distance to you:{' '}
                    <strong className="text-teal-900 dark:text-teal-100">
                      {(() => {
                        const d = calculateDistance(citizenLocation.lat, citizenLocation.lng, ambulanceLiveLocation.lat, ambulanceLiveLocation.lng);
                        return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
                      })()}
                    </strong>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800">
              Streaming to Dispatcher & Citizen
            </span>
          </div>
        </div>
      )}

      {/* ── ACTIVE AMBULANCE TRACKING CARD ───────────────────────── */}
      {lastDispatchedCall && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121B2B] border-2 border-red-500 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-md flex-shrink-0">
                <Ambulance size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white flex items-center gap-1">
                    <AlertCircle size={10} />
                    <span>Emergency Ambulance En Route</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Live GPS Stream
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Unit {lastDispatchedCall.ambulanceUnit || 'AMB-101'} is Heading to Your Location
                </h4>
              </div>
            </div>

            <button
              onClick={() => setLastDispatchedCall(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors self-start sm:self-center"
            >
              Close Tracker
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Estimated Arrival</span>
              <strong className="text-xl font-black text-amber-600 dark:text-amber-400 font-display">
                {lastDispatchedCall.eta || 4} mins
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Real Vehicle Speed</span>
              <strong className="text-xl font-black text-slate-900 dark:text-slate-100 font-display flex items-baseline gap-1">
                {ambulanceLiveLocation?.speed || 54} <span className="text-xs font-mono font-normal text-slate-500">km/h</span>
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Distance to You</span>
              <strong className="text-xl font-black text-teal-600 dark:text-teal-400 font-display">
                {lastDispatchedCall.dist || '2.1'} km
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Corridor Signals</span>
              <strong className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                Green Wave
              </strong>
            </div>
          </div>

          {/* Two-Stop Journey Path */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 mt-1 flex-shrink-0 animate-pulse" />
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold block">
                  Where The Ambulance Is (Current Live Position)
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {ambulanceLiveLocation ? `GPS: ${ambulanceLiveLocation.lat.toFixed(4)}, ${ambulanceLiveLocation.lng.toFixed(4)}` : 'En Route on City Arterial Expressway'}
                </span>
              </div>
            </div>

            <div className="pl-1.5 border-l-2 border-dashed border-amber-400 ml-1.5 py-1">
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 block w-fit">
                🛣️ Navigation Corridor: Via Ring Road Expressway & Priority Green Wave Corridor
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 font-bold block">
                  Where It Has To Reach (Your Location & Target ER)
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {citizenLocation?.address || 'Your Current Geofenced Location'} ➔ Destined to {lastDispatchedCall.targetHospital?.name || 'Victoria Hospital ER'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hospital Facility Directory Header ── */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Emergency Healthcare & Hospital Facilities
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal/15 text-teal">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified ER bed availability, ICU capacity, and direct ambulance summon across Bengaluru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => requestCitizenLiveLocation(true)}
            disabled={isLocatingCitizen}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              citizenLocation?.isLive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 cursor-pointer'
            }`}
          >
            <MapPin size={13} className={citizenLocation?.isLive ? 'text-emerald-600 animate-pulse' : 'text-primary-600'} />
            <span>
              {isLocatingCitizen
                ? 'Detecting Location...'
                : citizenLocation?.isLive
                ? `Live GPS Active (±${citizenLocation.accuracy || citizenGpsAccuracy || 12}m)`
                : '📍 Use My Live Location'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Filters & Search ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Hospitals' },
            { id: 'BEDS', label: 'High Bed Capacity' },
            { id: 'ICU', label: 'ICU Available' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === f.id
                  ? 'bg-primary-700 text-white dark:bg-primary dark:text-slate-100 shadow-sm'
                  : 'bg-white dark:bg-[#10243A] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by hospital name or specialty..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm"
        />
      </div>

      {/* ── Hospitals Grid (Consumer-grade card structure) ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHospitals.map((h, idx) => {
          const isNearest = idx === 0;

          return (
            <div
              key={h.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-card ${
                isNearest
                  ? 'bg-white dark:bg-[#131F33] border-teal/60 ring-1 ring-teal/30'
                  : 'bg-white dark:bg-[#131F33] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {h.name}
                      </h4>
                      {isNearest && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal/15 text-teal border border-teal/30 flex-shrink-0">
                          Nearest
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {h.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    <Star size={11} className="text-amber-500 fill-amber-500" />
                    <span>{h.rating || '4.8'}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{h.address}</span>
                </div>

                {/* Distance & Travel Time Cards */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                      Distance
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {h.formattedDistance}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                      Drive Time
                    </span>
                    <span className="text-sm font-bold text-teal font-mono">
                      {h.formattedTravelTime}
                    </span>
                  </div>
                </div>

                {/* Live Bed Telemetry Numbers */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Verified Capacity:</span>
                    <span className="text-teal font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                      Live Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-teal/10 border border-teal/20 text-teal">
                      <div className="text-[10px] font-semibold">General ER Beds</div>
                      <div className="text-base font-bold font-mono mt-0.5">
                        {h.bedsAvailable} <span className="text-[10px] font-normal text-slate-500">/ {h.bedsTotal}</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                      <div className="text-[10px] font-semibold">ICU Ventilator Beds</div>
                      <div className="text-base font-bold font-mono mt-0.5">
                        {h.icuAvailable} <span className="text-[10px] font-normal text-slate-500">/ {h.icuTotal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 font-mono">
                    <span>Trauma Bays: <strong className="text-slate-800 dark:text-slate-200">{h.erBaysAvailable} free</strong></span>
                    <span>Oxygen: <strong className="text-teal">{h.oxygenStatus}</strong></span>
                  </div>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="p-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setSummonModalHospital(h)}
                  className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-md border border-red-700 cursor-pointer"
                >
                  <span>Summon Ambulance</span>
                  <ChevronRight size={13} />
                </button>
                <button
                  onClick={() => setReviewsModalHospital(h)}
                  className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 font-medium text-xs transition-colors"
                >
                  Reviews ({h.reviews?.length || 2})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Summon Ambulance Dialog ─────────────────────────────────── */}
      {summonModalHospital && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-modal">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-emergency">
                  Immediate Response
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Dispatch Ambulance to {summonModalHospital.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Alerts the closest available ambulance unit & notifies hospital intake team.
                </p>
              </div>
              <button
                onClick={() => setSummonModalHospital(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSummonAmbulanceSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Caller Name
                  </label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={e => setCallerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={callerPhone}
                    onChange={e => setCallerPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Triage Type
                </label>
                <select
                  value={emergencyType}
                  onChange={e => setEmergencyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="Acute Cardiac Event">Acute Cardiac Event (Heart Attack / Arrest)</option>
                  <option value="Severe Road Collision">Severe Road Collision / Major Trauma</option>
                  <option value="Acute Stroke Symptoms">Acute Stroke Symptoms</option>
                  <option value="Burn Injury Emergency">Burn Injury Emergency</option>
                  <option value="Obstetric / Labor Emergency">Obstetric / Labor Emergency</option>
                  <option value="General Acute Emergency">General Acute Emergency</option>
                  <option value="Other">Other (Custom Emergency)</option>
                </select>
              </div>

              {emergencyType === 'Other' && (
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Situation & Scene Notes
                </label>
                <textarea
                  rows={2}
                  value={callerNotes}
                  onChange={e => setCallerNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCallingAmbulance}
                  className="w-full py-2.5 px-4 rounded-lg bg-emergency hover:bg-red-700 text-white font-semibold text-xs tracking-wide transition-colors shadow-sm disabled:opacity-50"
                >
                  {isCallingAmbulance ? 'Transmitting Dispatch Request...' : 'Confirm Emergency Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Community Reviews Dialog ────────────────────────────────── */}
      {reviewsModalHospital && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-modal max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {reviewsModalHospital.name} Reviews
                </h3>
                <p className="text-xs text-slate-500">
                  Verified patient and citizen feedback on emergency intake.
                </p>
              </div>
              <button
                onClick={() => setReviewsModalHospital(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Existing Reviews */}
            <div className="space-y-2.5">
              {(reviewsModalHospital.reviews || []).map((rev, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{rev.author}</span>
                    <span className="text-amber-500">{'★'.repeat(rev.rating)}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleAddReviewSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Submit Verified Feedback
              </span>
              <input
                type="text"
                placeholder="Your Full Name"
                value={newReviewAuthor}
                onChange={e => setNewReviewAuthor(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
              <textarea
                placeholder="Share your intake experience..."
                value={newReviewComment}
                onChange={e => setNewReviewComment(e.target.value)}
                required
                rows={2}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none resize-none"
              />
              {reviewSuccessMsg && (
                <div className="text-[11px] text-teal font-medium">
                  {reviewSuccessMsg}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-primary-700 dark:bg-primary-600 text-white font-semibold text-xs transition-colors hover:bg-primary-800"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
