import React from 'react';
import { TRAFFIC_LEVELS } from '../utils/trafficSimulator';
import { useHospitalBeds } from '../context/HospitalBedContext';
import { Ambulance, Shield, Navigation, Gauge, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';

function TrafficBadge({ level }) {
  const info = TRAFFIC_LEVELS[level] || TRAFFIC_LEVELS.LOW;
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
      Traffic: {info.label}
    </span>
  );
}

function AmbulanceCard({
  ambulance,
  selected,
  onSelect,
  rank,
  trafficConditions = {},
  canEditFleet,
  onUpdateStatus,
  selectedHospital
}) {
  const trafficLevel = trafficConditions[`amb_${ambulance.id}`] || 'LOW';

  const isAvailable = ambulance.status === 'available';
  const isEnroute = ambulance.status === 'enroute';
  const isBusy = ambulance.status === 'busy';
  const isMaint = ambulance.status === 'maintenance';

  const statusLabel =
    isAvailable ? 'Available' :
    isEnroute   ? 'En Route' :
    isBusy      ? 'On Mission' :
    isMaint     ? 'Maintenance' : 'Standby';

  const statusBadge =
    isAvailable ? 'bg-teal/10 text-teal border-teal/20' :
    isEnroute   ? 'bg-red-50 text-emergency dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/40' :
    isBusy      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

  const equipBadge =
    ambulance.equipmentType === 'ICU' ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300' :
    ambulance.equipmentType === 'ALS' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300' :
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  const hospitalId = ambulance.hospitalId || selectedHospital?.id || 1;

  return (
    <div
      onClick={() => onSelect(ambulance)}
      className={`p-3 rounded-lg border transition-all text-left mb-2 cursor-pointer ${
        selected
          ? 'bg-primary-50/60 dark:bg-slate-800/80 border-primary-500 dark:border-primary-400 border-l-4 border-l-emergency shadow-sm'
          : 'bg-white dark:bg-[#131F33] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
              {ambulance.name}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${equipBadge}`}>
              {ambulance.equipmentType || 'ALS'}
            </span>
            {rank === 1 && isAvailable && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal/15 text-teal border border-teal/30">
                AI Top Pick
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {ambulance.type}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge}`}>
            {statusLabel}
          </span>
          {ambulance.distance && (
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {ambulance.distance} km • ~{ambulance.eta || Math.round(ambulance.distance * 2.2)}m
            </span>
          )}
        </div>
      </div>

      {/* Equipment & Scoring Metrics */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/70">
        <div className="flex items-center gap-3">
          <span>Equip: <strong className="text-slate-700 dark:text-slate-200">{ambulance.equipment || 90}%</strong></span>
          <TrafficBadge level={trafficLevel} />
        </div>
        {ambulance.score && (
          <div className="font-mono text-xs font-semibold text-teal">
            Score: {ambulance.score}/100
          </div>
        )}
      </div>

      {/* Doctor / Hospital Staff Readiness Controls */}
      {canEditFleet && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium">Readiness:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(hospitalId, ambulance.id, 'available'); }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                isAvailable
                  ? 'bg-teal text-white border-teal'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
              }`}
            >
              Ready
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(hospitalId, ambulance.id, 'busy'); }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                isBusy
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
              }`}
            >
              Busy
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(hospitalId, ambulance.id, 'maintenance'); }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                isMaint
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
              }`}
            >
              Maint
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AmbulancePanel({
  ambulances = [],
  selectedAmbulance,
  onSelect,
  trafficConditions,
  phase,
  selectedHospital
}) {
  const { isOfficial, currentOfficial, setAmbulanceFleetStatus } = useHospitalBeds();

  const canEditFleet = isOfficial && (
    !selectedHospital ||
    currentOfficial?.hospitalId === selectedHospital.id
  );

  const handleUpdateStatus = (hospId, ambId, newStatus) => {
    if (setAmbulanceFleetStatus) {
      setAmbulanceFleetStatus(hospId, ambId, newStatus);
    }
  };

  if (!ambulances || ambulances.length === 0) {
    return (
      <div className="bg-white dark:bg-[#10243A] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm text-center">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          {selectedHospital ? `${selectedHospital.name} Fleet` : 'Ambulance Units'}
        </div>
        <p className="text-xs text-slate-400">
          Place an incident pin or select a hospital to view dedicated units.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#10243A] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {selectedHospital ? `${selectedHospital.shortName || selectedHospital.name} Fleet` : 'Emergency Fleet'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {selectedHospital ? 'Dedicated hospital response units' : 'Citywide response units'}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {ambulances.length} Units
          </span>
          {canEditFleet && (
            <div className="text-[10px] text-teal font-semibold mt-0.5">
              Staff Edit Active
            </div>
          )}
        </div>
      </div>

      {/* ── Ambulance Cards List ────────────────────────────────────── */}
      <div className="space-y-1.5 max-h-56 md:max-h-64 overflow-y-auto pr-0.5">
        {ambulances.map((amb, i) => (
          <AmbulanceCard
            key={amb.id}
            ambulance={amb}
            selected={selectedAmbulance?.id === amb.id}
            onSelect={onSelect}
            rank={i + 1}
            trafficConditions={trafficConditions}
            canEditFleet={canEditFleet}
            onUpdateStatus={handleUpdateStatus}
            selectedHospital={selectedHospital}
          />
        ))}
      </div>
    </div>
  );
}
