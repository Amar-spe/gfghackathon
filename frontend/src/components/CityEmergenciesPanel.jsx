import React, { useState } from 'react';
import {
  AlertCircle,
  Clock,
  MapPin,
  Filter,
  Search,
  CheckCircle2,
  ChevronRight,
  Activity,
  Ambulance,
  Zap,
  Radio
} from 'lucide-react';

const SEVERITY_CONFIG = {
  'CRITICAL': { label: 'Critical', bg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/50' },
  'CODE RED': { label: 'Code Red', bg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/50' },
  'SEVERE':   { label: 'High',     bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900/50' },
  'URGENT':   { label: 'Moderate', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50' },
  'GENERAL':  { label: 'Standard', bg: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
};

export default function CityEmergenciesPanel({
  cityEmergencies = [],
  activeEmergencyId,
  onSelectEmergency,
  onQuickDispatch,
  phase
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = cityEmergencies.filter(emg => {
    const matchesSearch =
      (emg.locationName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emg.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emg.citizenName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emg.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      filterSeverity === 'ALL' ||
      (filterSeverity === 'CRITICAL' && (emg.severity === 'CRITICAL' || emg.severity === 'CODE RED')) ||
      (filterSeverity === 'HIGH' && emg.severity === 'SEVERE') ||
      (filterSeverity === 'MODERATE' && emg.severity === 'URGENT');

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="bg-white dark:bg-[#10243A] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emergency" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Emergency CAD Queue
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {cityEmergencies.length} Active
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by caller, location, or type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-white dark:bg-[#131F33] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 mt-2">
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                filterSeverity === sev
                  ? 'bg-primary-700 text-white dark:bg-primary dark:text-slate-100'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* ── Emergency List Items ────────────────────────────────────── */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 md:max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No matching emergency incidents in queue.
          </div>
        ) : (
          filtered.map((emg) => {
            const isSelected = activeEmergencyId === emg.id;
            const severityMeta = SEVERITY_CONFIG[emg.severity] || SEVERITY_CONFIG.GENERAL;
            const isCitizenReport = !!emg.citizenName || (emg.id && emg.id.startsWith('REP-'));

            return (
              <div
                key={emg.id}
                onClick={() => onSelectEmergency(emg)}
                className={`w-full text-left p-3 transition-colors flex flex-col gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-primary-50/70 dark:bg-slate-800/90 border-l-4 border-l-emergency'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Caller & Location Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Citizen Call Tag */}
                    {isCitizenReport && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1 shadow-xs">
                          <AlertCircle size={11} />
                          <span>Citizen Emergency Call</span>
                        </span>
                        {emg.isLiveGps && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                            <Radio size={10} />
                            <span>Live GPS</span>
                          </span>
                        )}
                        {emg.citizenName && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                            Caller: {emg.citizenName}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {emg.locationName}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${severityMeta.bg}`}>
                        {severityMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{emg.type}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock size={10} />
                        {emg.timeReported}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {emg.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      emg.status === 'EN ROUTE'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : emg.status === 'RESOLVED'
                        ? 'bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {emg.status}
                    </span>

                    {isSelected && (
                      <span className="text-[10px] text-emergency font-semibold flex items-center gap-0.5">
                        Focused <ChevronRight size={10} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Action Dispatch Button */}
                {emg.status === 'PENDING' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onQuickDispatch) {
                        onQuickDispatch(emg);
                      } else {
                        onSelectEmergency(emg);
                      }
                    }}
                    className="mt-1 w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Ambulance size={14} />
                    <span>Assign & Route Unit</span>
                  </button>
                ) : (
                  <div className="mt-1 flex items-center justify-between text-[11px] px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900 font-mono">
                    <span className="flex items-center gap-1">
                      <Ambulance size={12} className="text-blue-600" />
                      <span>{emg.assignedAmbulance || 'Ambulance'} En Route</span>
                    </span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">Route Active</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
