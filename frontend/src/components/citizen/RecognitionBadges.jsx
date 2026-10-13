import React from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import CitizenAuthGate from './CitizenAuthGate';
import { Award, CheckCircle2, Lock, Shield } from 'lucide-react';

export default function RecognitionBadges() {
  const { badges = [], currentUser, isLoggedIn } = useCitizenRescue();

  if (!isLoggedIn || !currentUser) {
    return <CitizenAuthGate />;
  }

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  return (
    <div className="space-y-4">
      {/* ── Subtitle ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award size={16} className="text-teal" />
            <span>Civic Recognition Milestones</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Awarded exclusively upon verified hospital intake validation.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {unlockedCount} / {badges.length} Unlocked
        </span>
      </div>

      {/* ── Badges Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {badges.map(badge => {
          const progress = Math.min(100, Math.round((badge.currentCount / badge.requiredCount) * 100));

          return (
            <div
              key={badge.badgeId || badge.name}
              className={`p-4 rounded-xl border transition-all ${
                badge.isUnlocked
                  ? 'bg-white dark:bg-[#131F33] border-teal/40 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    badge.isUnlocked ? 'bg-teal/15 text-teal' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {badge.category?.includes('Accuracy') ? (
                      <Shield size={20} />
                    ) : (
                      <Award size={20} />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {badge.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {badge.category}
                    </div>
                  </div>
                </div>

                {badge.isUnlocked ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal/15 text-teal flex items-center gap-1">
                    <CheckCircle2 size={11} /> Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                    <Lock size={10} /> {progress}%
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                {badge.description}
              </p>

              {/* Progress bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Requirement Progress</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {badge.currentCount} / {badge.requiredCount} verified
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${badge.isUnlocked ? 'bg-teal' : 'bg-slate-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
