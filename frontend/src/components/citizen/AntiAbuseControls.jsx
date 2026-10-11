/**
 * ============================================================================
 * ANTI-ABUSE CONTROLS & ACCOUNT REPUTATION
 * ============================================================================
 * 
 * Required UI Elements:
 * 1. Rate Limits (Hourly & Daily caps with cooldown timers)
 * 2. Duplicate Detection Warnings (150m geofence duplicate alerts)
 * 3. Mechanism to Appeal Restricted Accounts (Interactive form & status)
 * 
 * USER PRIVACY & ACCESS CONTROL:
 * Account standing and appeal mechanisms are shown only after login.
 */

import React, { useState } from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import CitizenAuthGate from './CitizenAuthGate';

export default function AntiAbuseControls() {
  const {
    currentUser,
    isLoggedIn,
    config,
    submitAppeal,
    resetToBaseline,
    verifyReportByHospital,
    pendingVerifications
  } = useCitizenRescue();

  // ── Hooks must always be called before any early return (React Rules of Hooks) ──
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  if (!isLoggedIn || !currentUser) {
    return <CitizenAuthGate />;
  }

  const hourlyLimit = config?.antiAbuseRules?.maxReportsPerHour || 3;
  const dailyLimit = config?.antiAbuseRules?.dailyLimit || 8;
  const geofenceRadius = config?.antiAbuseRules?.duplicateGeofenceRadiusMeters || 150;

  const hourlyUsed = currentUser.hourlyReportsSubmitted || 0;
  const dailyUsed = currentUser.dailyReportsSubmitted || 0;
  const hourlyRemaining = Math.max(0, hourlyLimit - hourlyUsed);

  const isRestricted = currentUser.accountStatus === 'Restricted';
  const isUnderReview = currentUser.accountStatus === 'Under Review';

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    setSubmittingAppeal(true);
    await submitAppeal({
      reason: appealReason,
      additionalEvidence: appealEvidence
    });
    setSubmittingAppeal(false);
    setShowAppealModal(false);
    setAppealReason('');
    setAppealEvidence('');
  };

  const triggerSimulatedFraudFlag = async () => {
    if (pendingVerifications.length > 0) {
      await verifyReportByHospital({
        reportId: pendingVerifications[0].reportId,
        verificationResult: 'FLAG_FRAUDULENT',
        verifierName: 'Dr. Aris Thorne (Chief Triage Officer)',
        hospitalName: 'Victoria Hospital ER',
        notes: 'Simulated audit: Multiple conflicting reports detected with fabricated location tag.'
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* RESTRICTION ALERT BANNER (If Account Restricted or Under Review) */}
      {(isRestricted || isUnderReview) && (
        <div className={`p-6 rounded-2xl border shadow-2xl ${
          isRestricted
            ? 'border-rose-500 bg-gradient-to-r from-rose-950/60 via-brand-card to-brand-surface shadow-rose-900/30'
            : 'border-amber-500 bg-gradient-to-r from-amber-950/50 via-brand-card to-brand-surface shadow-amber-900/30'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isRestricted ? '⛔' : '⏳'}</span>
                <h3 className={`font-display text-base font-bold ${isRestricted ? 'text-rose-400' : 'text-amber-400'}`}>
                  {isRestricted ? 'Account Under Restriction / Flagged' : 'Restriction Appeal Under Board Review'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  HOSPITAL ER TRIAGE FLAG
                </span>
              </div>
              <p className="text-xs text-gray-200">
                Reason: {currentUser.restrictionFlag?.reason || 'Suspected duplicate or unverified incident report flagged by Hospital ER triage.'}
              </p>
              <div className="text-[11px] font-mono text-brand-muted flex items-center gap-3">
                <span>Flagged by: <strong className="text-gray-300">{currentUser.restrictionFlag?.flaggedBy || 'Hospital Intake Officer'}</strong></span>
                <span>•</span>
                <span>Hospital: <strong className="text-gray-300">{currentUser.restrictionFlag?.hospital || 'Emergency Dept'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {isRestricted && (
                <button
                  onClick={() => setShowAppealModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2"
                >
                  <span>📝</span> File Formal Appeal
                </button>
              )}
              <button
                onClick={resetToBaseline}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-brand-surface hover:bg-brand-card text-brand-muted hover:text-gray-200 border border-brand-border transition-all"
              >
                Reset Demo Baseline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Rate Limits & Duplicate Detection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PANEL 1: RATE LIMITS */}
        <div className="p-6 rounded-2xl border border-brand-border bg-brand-card shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-xl">⏱️</span>
                <div>
                  <h4 className="font-display text-sm font-bold text-gray-100">Anti-Spam Rate Limits</h4>
                  <p className="text-[11px] font-mono text-brand-muted">Active for {currentUser.fullName} ({currentUser.citizenId})</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-4 mt-5">
              {/* Hourly Rate Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-300">Hourly Reporting Limit</span>
                  <span className="text-cyan-400 font-bold">{hourlyUsed} / {hourlyLimit} Consumed</span>
                </div>
                <div className="h-2.5 w-full bg-brand-surface rounded-full overflow-hidden border border-brand-border/60">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (hourlyUsed / hourlyLimit) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-brand-muted flex justify-between">
                  <span>{hourlyRemaining} reports remaining this hour</span>
                  <span>Resets in: 28m 40s</span>
                </div>
              </div>

              {/* Daily Cap */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-300">Daily Emergency Assistance Cap</span>
                  <span className="text-emerald-400 font-bold">{dailyUsed} / {dailyLimit} Consumed</span>
                </div>
                <div className="h-2.5 w-full bg-brand-surface rounded-full overflow-hidden border border-brand-border/60">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (dailyUsed / dailyLimit) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-brand-muted flex justify-between">
                  <span>Daily limit prevents flood fatigue</span>
                  <span>Resets at midnight IST</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-brand-surface border border-brand-border/60 text-xs font-mono text-brand-muted flex items-center justify-between">
            <span>Cooldown State:</span>
            <span className="text-emerald-400 font-bold">✓ No active cooldown</span>
          </div>
        </div>

        {/* PANEL 2: DUPLICATE DETECTION WARNINGS */}
        <div className="p-6 rounded-2xl border border-brand-border bg-brand-card shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-xl">📡</span>
                <div>
                  <h4 className="font-display text-sm font-bold text-gray-100">Duplicate Incident Geofence</h4>
                  <p className="text-[11px] font-mono text-brand-muted">Proximity radar & call deduplication</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {geofenceRadius}M RADIUS
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="p-4 rounded-xl border border-brand-border bg-brand-surface/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-gray-100">⚡ Geofence Proximity Rule</span>
                  <span className="text-emerald-400 font-bold">Scanning Active</span>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed font-body">
                  Incidents within {geofenceRadius} meters occurring within 20 minutes are automatically grouped under a single master dispatch.
                  Secondary reports earn 0 points to disincentivize repetitive spamming.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-mono text-amber-200/90 flex items-start gap-2.5">
                <span className="text-amber-400 text-base shrink-0">⚠️</span>
                <div>
                  <strong className="text-amber-300">Duplicate Warning Notice: </strong>
                  Duplicate submissions do not penalize good standing, but award 0 Rescue Impact Points upon hospital triage.
                </div>
              </div>
            </div>
          </div>

          {/* Test controls */}
          <div className="mt-6 pt-3 border-t border-brand-border/60 flex items-center justify-between">
            <span className="text-xs font-mono text-brand-muted">Interactive Demo:</span>
            {!isRestricted ? (
              <button
                onClick={triggerSimulatedFraudFlag}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
              >
                Simulate Fraud Flag & Restriction
              </button>
            ) : (
              <button
                onClick={resetToBaseline}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all"
              >
                Restore Good Standing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* APPEAL MODAL */}
      {showAppealModal && (
        <div className="fixed inset-0 z-[1200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl border border-amber-500/40 bg-brand-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                <h3 className="font-display text-base font-bold text-gray-100">
                  Submit Appeal to Hospital Oversight Board
                </h3>
              </div>
              <button
                onClick={() => setShowAppealModal(false)}
                className="text-brand-muted hover:text-gray-200 text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-brand-muted leading-relaxed font-body">
              Please state why your report was accurate and not fraudulent. Appeals are reviewed by the Chief Medical Registrar and City Emergency Oversight Committee within 24 hours.
            </p>

            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Explanation of Incident & On-Scene Reality:
                </label>
                <textarea
                  required
                  rows="4"
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="e.g., I arrived at the scene before the crowd dispersed. The collision was at Gate 4, not Main Gate. Landmark coordinates provided were genuine..."
                  className="w-full p-3 rounded-xl bg-brand-surface border border-brand-border text-xs font-sans text-gray-100 placeholder-brand-muted focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Additional Corroboration / Witness Details (Optional):
                </label>
                <input
                  type="text"
                  value={appealEvidence}
                  onChange={(e) => setAppealEvidence(e.target.value)}
                  placeholder="e.g., Bystander shopkeeper contact or police beat officer #214"
                  className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-100 placeholder-brand-muted focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-brand-muted hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-5 py-2.5 rounded-xl text-xs font-display font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {submittingAppeal ? 'Submitting...' : 'Submit Official Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
