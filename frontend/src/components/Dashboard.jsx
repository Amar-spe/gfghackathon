import React from 'react';
import { formatETA } from '../utils/aiEngine';
import { TRAFFIC_LEVELS, getOverallTrafficLevel } from '../utils/trafficSimulator';
import { Clock, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';

function StatCard({ label, value, unit, isPulse }) {
  return (
    <div className="text-center px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/80 dark:border-slate-800 min-w-[76px]">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5 leading-none">
        <span>{value}</span>
        {unit && <span className="text-[10px] font-normal text-slate-500 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

export default function Dashboard({
  phase,
  selectedAmbulance,
  selectedHospital,
  eta,
  distance,
  routeProgress,
  trafficConditions,
  emergencyMode,
  rerouteCount = 0,
}) {
  if (phase === 'idle') return null;

  const overallTraffic = getOverallTrafficLevel(trafficConditions);
  const trafficLabel = overallTraffic > 0.66 ? 'Heavy' : overallTraffic > 0.33 ? 'Moderate' : 'Clear';

  return (
    <div className="absolute bottom-4 right-4 z-[900] flex flex-col gap-2 max-w-sm">
      {/* ── Floating Telemetry Card ─────────────────────────────────── */}
      <div className="bg-white/95 dark:bg-[#10243A]/95 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-card backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${phase === 'enroute' ? 'bg-teal animate-pulse' : 'bg-primary-500'}`} />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {phase === 'enroute' ? 'Active Mission Telemetry' : 'Route Overview'}
            </span>
          </div>
          {emergencyMode && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-emergency dark:bg-red-950/40">
              Priority Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {eta !== null && (
            <StatCard
              label="ETA"
              value={formatETA(eta)}
              isPulse={phase === 'enroute'}
            />
          )}
          {distance && (
            <StatCard
              label="Distance"
              value={parseFloat(distance).toFixed(1)}
              unit="km"
            />
          )}
          {rerouteCount > 0 && (
            <StatCard
              label="Reroutes"
              value={rerouteCount}
            />
          )}
          <StatCard
            label="Traffic"
            value={trafficLabel}
          />
        </div>

        {/* Progress Bar during transit */}
        {phase === 'enroute' && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Transit Progress</span>
              <span className="font-bold text-teal">{Math.round((routeProgress || 0) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (routeProgress || 0) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
