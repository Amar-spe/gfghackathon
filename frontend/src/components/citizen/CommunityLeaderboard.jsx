import React, { useState } from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import { Trophy, Award, MapPin, Building2, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function CommunityLeaderboard() {
  const { leaderboard = [], areaAggregates = [], orgAggregates = [] } = useCitizenRescue();
  const [activeView, setActiveView] = useState('weekly');

  const topUser = leaderboard[0];

  return (
    <div className="space-y-6">
      {/* ── Top Contributor Feature Card ────────────────────────────── */}
      {topUser && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-2xl flex-shrink-0">
              <Trophy size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {topUser.name}
                </span>
                {topUser.isCurrentUser && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal/15 text-teal">
                    You
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">{topUser.handle}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-teal" />
                  <span>{topUser.zone}</span>
                </span>
                <span>•</span>
                <span>{topUser.badge}</span>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Top Verified Assists
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {topUser.verifiedPoints} <span className="text-xs font-normal text-slate-500">Pts</span>
            </div>
          </div>
        </div>
      )}

      {/* ── View Switcher & Table ───────────────────────────────────── */}
      <div className="bg-white dark:bg-[#10243A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'weekly', label: 'Top Contributors', icon: Trophy },
              { id: 'areas',  label: 'Regional Zones',   icon: MapPin },
              { id: 'organizations', label: 'Civic Groups', icon: Building2 },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeView === tab.id
                      ? 'bg-primary-700 text-white dark:bg-primary dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Hospital Validated
          </span>
        </div>

        {/* Weekly Leaderboard View */}
        {activeView === 'weekly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4 text-center">Assists</th>
                  <th className="py-3 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {leaderboard.map(item => (
                  <tr
                    key={item.userId}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      item.isCurrentUser ? 'bg-primary-50/40 dark:bg-slate-800/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      #{item.rank}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</span>
                        {item.isCurrentUser && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal/15 text-teal">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.handle}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {item.zone}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.badge}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {item.verifiedCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal">
                      {item.verifiedPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Regional Zones View */}
        {activeView === 'areas' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {areaAggregates.map(area => (
              <div key={area.zone} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{area.zone}</div>
                  <div className="text-[11px] text-slate-500">{area.activeResponders} active community responders</div>
                </div>
                <div className="text-right font-mono font-bold text-teal">
                  {area.totalPoints} pts
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Organizations View */}
        {activeView === 'organizations' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {orgAggregates.map(org => (
              <div key={org.name} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{org.name}</div>
                  <div className="text-[11px] text-slate-500">{org.membersCount} members verified</div>
                </div>
                <div className="text-right font-mono font-bold text-teal">
                  {org.totalPoints} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
