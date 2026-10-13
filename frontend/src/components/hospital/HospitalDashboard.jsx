import React, { useState } from 'react';
import {
  Building2,
  Ambulance,
  Stethoscope,
  Activity,
  HeartPulse,
  BedDouble,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Lock,
  Unlock,
  Radio,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  User,
  Phone,
  X,
  Compass,
  Wind,
  ShieldAlert
} from 'lucide-react';
import {
  useHospitalBeds,
  AUTHORIZED_OFFICIALS,
  CITIZEN_LOCATION_PRESETS
} from '../../context/HospitalBedContext';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import HospitalVerificationPortal from '../citizen/HospitalVerificationPortal';

export default function HospitalDashboard({ onBackToDispatch }) {
  const {
    hospitals,
    hospitalsWithTelemetry,
    activeHospital,
    selectedHospitalId,
    setSelectedHospitalId,
    // Official Auth
    currentOfficial,
    isOfficialLoggedIn,
    loginOfficial,
    logoutOfficial,
    // Actions
    updateHospitalBeds,
    quickAdmit,
    quickDischarge,
    citizenLocation,
    setCitizenLocation,
    callAmbulanceToHospital,
    addHospitalReview,
    lastDispatchedCall,
    setLastDispatchedCall,
    incomingIntakes,
    removeIncomingAmbulance,
    auditLog
  } = useHospitalBeds();

  const { pendingVerifications } = useCitizenRescue();

  // Mode tab: 'er-command' (ER Bed Telemetry) | 'triage-queue' (Hospital Triage Queue) | 'citizen-finder' (Find Hospital)
  const [dashboardMode, setDashboardMode] = useState('er-command');

  // Official Login Modal
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [selectedOfficialId, setSelectedOfficialId] = useState(AUTHORIZED_OFFICIALS[0].id);
  const [officialPin, setOfficialPin] = useState('1234');
  const [authError, setAuthError] = useState('');

  // Call Ambulance Modal
  const [summonModalHospital, setSummonModalHospital] = useState(null);
  const [callerName, setCallerName] = useState('Aarav Sharma');
  const [callerPhone, setCallerPhone] = useState('+91-98450-12345');
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

  // Bed Edit Mode (strictly for logged in official)
  const [editMode, setEditMode] = useState(false);
  const [tempBeds, setTempBeds] = useState(activeHospital.bedsAvailable);
  const [tempICU, setTempICU] = useState(activeHospital.icuAvailable);
  const [saveToast, setSaveToast] = useState('');

  // Handle Hospital Switch in ER mode
  const handleSelectHospital = (id) => {
    setSelectedHospitalId(id);
    const target = hospitals.find(h => h.id === id);
    if (target) {
      setTempBeds(target.bedsAvailable);
      setTempICU(target.icuAvailable);
    }
  };

  // Official Login Submit
  const handleOfficialLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const res = loginOfficial(selectedOfficialId, officialPin);
    if (res.success) {
      setShowOfficialModal(false);
      setDashboardMode('er-command');
      setSaveToast(`Welcome ${res.official.name}! Privileges active.`);
      setTimeout(() => setSaveToast(''), 4000);
    } else {
      setAuthError(res.message);
    }
  };

  // Guarded Edit Handler
  const triggerGuardedAction = (actionCallback) => {
    if (!isOfficialLoggedIn) {
      setShowOfficialModal(true);
      setAuthError('Official login required. Public citizens cannot modify hospital bed records.');
      return;
    }
    actionCallback();
  };

  // Manual Bed Numbers Save
  const handleManualSave = async () => {
    if (!isOfficialLoggedIn) {
      setShowOfficialModal(true);
      return;
    }
    await updateHospitalBeds(activeHospital.id, {
      bedsAvailable: parseInt(tempBeds, 10),
      icuAvailable: parseInt(tempICU, 10)
    });
    setSaveToast('Live bed telemetry broadcast to city dispatchers');
    setTimeout(() => setSaveToast(''), 3500);
    setEditMode(false);
  };

  // Call Ambulance Submit
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
      citizenPhone: callerPhone.trim() || '+91-98765-43210',
      emergencyType: finalType,
      notes: callerNotes.trim()
    });

    setIsCallingAmbulance(false);
    setSummonModalHospital(null);
  };

  // Add Review Submit
  const handleAddReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewsModalHospital || !newReviewComment.trim()) return;

    addHospitalReview(reviewsModalHospital.id, {
      author: newReviewAuthor.trim() || 'Verified Citizen',
      rating: parseInt(newReviewRating, 10),
      comment: newReviewComment.trim(),
      tags: ['Verified Patient Intake']
    });

    setReviewSuccessMsg('Review recorded. Thank you for contributing to healthcare transparency.');
    setNewReviewComment('');
    setNewReviewAuthor('');
    setTimeout(() => setReviewSuccessMsg(''), 3000);
  };

  const occupancyRate = Math.round(
    ((activeHospital.bedsTotal - activeHospital.bedsAvailable) / activeHospital.bedsTotal) * 100
  );

  const icuOccupancyRate = Math.round(
    ((activeHospital.icuTotal - activeHospital.icuAvailable) / activeHospital.icuTotal) * 100
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-brand-bg text-slate-900 dark:text-slate-100 p-4 md:p-6 space-y-5">
      {/* Active Dispatched Ambulance Alert Banner */}
      {lastDispatchedCall && (
        <div className="p-4 rounded-xl bg-emergency-50 dark:bg-emergency-950/40 border border-emergency-300 dark:border-emergency-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emergency-600 text-white flex items-center justify-center shrink-0">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Active Dispatch: {lastDispatchedCall.ambulanceUnit}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emergency-600 text-white uppercase">
                  Code Red
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Destination: <strong className="text-slate-900 dark:text-slate-100">{lastDispatchedCall.targetHospital.name}</strong> • Distance: <strong>{lastDispatchedCall.dist} km</strong> • Travel ETA: <strong>{lastDispatchedCall.eta} min</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-800">
              Transmitted to Central Dispatch
            </span>
            <button
              onClick={() => setLastDispatchedCall(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
                Hospital Beds & Emergency Intake Portal
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                LIVE TELEMETRY
              </span>
              {isOfficialLoggedIn ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  STAFF: {currentOfficial.name.split(' ')[1] || currentOfficial.name}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  READ-ONLY VIEW
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified capacity across city apex trauma hubs. Real-time updates authenticated by authorized ER clinical personnel.
            </p>
          </div>
        </div>

        {/* Action Controls & Official Login Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {saveToast && (
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              {saveToast}
            </span>
          )}

          {isOfficialLoggedIn ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <div className="text-left">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentOfficial.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {currentOfficial.role}
                </div>
              </div>
              <button
                onClick={logoutOfficial}
                className="px-2 py-1 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all ml-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowOfficialModal(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Staff Login</span>
            </button>
          )}

          <button
            onClick={onBackToDispatch}
            className="px-3.5 py-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-emergency-500" />
            <span className="hidden sm:inline">Central Dispatch</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Official ER Command vs Hospital Triage Queue vs Citizen Finder */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setDashboardMode('er-command')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              dashboardMode === 'er-command'
                ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold border border-primary-200 dark:border-primary-800 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>ER Bed Telemetry Console</span>
            {!isOfficialLoggedIn && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                Read-Only
              </span>
            )}
          </button>

          <button
            onClick={() => setDashboardMode('triage-queue')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              dashboardMode === 'triage-queue'
                ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold border border-primary-200 dark:border-primary-800 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emergency-500" />
            <span>Hospital Triage Queue</span>
            {pendingVerifications && pendingVerifications.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {pendingVerifications.length}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* MODE 1: HOSPITAL ER COMMAND */}
      {dashboardMode === 'er-command' && (
        <div className="space-y-5">
          {/* Hospital Switcher Tabs */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-500 flex items-center justify-between">
              <span>Apex Facility Selector:</span>
              <span className="text-teal-600 dark:text-teal-400">5 Connected City Trauma Hubs</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {hospitals.map(h => {
                const isSelected = h.id === activeHospital.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => handleSelectHospital(h.id)}
                    className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-950 dark:text-primary-100 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        h.bedsAvailable < 10
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {h.bedsAvailable} Beds Left
                      </span>
                    </div>
                    <div className="font-semibold text-xs truncate text-slate-900 dark:text-slate-100">{h.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{h.type}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Hospital Details & Bed Management Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">{activeHospital.name}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {activeHospital.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {activeHospital.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Status:</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {activeHospital.erStatus || 'Active Receiving'}
                    </span>
                  </div>
                </div>

                {/* Core Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Beds Left */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="uppercase font-semibold">General Beds</span>
                      <span>Total: {activeHospital.bedsTotal}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-display">
                        {activeHospital.bedsAvailable}
                      </span>
                      <span className="text-xs font-mono text-slate-400">/ {activeHospital.bedsTotal} left</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Occupancy</span>
                        <span>{occupancyRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            occupancyRate > 90 ? 'bg-rose-500' : occupancyRate > 75 ? 'bg-amber-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${occupancyRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-[10px] font-mono text-slate-400">Adjust Bed:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => triggerGuardedAction(() => updateHospitalBeds(activeHospital.id, { bedsAvailable: Math.max(0, activeHospital.bedsAvailable - 1) }))}
                          className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => triggerGuardedAction(() => updateHospitalBeds(activeHospital.id, { bedsAvailable: Math.min(activeHospital.bedsTotal, activeHospital.bedsAvailable + 1) }))}
                          className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: ICU Availability */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="uppercase font-semibold">ICU Capacity</span>
                      <span>Total: {activeHospital.icuTotal}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-display">
                        {activeHospital.icuAvailable}
                      </span>
                      <span className="text-xs font-mono text-slate-400">/ {activeHospital.icuTotal} left</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>ICU Occupancy</span>
                        <span>{icuOccupancyRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            icuOccupancyRate > 90 ? 'bg-rose-500' : icuOccupancyRate > 75 ? 'bg-amber-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${icuOccupancyRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-[10px] font-mono text-slate-400">Adjust ICU:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => triggerGuardedAction(() => updateHospitalBeds(activeHospital.id, { icuAvailable: Math.max(0, activeHospital.icuAvailable - 1) }))}
                          className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => triggerGuardedAction(() => updateHospitalBeds(activeHospital.id, { icuAvailable: Math.min(activeHospital.icuTotal, activeHospital.icuAvailable + 1) }))}
                          className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Trauma ER Bays */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="uppercase font-semibold">Trauma Shock Bays</span>
                      <span>Total: {activeHospital.erBaysTotal}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-amber-600 dark:text-amber-400 font-display">
                        {activeHospital.erBaysAvailable}
                      </span>
                      <span className="text-xs font-mono text-slate-400">/ {activeHospital.erBaysTotal}</span>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span>Ventilators:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">{activeHospital.ventilators} units</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>O₂ Supply:</span>
                        <strong className="text-teal-600 dark:text-teal-400">{activeHospital.oxygenStatus}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-[10px] font-mono text-slate-400">Bay Adjust:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => triggerGuardedAction(() => updateHospitalBeds(activeHospital.id, { erBaysAvailable: Math.max(0, activeHospital.erBaysAvailable - 1) }))}
                          className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => triggerGuardedAction(() => updateHospitalBeds(activeHospital.id, { erBaysAvailable: Math.min(activeHospital.erBaysTotal, activeHospital.erBaysAvailable + 1) }))}
                          className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Override & Quick Triage Admission */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-primary-500" />
                      Admission & Override Controls
                    </span>

                    {isOfficialLoggedIn ? (
                      <button
                        onClick={() => setEditMode(!editMode)}
                        className="text-xs font-mono text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                      >
                        {editMode ? 'Cancel Edit' : 'Edit Exact Numbers'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        Staff Auth Required for Editing
                      </span>
                    )}
                  </div>

                  {editMode && isOfficialLoggedIn ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block mb-1">Available General Beds</label>
                        <input
                          type="number"
                          value={tempBeds}
                          onChange={(e) => setTempBeds(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block mb-1">Available ICU Beds</label>
                        <input
                          type="number"
                          value={tempICU}
                          onChange={(e) => setTempICU(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleManualSave}
                          className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-semibold transition-all shadow-sm"
                        >
                          Broadcast Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => triggerGuardedAction(() => quickAdmit(activeHospital.id, false))}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <BedDouble className="w-3.5 h-3.5 text-primary-500" />
                        Admit General (-1 Bed)
                      </button>
                      <button
                        onClick={() => triggerGuardedAction(() => quickAdmit(activeHospital.id, true))}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <HeartPulse className="w-3.5 h-3.5 text-purple-500" />
                        Admit ICU Emergency (-1 ICU)
                      </button>
                      <button
                        onClick={() => triggerGuardedAction(() => quickDischarge(activeHospital.id, false))}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Process Discharge (+1 Bed)
                      </button>
                    </div>
                  )}
                </div>

                {/* Clinical Readiness */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Specialty Department Readiness:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { key: 'cardiac', label: 'Cardiac ER' },
                      { key: 'trauma', label: 'Trauma Bay' },
                      { key: 'neuro', label: 'Neuro Stroke' },
                      { key: 'burn', label: 'Burn Unit' },
                      { key: 'maternity', label: 'Maternity' },
                      { key: 'pediatric', label: 'Pediatric' }
                    ].map(spec => (
                      <div
                        key={spec.key}
                        className={`p-2.5 rounded-lg border text-center flex flex-col items-center gap-1 ${
                          activeHospital[spec.key]
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                        }`}
                      >
                        <span className="text-xs font-semibold">{spec.label}</span>
                        <span className="text-[9px] font-mono uppercase">
                          {activeHospital[spec.key] ? 'READY' : 'UNAVAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Incoming Ambulance Intake Queue & Audit Log */}
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Ambulance className="w-4 h-4 text-emergency-500" />
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 font-display">
                      Incoming Triage Queue
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {incomingIntakes.length} EN ROUTE
                  </span>
                </div>

                {incomingIntakes.length === 0 ? (
                  <div className="p-6 text-center rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                    <Radio className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-mono">
                      No ambulance units en route to {activeHospital.shortName}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {incomingIntakes.map(intake => (
                      <div
                        key={intake.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{intake.ambulanceName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                              {intake.emergencyType}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            ETA {intake.eta || '3.2 min'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          Patient: <strong className="text-slate-800 dark:text-slate-200">{intake.patientName || 'Emergency Patient'}</strong>
                        </div>

                        <button
                          onClick={() => triggerGuardedAction(() => {
                            quickAdmit(activeHospital.id, intake.emergencyType?.includes('Cardiac'));
                            removeIncomingAmbulance(intake.id);
                          })}
                          className="w-full py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-semibold transition-all shadow-sm"
                        >
                          Confirm ER Handover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real-Time Hospital Activity & Audit Log */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Bed Admissions Audit Log
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Immutable</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {auditLog.map(item => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                      <div className="flex justify-between items-center text-slate-400 font-mono text-[10px]">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">{item.hospitalName}</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300">{item.details}</div>
                      {item.officialName && (
                        <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                          Authorized by: {item.officialName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: HOSPITAL TRIAGE & PATIENT VERIFICATION QUEUE */}
      {dashboardMode === 'triage-queue' && (
        <HospitalVerificationPortal
          onSwitchToCitizenImpact={() => setDashboardMode('er-command')}
          initialHospitalName={activeHospital?.name}
        />
      )}

      {/* MODAL 1: OFFICIAL LOGIN MODAL */}
      {showOfficialModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                    Hospital Staff Authentication
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">ER Clinical Triage Personnel</p>
                </div>
              </div>
              <button
                onClick={() => { setShowOfficialModal(false); setAuthError(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-mono text-rose-700 dark:text-rose-300">
                {authError}
              </div>
            )}

            <form onSubmit={handleOfficialLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1.5">
                  Select Staff Profile:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {AUTHORIZED_OFFICIALS.map(official => {
                    const isSelected = selectedOfficialId === official.id;
                    return (
                      <button
                        type="button"
                        key={official.id}
                        onClick={() => setSelectedOfficialId(official.id)}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-900 dark:text-purple-100 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {official.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {official.role} • {official.hospitalName.split(' ')[0]}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {official.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-slate-300 block mb-1.5">
                  Security PIN (Demo: 1234):
                </label>
                <input
                  type="password"
                  value={officialPin}
                  onChange={(e) => setOfficialPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  maxLength={6}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOfficialModal(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
                >
                  Verify & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CALL AMBULANCE TO HOSPITAL MODAL */}
      {summonModalHospital && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emergency-50 dark:bg-emergency-950/40 text-emergency-600 flex items-center justify-center">
                  <Ambulance className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                    Emergency Ambulance Request
                  </h3>
                  <p className="text-[11px] font-mono text-emergency-600 dark:text-emergency-400">
                    Destination: {summonModalHospital.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSummonModalHospital(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">Distance</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {summonModalHospital.formattedDistance}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">Drive Time</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {summonModalHospital.formattedTravelTime}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">Beds Left</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {summonModalHospital.bedsAvailable} ({summonModalHospital.icuAvailable} ICU)
                </span>
              </div>
            </div>

            <form onSubmit={handleSummonAmbulanceSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block mb-1">Citizen Name:</label>
                  <input
                    type="text"
                    required
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emergency-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block mb-1">Phone Number:</label>
                  <input
                    type="tel"
                    required
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emergency-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block mb-1">Emergency Nature:</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emergency-500"
                >
                  <option value="Acute Cardiac Event">Acute Cardiac Event (Heart Attack)</option>
                  <option value="Severe Road Collision">Severe Road Collision / Polytrauma</option>
                  <option value="Stroke / Neurological">Acute Stroke / Neurological Emergency</option>
                  <option value="Severe Respiratory Distress">Severe Respiratory Distress / Asthma</option>
                  <option value="Severe Burn Trauma">Severe Burn Trauma</option>
                  <option value="Obstetric / Maternity Crisis">Maternity / Delivery Emergency</option>
                  <option value="Other">Other (Specify Below)</option>
                </select>
              </div>

              {emergencyType === 'Other' && (
                <div>
                  <label className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block mb-1">Specify Emergency:</label>
                  <input
                    type="text"
                    value={customEmergencyText}
                    onChange={(e) => setCustomEmergencyText(e.target.value)}
                    placeholder="Describe emergency condition..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emergency-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block mb-1">Pickup Location:</label>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>{citizenLocation.name}</span>
                  <span className="text-[10px] text-slate-400">GPS Locked</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block mb-1">Clinical Notes for Paramedics:</label>
                <textarea
                  rows={2}
                  value={callerNotes}
                  onChange={(e) => setCallerNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emergency-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSummonModalHospital(null)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCallingAmbulance}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emergency-600 hover:bg-emergency-700 text-white shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Ambulance className="w-4 h-4" />
                  <span>Confirm & Summon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PATIENT REVIEWS & RATINGS MODAL */}
      {reviewsModalHospital && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                    Patient Reviews & Intake Transparency
                  </h3>
                  <span className="text-amber-500 font-semibold text-xs flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {reviewsModalHospital.rating}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">
                  {reviewsModalHospital.name} • {reviewsModalHospital.reviewsCount || 850}+ Verified Patients
                </p>
              </div>
              <button
                onClick={() => setReviewsModalHospital(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-700 dark:text-emerald-300">
                {reviewSuccessMsg}
              </div>
            )}

            <div className="space-y-2.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Verified Citizen Experiences:
              </span>
              {(reviewsModalHospital.reviews || []).map(rev => (
                <div key={rev.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{rev.author}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        Verified Patient
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 text-xs font-bold">{'★'.repeat(rev.rating)}</span>
                      <span className="text-[10px] font-mono text-slate-400">{rev.date}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-body">"{rev.comment}"</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddReviewSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Write a Verified Citizen Review:
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 block mb-1">Your Name:</label>
                  <input
                    type="text"
                    required
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    placeholder="e.g. Ramesh K."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 block mb-1">Star Rating:</label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value={5}>5 Stars - Exceptional</option>
                    <option value={4}>4 Stars - Very Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Slow Triage</option>
                    <option value={1}>1 Star - Unsatisfactory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1">Your Feedback:</label>
                <textarea
                  rows={2}
                  required
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Share details on ER response time, ICU bed cleanliness, ambulance handover speed..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
