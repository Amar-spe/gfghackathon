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
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Header Controls & Filter Bar */}
      <div className="p-4 rounded-2xl border border-brand-border bg-brand-surface/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Selector */}
          <div className="p-1 rounded-xl bg-brand-card border border-brand-border/80 flex items-center gap-1 mr-2">
            <button
              onClick={() => setScopeFilter('MINE')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                scopeFilter === 'MINE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-brand-muted hover:text-gray-200'
              }`}
            >
              My Records ({auditHistory.filter(h => h.citizenId === currentUser.citizenId).length})
            </button>
            <button
              onClick={() => setScopeFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                scopeFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-brand-muted hover:text-gray-200'
              }`}
            >
              All Community ({auditHistory.length})
            </button>
          </div>

          {/* Category Filter */}
          <span className="text-xs font-mono text-brand-muted uppercase tracking-wider mr-1 hidden lg:inline">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                filterCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-brand-muted hover:text-gray-200 hover:bg-brand-card border border-transparent'
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
            placeholder="Search action, hospital, verifier..."
            className="w-full px-3 py-1.5 pl-8 rounded-xl text-xs font-mono bg-brand-card border border-brand-border text-gray-200 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
          />
          <span className="absolute left-2.5 top-2 text-brand-muted text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1.5 text-brand-muted hover:text-gray-200 text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Audit History Table */}
      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-brand-card shadow-xl">
        <table className="w-full text-left text-xs font-body">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface/90 text-brand-muted font-mono uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Audit ID</th>
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Action Taken</th>
              <th className="py-3.5 px-4">Citizen</th>
              <th className="py-3.5 px-4">Verified By (Hospital Admin)</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Points</th>
              <th className="py-3.5 px-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-brand-muted font-mono">
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
                        isExpanded ? 'bg-cyan-500/10' : 'hover:bg-brand-surface/40'
                      }`}
                    >
                      {/* Audit ID */}
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold whitespace-nowrap">
                        {entry.id}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-gray-300 whitespace-nowrap">
                        <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] text-brand-muted">{new Date(entry.timestamp).toLocaleTimeString()}</div>
                      </td>

                      {/* Action Taken */}
                      <td className="py-3.5 px-4 font-semibold text-gray-100 max-w-xs">
                        <div className="truncate">{entry.actionTaken}</div>
                        <div className="text-[10px] font-mono text-brand-muted">Ref: {entry.reportId} • {entry.category}</div>
                      </td>

                      {/* Citizen */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="text-gray-200 font-bold flex items-center gap-1.5">
                          {entry.citizenName}
                          {isMine && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-brand-muted">{entry.citizenId}</div>
                      </td>

                      {/* Verified By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-gray-200 flex items-center gap-1.5">
                          <span>🏥</span> {entry.verifiedBy}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400/90">{entry.hospital}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isVerified ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            VERIFIED VALID
                          </span>
                        ) : isDuplicate ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            DUPLICATE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            RESTRICTED
                          </span>
                        )}
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-4 text-right font-display text-sm font-bold whitespace-nowrap">
                        {isVerified ? (
                          <span className="text-emerald-400">+{entry.pointsAwarded} RIP</span>
                        ) : isDuplicate ? (
                          <span className="text-brand-muted">0 RIP</span>
                        ) : (
                          <span className="text-rose-400">FLAGGED</span>
                        )}
                      </td>

                      {/* Expand Toggle */}
                      <td className="py-3.5 px-3 text-center text-brand-muted font-mono text-xs">
                        {isExpanded ? '▲' : '▼'}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-brand-surface/70 border-b border-brand-border/60">
                        <td colSpan="8" className="p-4 space-y-2">
                          <div className="p-3.5 rounded-xl bg-brand-card border border-brand-border text-xs font-mono space-y-2 shadow-inner">
                            <div className="flex items-center justify-between text-brand-muted">
                              <span className="font-bold text-gray-300">CLINICAL INTAKE STATEMENT & VERIFIER STAMP</span>
                              <span>Timestamp: {entry.timestamp}</span>
                            </div>
                            <p className="text-gray-100 leading-relaxed font-sans text-xs">
                              "{entry.notes}"
                            </p>
                            <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px] text-brand-muted">
                              <span>Receiving Facility: <strong className="text-cyan-300">{entry.hospital}</strong></span>
                              <span>Staff Signature: <strong className="text-emerald-300">{entry.verifiedBy}</strong></span>
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
      <div className="flex items-center justify-between text-xs font-mono text-brand-muted px-2">
        <span>Showing {filtered.length} verified audit records</span>
        <span className="text-cyan-400 font-bold">Authenticated Citizen: {currentUser.fullName} ({currentUser.totalPoints} RIP)</span>
      </div>
    </div>
  );
}
