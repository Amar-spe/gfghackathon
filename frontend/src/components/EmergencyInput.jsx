import React, { useState } from 'react';
import { EMERGENCY_PROFILES } from '../utils/aiEngine';
import { Heart, Activity, Flame, Baby, AlertTriangle, ShieldAlert, Stethoscope, Sparkles } from 'lucide-react';

const EMERGENCY_TYPES = [
  { id: 'Cardiac Arrest', label: 'Cardiac Arrest', icon: Heart, color: 'text-red-500' },
  { id: 'Heart Attack',   label: 'Heart Attack',   icon: Activity, color: 'text-rose-500' },
  { id: 'Stroke',         label: 'Stroke',         icon: AlertTriangle, color: 'text-purple-500' },
  { id: 'Accident',       label: 'Traffic Crash',  icon: ShieldAlert, color: 'text-orange-500' },
  { id: 'Trauma',         label: 'Severe Trauma',  icon: AlertTriangle, color: 'text-red-500' },
  { id: 'Burn',           label: 'Burn Injury',    icon: Flame, color: 'text-amber-500' },
  { id: 'Pregnancy',      label: 'Obstetric Emergency', icon: Baby, color: 'text-pink-500' },
  { id: 'General',        label: 'General Medical', icon: Stethoscope, color: 'text-teal' },
  { id: 'Other',          label: 'Custom Emergency', icon: Sparkles, color: 'text-blue-500' },
];

export default function EmergencyInput({ emergencyType, onChange, phase, emergencyLocation }) {
  const isPredefined = EMERGENCY_TYPES.slice(0, -1).some(t => t.id === emergencyType);
  const isCustomType = !isPredefined;
  const [customText, setCustomText] = useState(isCustomType && emergencyType !== 'Other' ? emergencyType : '');
  const [showCustomInput, setShowCustomInput] = useState(isCustomType);

  const handleSelect = (typeId) => {
    if (typeId === 'Other') {
      setShowCustomInput(true);
      onChange(customText.trim() ? customText.trim() : 'Other');
    } else {
      setShowCustomInput(false);
      onChange(typeId);
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomText(val);
    onChange(val.trim() ? val.trim() : 'Other');
  };

  const isDisabled = phase === 'enroute' || phase === 'arrived';

  return (
    <div className="bg-white dark:bg-[#10243A] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
      {/* ── Section Title ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emergency" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Incident Classification
          </span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          AI Triage Matrix
        </span>
      </div>

      {/* ── Grid of Incident Types ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-1.5">
        {EMERGENCY_TYPES.map(type => {
          const isSelected = type.id === 'Other'
            ? (showCustomInput || emergencyType === 'Other')
            : emergencyType === type.id;
          const Icon = type.icon;

          return (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              disabled={isDisabled}
              className={`p-2 rounded-lg text-left transition-all border flex flex-col justify-between h-14 ${
                isSelected
                  ? 'bg-primary-50 dark:bg-slate-800 border-primary-500 dark:border-primary-400 text-primary-900 dark:text-slate-50 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon size={14} className={isSelected ? 'text-emergency' : type.color} />
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emergency" />}
              </div>
              <span className="text-[11px] font-semibold truncate leading-tight">
                {type.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Custom Emergency Input ──────────────────────────────────── */}
      {showCustomInput && (
        <div className="pt-1">
          <input
            type="text"
            value={customText}
            onChange={handleCustomChange}
            placeholder="Describe specific emergency nature..."
            disabled={isDisabled}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      {/* ── Coordinates Status ──────────────────────────────────────── */}
      {emergencyLocation && (
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span>GPS Pin:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {emergencyLocation.lat?.toFixed(4)}, {emergencyLocation.lng?.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
