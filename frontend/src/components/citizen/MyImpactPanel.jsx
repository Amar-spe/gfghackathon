/**
 * ============================================================================
 * MY IMPACT PANEL — PERSONAL CITIZEN INCIDENT REPORT IMPACT
 * ============================================================================
 * 
 * CORE METRICS:
 * 1. Total Real Incident Reports (Verified valid field reports)
 * 2. Total Fake Incident Reports (Flagged / fabricated reports)
 * 3. Recognition Badges (Civic milestones)
 * 4. Audit History Table (Transparent verification log)
 * 
 * Clean, modern, trustworthy design system aligned with deep navy/slate tokens.
 */

import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  ShieldCheck, 
  Clock,
  Award
} from 'lucide-react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import CitizenAuthGate from './CitizenAuthGate';
import RecognitionBadges from './RecognitionBadges';
import AuditHistoryTable from './AuditHistoryTable';

export default function MyImpactPanel({ onOpenReportModal, onSwitchToHospitalPortal }) {
  const { currentUser, isLoggedIn, auditHistory } = useCitizenRescue();

  // If not logged in, user details are guarded
  if (!isLoggedIn || !currentUser) {
    return <CitizenAuthGate />;
  }

  // Audit history filtered for this citizen
  const userAudits = auditHistory.filter(h => h.citizenId === currentUser.citizenId);

  // 1. Total Real Incident Reports
  const verifiedInAudits = userAudits.filter(h =>
    h.verificationStatus === 'VERIFIED_ACCURATE' ||
    h.verificationStatus === 'VERIFIED_VALID' ||
    h.actionKey === 'VALID_INCIDENT_REPORT' ||
    (h.pointsAwarded && h.pointsAwarded > 0)
  ).length;

  const totalRealReports = Math.max(currentUser.verifiedContributions || 0, verifiedInAudits);

  // 2. Total Fake Incident Reports
  const fakeInAudits = userAudits.filter(h =>
    h.verificationStatus === 'FRAUDULENT' ||
    h.verificationStatus === 'REJECTED' ||
    (h.verificationStatus && h.verificationStatus.toLowerCase().includes('fake')) ||
    (h.verificationStatus && h.verificationStatus.toLowerCase().includes('fraud')) ||
    (h.actionTaken && h.actionTaken.toLowerCase().includes('fake')) ||
    (h.actionTaken && h.actionTaken.toLowerCase().includes('fraud'))
  ).length;

  const totalFakeReports = (currentUser.fakeReportsCount || 0) + fakeInAudits;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Key Metrics Cards: Real vs Fake Incident Reports ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Real Incident Reports */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal" />
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Total Real Incident Reports
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {totalRealReports}
              </span>
              <span className="text-xs font-semibold text-teal uppercase tracking-wide">
                Verified Accurate
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Validated by Hospital ER Staff</span>
            <span className="text-teal font-semibold flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>Verified Records</span>
            </span>
          </div>
        </div>

        {/* Total Fake Incident Reports */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  totalFakeReports > 0 ? 'bg-emergency' : 'bg-slate-400'
                }`} />
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Flagged Incident Reports
                </span>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalFakeReports > 0 ? 'bg-red-50 text-emergency dark:bg-red-950/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                <AlertTriangle size={16} />
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-4xl font-bold font-mono ${
                totalFakeReports > 0 ? 'text-emergency' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {totalFakeReports}
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${
                totalFakeReports > 0 ? 'text-emergency' : 'text-slate-400'
              }`}>
                {totalFakeReports > 0 ? 'Flagged Inaccurate' : 'Zero Infractions'}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Monitored by Triage Protocol</span>
            <span className={`font-semibold flex items-center gap-1 ${
              totalFakeReports === 0 ? 'text-teal' : 'text-emergency'
            }`}>
              {totalFakeReports === 0 ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>Good Standing</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={13} />
                  <span>Account Warning</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Recognition Badges Section (Embedded) ────────────────────── */}
      <div className="space-y-3">
        <RecognitionBadges />
      </div>

      {/* ── Audit History Section (Embedded) ─────────────────────────── */}
      <div className="space-y-3">
        <AuditHistoryTable />
      </div>
    </div>
  );
}
