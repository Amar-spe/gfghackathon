import React from 'react';
import { RotateCcw, TrafficCone, CheckCircle2, Send, RadioTower } from 'lucide-react';
import { useHospitalBeds } from '../context/HospitalBedContext';

export default function ControlPanel({
  trafficEnabled, onTrafficToggle,
  onDispatch,
  onReset,
  phase,
  selectedAmbulance,
  selectedHospital,
}) {
  const { ambulanceLiveLocation } = useHospitalBeds();
  const canDispatch = phase === 'located' && selectedAmbulance && selectedHospital;
  const isActive = phase === 'enroute' || phase === 'arrived';

  return (
    <div className="shrink-0 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] flex flex-wrap items-center justify-between gap-3 shadow-sm transition-colors duration-200">
      {/* ── Left: Operational Status & Traffic Flow ────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {ambulanceLiveLocation?.active && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal/15 text-teal border border-teal/30 text-xs font-semibold">
            <RadioTower size={13} className="text-teal" />
            <span>GPS Telemetry Active (Live Field Stream)</span>
          </div>
        )}
        {/* Real-Time Traffic Toggle */}
        <button
          onClick={() => onTrafficToggle(!trafficEnabled)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
            trafficEnabled
              ? 'bg-primary-50 dark:bg-slate-800 border-primary-300 dark:border-primary-600 text-primary-900 dark:text-slate-100'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500'
          }`}
        >
          <TrafficCone size={14} className={trafficEnabled ? 'text-amber-500' : 'text-slate-400'} />
          <span>Live Traffic Flow</span>
        </button>
      </div>

      {/* ── Right: Dominant Primary Dispatch CTA & Reset ─────────────── */}
      <div className="flex items-center gap-2">
        {/* Reset button */}
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>

        {/* Primary Dispatch Action Button */}
        {phase === 'enroute' ? (
          <div className="px-5 py-2.5 rounded-lg bg-teal text-white text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>Unit En Route ({selectedAmbulance?.name || 'Unit Active'})</span>
          </div>
        ) : phase === 'arrived' ? (
          <div className="px-5 py-2.5 rounded-lg bg-teal text-white text-xs font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle2 size={15} />
            <span>Unit Arrived at Destination ER</span>
          </div>
        ) : (
          <button
            onClick={onDispatch}
            disabled={!canDispatch}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-2 shadow-sm ${
              canDispatch
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send size={14} className={canDispatch ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
            <span>
              {canDispatch
                ? `Authorize Dispatch: ${selectedAmbulance?.name || 'Unit'}`
                : 'Authorize Dispatch (Select Incident & Unit)'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
