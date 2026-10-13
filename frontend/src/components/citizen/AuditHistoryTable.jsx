/**
 * ============================================================================
 * AUDIT HISTORY TABLE COMPONENT
 * ============================================================================
 * 
 * Provides an immutable, transparent data table detailing:
 * - Exactly what action was taken
 * - How points were earned (+10, +5, +20, +15, 0)
 * - Who verified it (Hospital Admin / ER Triage Officer)
 * - Timestamp and hospital location
 * 
 * USER PRIVACY & ACCESS CONTROL:
 * Detailed personal audit logs are protected and displayed only after citizen login.
 */

import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Building2, 
  UserCheck, 
  X 
} from 'lucide-react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import CitizenAuthGate from './CitizenAuthGate';

export default function AuditHistoryTable() {
  const { auditHistory, currentUser, isLoggedIn } = useCitizenRescue();

  if (!isLoggedIn || !currentUser) {
    return <CitizenAuthGate />;
  }

  const [scopeFilter, setScopeFilter] = useState('MINE'); // 'MINE' | 'ALL'
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Filter & Search Logic
  const filtered = auditHistory.filter(entry => {
    const matchesScope = scopeFilter === 'ALL' || entry.citizenId === currentUser.citizenId;
    const matchesCategory = filterCategory === 'ALL' || entry.category.toUpperCase() === filterCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      entry.actionTaken.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.verifiedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reportId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesScope && matchesCategory && matchesSearch;
  });

  const categories = ['ALL', 'REPORTING', 'NAVIGATION', 'FIELD ASSIST', 'LOGISTICS', 'DUPLICATE'];

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls & Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Selector */}
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center gap-1 mr-2">
            <button
              onClick={() => setScopeFilter('MINE')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                scopeFilter === 'MINE'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              My Records ({auditHistory.filter(h => h.citizenId === currentUser.citizenId).length})
            </button>
            <button
              onClick={() => setScopeFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                scopeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              All Community ({auditHistory.length})
            </button>
          </div>

          {/* Category Filter */}
          <span className="text-xs text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline font-mono">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                filterCategory === cat
                  ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 border border-primary-200 dark:border-primary-800 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, hospital..."
            className="w-full px-3 py-1.5 pl-8 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Audit History Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-xs font-body">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-mono">
              <th className="py-3 px-4 font-semibold">Audit ID</th>
              <th className="py-3 px-4 font-semibold">Timestamp</th>
              <th className="py-3 px-4 font-semibold">Action Taken</th>
              <th className="py-3 px-4 font-semibold">Citizen</th>
              <th className="py-3 px-4 font-semibold">Verified By</th>
              <th className="py-3 px-4 text-center font-semibold">Status</th>
              <th className="py-3 px-4 text-right font-semibold">Points</th>
              <th className="py-3 px-3 text-center font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-slate-400 font-mono">
                  No verified audit records found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const isExpanded = expandedId === entry.id;
                const isVerified = entry.verificationStatus === 'VERIFIED_VALID';
                const isDuplicate = entry.verificationStatus === 'DUPLICATE_UNVERIFIED';
                const isMine = entry.citizenId === currentUser.citizenId;

                return (
                  <React.Fragment key={entry.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded 
                          ? 'bg-slate-50 dark:bg-slate-800/40' 
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      {/* Audit ID */}
                      <td className="py-3 px-4 font-mono text-primary-600 dark:text-primary-400 font-semibold whitespace-nowrap">
                        {entry.id}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Action Taken */}
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100 max-w-xs">
                        <div className="truncate">{entry.actionTaken}</div>
                        <div className="text-[10px] font-mono text-slate-400">Ref: {entry.reportId} • {entry.category}</div>
                      </td>

                      {/* Citizen */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5">
                          {entry.citizenName}
                          {isMine && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-800">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{entry.citizenId}</div>
                      </td>

                      {/* Verified By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{entry.verifiedBy}</span>
                        </div>
                        <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400">{entry.hospital}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            VERIFIED VALID
                          </span>
                        ) : isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            DUPLICATE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            RESTRICTED
                          </span>
                        )}
                      </td>

                      {/* Points */}
                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                        {isVerified ? (
                          <span className="text-emerald-600 dark:text-emerald-400">+{entry.pointsAwarded} RIP</span>
                        ) : isDuplicate ? (
                          <span className="text-slate-400">0 RIP</span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-mono">FLAGGED</span>
                        )}
                      </td>

                      {/* Expand Toggle */}
                      <td className="py-3 px-3 text-center text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 mx-auto text-slate-600 dark:text-slate-300" />
                        ) : (
                          <ChevronDown className="w-4 h-4 mx-auto" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                        <td colSpan="8" className="p-4">
                          <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                              <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                Clinical Intake Statement & Verifier Stamp
                              </span>
                              <span>Timestamp: {entry.timestamp}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                              "{entry.notes}"
                            </p>
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Receiving Facility: <strong className="text-slate-800 dark:text-slate-200">{entry.hospital}</strong></span>
                              <span>Staff Signature: <strong className="text-teal-600 dark:text-teal-400">{entry.verifiedBy}</strong></span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
        <span>Showing {filtered.length} verified audit records</span>
        <span className="text-primary-600 dark:text-primary-400 font-medium">
          Logged in: {currentUser.fullName} ({currentUser.totalPoints} RIP)
        </span>
      </div>
    </div>
  );
}
