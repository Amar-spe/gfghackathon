import React, { useState } from 'react';
import { TRAFFIC_LEVELS } from '../utils/trafficSimulator';
import { getRecommendationReasons } from '../utils/aiEngine';
import { useHospitalBeds, AUTHORIZED_OFFICIALS } from '../context/HospitalBedContext';
import { Building2, Bed, Star, Navigation, Shield, Edit3, X, Check, Lock, AlertCircle } from 'lucide-react';

const RANK_BADGES = {
  1: { label: 'Top Match', color: 'bg-teal/15 text-teal border-teal/30' },
  2: { label: 'Recommended', color: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800' },
  3: { label: 'Alternative', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
};

function getRankMeta(rank) {
  if (RANK_BADGES[rank]) return RANK_BADGES[rank];
  return { label: `Option #${rank}`, color: 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
}

function HospitalCard({
  hospital,
  rank,
  selected,
  onSelect,
  emergencyType,
  allHospitals = [],
  isOfficial,
  currentOfficial,
  onEditBeds
}) {
  const rankMeta = getRankMeta(rank);
  const reasons = getRecommendationReasons(hospital, emergencyType, allHospitals);
  const isMyHospital = isOfficial && currentOfficial?.hospitalId === hospital.id;

  return (
    <div
      onClick={() => onSelect(hospital)}
      className={`p-3 rounded-lg border transition-all text-left mb-2 cursor-pointer ${
        selected
          ? 'bg-primary-50/60 dark:bg-slate-800/80 border-primary-500 dark:border-primary-400 border-l-4 border-l-teal shadow-sm'
          : 'bg-white dark:bg-[#131F33] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {hospital.name}
            </span>
            {rankMeta && (
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${rankMeta.color}`}>
                {rankMeta.label}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {hospital.type}
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {hospital.distance} km
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            ~{hospital.estimatedTime?.toFixed(0) || '12'} min
          </span>
        </div>
      </div>

      {/* Bed Capacity & Ratings */}
      <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/70">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-teal">
            <Bed size={13} />
            <span>{hospital.beds} Available Beds</span>
          </span>
          {hospital.icuBeds !== undefined && (
            <span className="text-slate-500 dark:text-slate-400">
              ({hospital.icuBeds} ICU)
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
          <Star size={11} className="text-amber-500 fill-amber-500" />
          <span>{hospital.rating || '4.8'}</span>
        </span>
      </div>

      {/* Specialty Tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {hospital.cardiac && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40">
            Cardiac ICU
          </span>
        )}
        {hospital.trauma && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-900/40">
            Trauma L1
          </span>
        )}
        {hospital.neuro && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
            Stroke Unit
          </span>
        )}
      </div>

      {/* Doctor/Staff Edit Trigger */}
      {isMyHospital && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/70 flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onEditBeds(hospital); }}
            className="text-[10px] text-teal font-semibold hover:underline flex items-center gap-1"
          >
            <Edit3 size={11} /> Update Live Bed Telemetry
          </button>
        </div>
      )}
    </div>
  );
}

export default function HospitalPanel({
  rankedHospitals = [],
  selectedHospital,
  onSelect,
  phase,
  loading = false,
  emergencyType = 'General'
}) {
  const { isOfficial, currentOfficial, loginAsOfficial, logoutOfficial, updateHospitalBeds } = useHospitalBeds();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedOfficialId, setSelectedOfficialId] = useState(AUTHORIZED_OFFICIALS[0]?.id || '');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [editingHospital, setEditingHospital] = useState(null);
  const [editBeds, setEditBeds] = useState(12);
  const [editICU, setEditICU] = useState(4);

  const handleOfficialLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const res = loginAsOfficial(selectedOfficialId, pinInput);
    if (res.success) {
      setShowAuthModal(false);
      setPinInput('');
    } else {
      setAuthError(res.error || 'Authentication failed');
    }
  };

  const handleSaveBeds = (e) => {
    e.preventDefault();
    if (editingHospital) {
      updateHospitalBeds(editingHospital.id, Number(editBeds), Number(editICU));
      setEditingHospital(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#10243A] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Receiving Hospitals
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Ranked by AI matching, travel time & capacity
          </div>
        </div>

        <div className="text-right">
          {isOfficial ? (
            <div className="flex items-center gap-1 text-[10px] text-teal font-semibold">
              <span>{currentOfficial?.name?.split(' ')[0]} (Staff)</span>
              <button
                onClick={logoutOfficial}
                className="text-slate-400 hover:text-emergency ml-1 underline"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
            >
              Doctor Access
            </button>
          )}
        </div>
      </div>

      {/* ── Hospital Cards List ─────────────────────────────────────── */}
      <div className="space-y-1.5 max-h-56 md:max-h-64 overflow-y-auto pr-0.5">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400 space-y-2">
            <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Scanning regional hospital network...</p>
          </div>
        ) : rankedHospitals.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Set an incident coordinate on the map to rank medical facilities.
          </div>
        ) : (
          rankedHospitals.map((hosp, i) => (
            <HospitalCard
              key={hosp.id}
              hospital={hosp}
              rank={i + 1}
              selected={selectedHospital?.id === hosp.id}
              onSelect={onSelect}
              emergencyType={emergencyType}
              allHospitals={rankedHospitals}
              isOfficial={isOfficial}
              currentOfficial={currentOfficial}
              onEditBeds={(h) => {
                setEditingHospital(h);
                setEditBeds(h.beds || 12);
                setEditICU(h.icuBeds || 4);
              }}
            />
          ))
        )}
      </div>

      {/* ── Doctor/Staff PIN Auth Modal ─────────────────────────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-modal">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lock size={15} className="text-teal" />
                <span>Doctor / ER Staff Verification</span>
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleOfficialLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Select Registered Clinician
                </label>
                <select
                  value={selectedOfficialId}
                  onChange={e => setSelectedOfficialId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none"
                >
                  {AUTHORIZED_OFFICIALS.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.hospitalName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Security PIN (Demo: 1234)
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono"
                />
              </div>

              {authError && (
                <div className="p-2 rounded bg-red-50 dark:bg-red-950/40 text-emergency text-[11px]">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-teal text-white font-semibold text-xs transition-colors hover:bg-teal-600 shadow-sm"
              >
                Authenticate & Unlock Controls
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Bed Edit Modal ────────────────────────────────────── */}
      {editingHospital && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-modal">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit3 size={15} className="text-teal" />
                <span>Update Capacity: {editingHospital.shortName || editingHospital.name}</span>
              </h3>
              <button onClick={() => setEditingHospital(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBeds} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Available General ER Beds
                </label>
                <input
                  type="number"
                  min="0"
                  value={editBeds}
                  onChange={e => setEditBeds(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Available ICU Beds
                </label>
                <input
                  type="number"
                  min="0"
                  value={editICU}
                  onChange={e => setEditICU(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-teal text-white font-semibold text-xs transition-colors hover:bg-teal-600 shadow-sm"
              >
                Save & Broadcast to Central Dispatch
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
