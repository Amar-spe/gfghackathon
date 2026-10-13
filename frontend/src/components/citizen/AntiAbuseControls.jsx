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
 * Clean, modern, trustworthy design system aligned with deep navy/slate tokens.
 */

import React, { useState } from 'react';
import { 
  Clock, 
  Radio, 
  ShieldAlert, 
  AlertTriangle, 
  AlertOctagon,
  FileText, 
  CheckCircle2, 
  X,
  RotateCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';
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
    <div className="flex flex-col gap-6">
      {/* ── RESTRICTION ALERT BANNER (If Account Restricted or Under Review) ── */}
      {(isRestricted || isUnderReview) && (
        <div className={`p-5 rounded-xl border shadow-sm ${
          isRestricted
            ? 'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40'
            : 'border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isRestricted ? (
                  <AlertOctagon className="text-emergency" size={18} />
                ) : (
                  <Clock className="text-amber-500" size={18} />
                )}
                <h3 className={`text-sm font-bold ${isRestricted ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  {isRestricted ? 'Account Under Restriction' : 'Restriction Appeal Under Board Review'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200">
                  Hospital ER Triage Flag
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Reason: {currentUser.restrictionFlag?.reason || 'Suspected duplicate or unverified incident report flagged by Hospital ER triage.'}
              </p>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <span>Flagged by: <strong>{currentUser.restrictionFlag?.flaggedBy || 'Hospital Intake Officer'}</strong></span>
                <span>•</span>
                <span>Facility: <strong>{currentUser.restrictionFlag?.hospital || 'Emergency Dept'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isRestricted && (
                <button
                  onClick={() => setShowAppealModal(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FileText size={13} />
                  <span>File Formal Appeal</span>
                </button>
              )}
              <button
                onClick={resetToBaseline}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grid: Rate Limits & Duplicate Detection ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PANEL 1: RATE LIMITS */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Anti-Spam Rate Limits
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {currentUser.fullName} ({currentUser.citizenId})
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal/10 text-teal border border-teal/20">
                ACTIVE
              </span>
            </div>

            <div className="space-y-4 mt-4">
              {/* Hourly Rate Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-600 dark:text-slate-400">Hourly Reporting Limit</span>
                  <span className="text-teal font-bold">{hourlyUsed} / {hourlyLimit} Consumed</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (hourlyUsed / hourlyLimit) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>{hourlyRemaining} reports remaining this hour</span>
                  <span>Resets in: 28m 40s</span>
                </div>
              </div>

              {/* Daily Cap */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-600 dark:text-slate-400">Daily Assistance Cap</span>
                  <span className="text-primary-600 dark:text-primary-400 font-bold">{dailyUsed} / {dailyLimit} Consumed</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 dark:bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (dailyUsed / dailyLimit) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Daily limit prevents flood fatigue</span>
                  <span>Resets at midnight IST</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Cooldown State:</span>
            <span className="text-teal font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Standby Active</span>
            </span>
          </div>
        </div>

        {/* PANEL 2: DUPLICATE DETECTION WARNINGS */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center">
                  <Radio size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Duplicate Incident Geofence
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Proximity radar & call deduplication
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {geofenceRadius}M RADIUS
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Zap size={12} className="text-teal" />
                    <span>Geofence Proximity Policy</span>
                  </span>
                  <span className="text-teal font-semibold">Active</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Incidents within {geofenceRadius} meters occurring within 20 minutes are grouped under a single master dispatch to prevent duplicate units.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Duplicate Safeguard: </strong>
                  Duplicate submissions do not penalize good standing, but award 0 points upon hospital intake triage.
                </div>
              </div>
            </div>
          </div>

          {/* Test controls */}
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">Interactive Simulation:</span>
            {!isRestricted ? (
              <button
                onClick={triggerSimulatedFraudFlag}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-200 dark:border-red-900 transition-colors"
              >
                Simulate Fraud Flag
              </button>
            ) : (
              <button
                onClick={resetToBaseline}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-teal bg-teal/10 hover:bg-teal/20 border border-teal/20 transition-colors"
              >
                Restore Good Standing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── APPEAL MODAL ─────────────────────────────────────────────── */}
      {showAppealModal && (
        <div className="fixed inset-0 z-[1200] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Submit Appeal to Hospital Oversight Board
                </h3>
              </div>
              <button
                onClick={() => setShowAppealModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Please state why your report was accurate and not fraudulent. Appeals are reviewed by the Chief Medical Registrar and City Emergency Oversight Committee within 24 hours.
            </p>

            <form onSubmit={handleAppealSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation of Incident & On-Scene Reality:
                </label>
                <textarea
                  required
                  rows="4"
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Describe on-scene conditions and genuine incident landmark details..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Corroboration / Witness Details (Optional):
                </label>
                <input
                  type="text"
                  value={appealEvidence}
                  onChange={(e) => setAppealEvidence(e.target.value)}
                  placeholder="e.g. Bystander contact or local beat officer ID"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs disabled:opacity-50"
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
