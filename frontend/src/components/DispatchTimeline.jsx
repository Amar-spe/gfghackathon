import React from 'react';
import { CheckCircle2, Clock, MapPin, Ambulance, Hospital, Activity } from 'lucide-react';

export default function DispatchTimeline({ steps = [], phase }) {
  if (!steps || steps.length === 0 || phase === 'idle') return null;

  return (
    <div className="bg-white dark:bg-[#10243A] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Mission Milestones
        </div>
        <span className="text-[10px] font-mono font-medium text-slate-500">
          5-Stage Telemetry
        </span>
      </div>

      {/* ── Steps ───────────────────────────────────────────────────── */}
      <div className="space-y-0 relative">
        {steps.map((step, idx) => {
          const isDone = step.done;
          const isActive = step.active;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.key} className="flex items-start gap-3 relative pb-3">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-3.5 top-6 bottom-0 w-0.5 ${
                    isDone ? 'bg-teal' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}

              {/* Step indicator node */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors ${
                  isDone
                    ? 'bg-teal text-white'
                    : isActive
                    ? 'bg-primary-700 text-white dark:bg-primary-500 ring-2 ring-primary-300 dark:ring-primary-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <span className="text-xs font-mono font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Step details */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isDone
                      ? 'text-teal'
                      : isActive
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                  {step.time && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {step.time}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isDone ? 'Milestone Completed' : isActive ? 'Currently in Progress' : 'Pending Authorization'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
