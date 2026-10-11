/**
 * ============================================================================
 * RECOGNITION BADGES COMPONENT
 * ============================================================================
 * 
 * Visual indicators for verified civic achievements:
 * - "Verified Reporter"
 * - "Community Helper"
 * - "Responder Partner"
 * - "Logistics Vanguard"
 * 
 * USER PRIVACY & ACCESS CONTROL:
 * Earned badges and progress meters are strictly visible only after citizen login.
 */

import React from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import CitizenAuthGate from './CitizenAuthGate';

export default function RecognitionBadges() {
  const { badges, currentUser, isLoggedIn } = useCitizenRescue();

  if (!isLoggedIn || !currentUser) {
    return <CitizenAuthGate />;
  }

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const totalBadges = badges.length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Badges Overview Summary */}
      <div className="p-6 rounded-2xl border border-brand-border bg-gradient-to-r from-brand-card via-brand-surface to-brand-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300">🎖️</span>
            <h3 className="font-display text-base font-bold text-gray-100">Verified Citizen Recognition Badges</h3>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              {unlockedCount} / {totalBadges} UNLOCKED
            </span>
          </div>
          <p className="text-xs text-brand-muted font-body">
            Recognitions are certified solely after hospital ER intake validation. Badges celebrate accuracy, civic responsibility, and community partnership.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-brand-muted bg-brand-surface/90 px-4 py-2.5 rounded-xl border border-brand-border shadow-md">
          <span>Active Citizen:</span>
          <strong className="text-gray-100 font-bold">{currentUser.fullName}</strong>
          <span className="text-cyan-400 font-semibold">({currentUser.citizenId})</span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {badges.map((badge) => {
          const progress = Math.min(100, Math.round((badge.currentCount / badge.requiredCount) * 100));

          return (
            <div
              key={badge.id}
              className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 ${
                badge.isUnlocked
                  ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 via-brand-card to-brand-surface shadow-xl shadow-cyan-500/10 hover:border-cyan-400'
                  : 'border-brand-border/70 bg-brand-card/60 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Top Banner / Unlock Tag */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300 ${
                      badge.isUnlocked
                        ? 'bg-cyan-500/15 border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(0,212,255,0.3)] scale-105'
                        : 'bg-brand-surface border border-brand-border grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-base font-bold text-gray-100">{badge.title}</h4>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${badge.color}15`,
                          color: badge.color,
                          border: `1px solid ${badge.color}40`
                        }}
                      >
                        {badge.tier}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-brand-muted mt-1">
                      {badge.isUnlocked ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span>✓</span> Unlocked {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : 'Active'}
                        </span>
                      ) : (
                        <span className="text-brand-muted flex items-center gap-1">
                          <span>🔒</span> In Progress ({badge.currentCount} / {badge.requiredCount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {badge.isUnlocked ? (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-surface text-brand-muted border border-brand-border">
                      {progress}%
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs text-brand-muted leading-relaxed font-body">
                {badge.description}
              </p>

              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-brand-border/60 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-brand-muted">Hospital Verification Metric</span>
                  <span className={badge.isUnlocked ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                    {badge.currentCount} / {badge.requiredCount} Verified
                  </span>
                </div>
                <div className="h-2.5 w-full bg-brand-surface rounded-full overflow-hidden border border-brand-border/40">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: badge.color,
                      boxShadow: badge.isUnlocked ? `0 0 10px ${badge.color}` : 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ethical Protocol Notice */}
      <div className="p-4 rounded-xl border border-brand-border bg-brand-surface/60 flex items-center justify-between text-xs font-mono text-brand-muted">
        <div className="flex items-center gap-2">
          <span>⚖️</span>
          <span>Badges recognize verified civic assistance. Emergency triage priority is strictly independent.</span>
        </div>
      </div>
    </div>
  );
}
