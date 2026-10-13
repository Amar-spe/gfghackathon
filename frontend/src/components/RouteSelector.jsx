import React from 'react';
import { Zap, Compass, Shuffle, Lock } from 'lucide-react';

const MODES = [
  {
    id: 'optimal',
    label: 'Optimal',
    icon: Zap,
    description: 'AI traffic-evasive routing with dynamic rerouting.',
    color: 'text-teal',
    border: 'border-teal',
    bg: 'bg-teal/10',
  },
  {
    id: 'normal',
    label: 'Direct',
    icon: Compass,
    description: 'Shortest direct arterial road corridor.',
    color: 'text-blue-500',
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'alternative',
    label: 'Alternate',
    icon: Shuffle,
    description: 'Secondary corridor avoiding main chokepoints.',
    color: 'text-purple-500',
    border: 'border-purple-500',
    bg: 'bg-purple-500/10',
  },
];

export default function RouteSelector({ routeMode, onChange, phase, routeMetrics }) {
  const locked = phase === 'enroute' || phase === 'arrived';
  if (phase === 'idle') return null;

  const m = routeMetrics || {};

  return (
    <div className="bg-white dark:bg-[#10243A] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Road Corridor Mode
        </div>
        {locked && (
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Lock size={11} /> Locked In Transit
          </span>
        )}
      </div>

      {/* ── Mode Selection Buttons ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-1.5">
        {MODES.map(mode => {
          const isSelected = routeMode === mode.id;
          const Icon = mode.icon;
          const metric = m[mode.id];

          return (
            <button
              key={mode.id}
              onClick={() => !locked && onChange(mode.id)}
              disabled={locked}
              className={`p-2.5 rounded-lg text-left transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'bg-primary-50 dark:bg-slate-800 border-primary-500 dark:border-primary-400 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              } ${locked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon size={14} className={isSelected ? 'text-primary-700 dark:text-teal' : mode.color} />
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-teal" />}
              </div>
              <div className="mt-1">
                <div className="text-xs font-bold leading-tight">
                  {mode.label}
                </div>
                {metric?.durationMin && (
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {metric.durationMin}m • {metric.distanceKm}km
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
