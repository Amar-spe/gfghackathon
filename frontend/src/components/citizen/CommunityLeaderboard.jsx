/**
 * ============================================================================
 * COMMUNITY IMPACT & LEADERBOARD COMPONENT
 * ============================================================================
 * 
 * Displays:
 * 1. Weekly Leaderboard highlighting the user with the highest verified points.
 * 2. Aggregate community contributions by Area / Zone in Bengaluru.
 * 3. Aggregate community contributions by Civic Organization.
 * 
 * Safety & Ethical Rule:
 * All rankings reflect logistical accuracy and verified assists.
 * Zero correlation to medical outcomes or patient triage.
 */

import React, { useState } from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';

export default function CommunityLeaderboard() {
  const { leaderboard, areaAggregates, orgAggregates } = useCitizenRescue();
  const [activeView, setActiveView] = useState('weekly'); // 'weekly' | 'areas' | 'organizations'

  // Top user with the highest verified points
  const topUser = leaderboard[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Champion Hero Banner */}
      {topUser && (
        <div className="relative overflow-hidden p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-brand-card to-brand-surface shadow-xl shadow-amber-500/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                  {topUser.avatar || '👑'}
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-display font-black text-[10px] tracking-wider uppercase shadow-md">
                  #1 LEADER
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-gray-100">{topUser.name}</span>
                  {topUser.isCurrentUser && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      YOU
                    </span>
                  )}
                  <span className="text-xs text-brand-muted font-mono">{topUser.handle}</span>
                </div>
                <p className="text-xs text-amber-300 font-mono mt-0.5 flex items-center gap-2">
                  <span>📍 {topUser.zone}</span>
                  <span>•</span>
                  <span>🎖️ {topUser.badge}</span>
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs font-mono">
                  <span className="text-brand-muted">Verified Assists: <strong className="text-gray-200">{topUser.verifiedCount}</strong></span>
                  <span className="text-brand-muted">•</span>
                  <span className="text-emerald-400 font-bold">{topUser.trend}</span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right p-3.5 rounded-xl bg-brand-surface/80 border border-amber-500/30">
              <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">
                WEEKLY TOP VERIFIED IMPACT
              </div>
              <div className="font-display text-3xl md:text-4xl font-black text-amber-400 flex items-baseline md:justify-end gap-1.5 mt-0.5">
                <span>{topUser.verifiedPoints}</span>
                <span className="text-xs font-mono text-amber-300">RIP</span>
              </div>
              <div className="text-[11px] font-mono text-brand-muted mt-1">
                Hospital ER Intake Validated
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-brand-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('weekly')}
            className={`px-4 py-2 rounded-lg font-display text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'weekly'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                : 'text-brand-muted hover:text-gray-200 hover:bg-brand-surface'
            }`}
          >
            <span>🏆</span> Weekly Top Contributors
          </button>
          <button
            onClick={() => setActiveView('areas')}
            className={`px-4 py-2 rounded-lg font-display text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'areas'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                : 'text-brand-muted hover:text-gray-200 hover:bg-brand-surface'
            }`}
          >
            <span>🗺️</span> Aggregate by Area (Bangalore Zones)
          </button>
          <button
            onClick={() => setActiveView('organizations')}
            className={`px-4 py-2 rounded-lg font-display text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'organizations'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                : 'text-brand-muted hover:text-gray-200 hover:bg-brand-surface'
            }`}
          >
            <span>🏢</span> Aggregate by Organization
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-brand-muted font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Synchronized with City Triage Hub</span>
        </div>
      </div>

      {/* VIEW 1: Weekly Top Contributors Leaderboard */}
      {activeView === 'weekly' && (
        <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-card shadow-lg">
          <table className="w-full text-left text-xs font-body">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface/80 text-brand-muted font-mono uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Citizen Contributor</th>
                <th className="py-3.5 px-4">Community Zone</th>
                <th className="py-3.5 px-4">Recognition Title</th>
                <th className="py-3.5 px-4 text-center">Verified Assists</th>
                <th className="py-3.5 px-4 text-right">Verified Points</th>
                <th className="py-3.5 px-4 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {leaderboard.map((item) => (
                <tr
                  key={item.userId}
                  className={`transition-colors ${
                    item.isCurrentUser
                      ? 'bg-cyan-500/10 hover:bg-cyan-500/15 font-semibold'
                      : 'hover:bg-brand-surface/40'
                  }`}
                >
                  <td className="py-3.5 px-4 font-display">
                    {item.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                        1
                      </span>
                    ) : item.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs">
                        2
                      </span>
                    ) : item.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs">
                        3
                      </span>
                    ) : (
                      <span className="font-mono text-brand-muted pl-2">#{item.rank}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center text-base">
                        {item.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-gray-200">
                          {item.name}
                          {item.isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-brand-muted">{item.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-300">
                    {item.zone}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-brand-surface border border-brand-border text-amber-300">
                      {item.badge}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-200">
                    {item.verifiedCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-display text-sm font-bold text-cyan-400">
                    {item.verifiedPoints} <span className="text-[10px] font-mono text-cyan-500">RIP</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs">
                    <span className={item.trend.includes('▲') ? 'text-emerald-400' : 'text-brand-muted'}>
                      {item.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: Aggregate by Area */}
      {activeView === 'areas' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-brand-border bg-brand-surface/60 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-300">
              🌆 Regional Breakdown: Active citizen incident reporting & location coordination across Bengaluru zones.
            </span>
            <span className="text-cyan-400 font-bold">Total Zones Monitored: {areaAggregates.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areaAggregates.map((area, idx) => (
              <div
                key={area.area}
                className="p-4 rounded-xl border border-brand-border bg-brand-card hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-gray-100 flex items-center gap-1.5">
                      <span>📍</span> {area.area}
                    </span>
                    <span className="font-mono text-xs text-brand-muted">Zone #{idx + 1}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="p-2.5 rounded-lg bg-brand-surface border border-brand-border/60">
                      <div className="text-[10px] font-mono text-brand-muted uppercase">Verified Points</div>
                      <div className="font-display text-lg font-bold text-cyan-400 mt-0.5">{area.pointsGenerated}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-brand-surface border border-brand-border/60">
                      <div className="text-[10px] font-mono text-brand-muted uppercase">Verified Assists</div>
                      <div className="font-display text-lg font-bold text-emerald-400 mt-0.5">{area.verifiedAssists}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs font-mono text-brand-muted">
                  <span>👥 Active Civilians: <strong className="text-gray-200">{area.activeVolunteers}</strong></span>
                  <span>⏱️ Avg Triage: <strong className="text-amber-300">{area.avgVerifyTimeMin}m</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: Aggregate by Organization */}
      {activeView === 'organizations' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-brand-border bg-brand-surface/60 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-300">
              🤝 Partner Civic Units: Registered volunteer groups coordinating first-aid, CPR guidance, and pathway access.
            </span>
            <span className="text-emerald-400 font-bold">Registered Corps: {orgAggregates.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgAggregates.map((org) => (
              <div
                key={org.org}
                className="p-5 rounded-xl border border-brand-border bg-brand-card hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-gray-100 flex items-center gap-2">
                      <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">🛡️</span>
                      {org.org}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {org.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2.5 rounded-lg bg-brand-surface border border-brand-border/60">
                      <div className="text-[10px] font-mono text-brand-muted uppercase">Volunteers</div>
                      <div className="font-display text-base font-bold text-gray-200 mt-0.5">{org.members}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-brand-surface border border-brand-border/60">
                      <div className="text-[10px] font-mono text-brand-muted uppercase">Verified Tasks</div>
                      <div className="font-display text-base font-bold text-emerald-400 mt-0.5">{org.verifiedTasks}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-brand-surface border border-brand-border/60">
                      <div className="text-[10px] font-mono text-brand-muted uppercase">Total Points</div>
                      <div className="font-display text-base font-bold text-cyan-400 mt-0.5">{org.verifiedPoints}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-border/60 text-xs font-mono text-brand-muted flex items-center justify-between">
                  <span>Hospital ER Intake Verified</span>
                  <span className="text-emerald-400 font-bold">Active in Field</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

