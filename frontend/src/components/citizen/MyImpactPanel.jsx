/**
 * ============================================================================
 * MY IMPACT PANEL — PERSONAL RESCUE IMPACT POINTS
 * ============================================================================
 * 
 * USER PRIVACY & ACCESS CONTROL:
 * User details, points balance, and contributions are strictly displayed
 * ONLY after citizen login.
 * 
 * CRITICAL SAFETY & ETHICAL NOTE:
 * - Points represent verified civic and logistical assistance only.
 * - NEVER award points based on patient survival or clinical outcomes.
 * - Dispatch priority is 100% isolated from citizen reward points.
 */

import React from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import CitizenAuthGate from './CitizenAuthGate';

export default function MyImpactPanel({ onOpenReportModal, onSwitchToHospitalPortal }) {
  const { currentUser, isLoggedIn, config, auditHistory, pendingVerifications } = useCitizenRescue();

  // If not logged in, user details must NOT be displayed
  if (!isLoggedIn || !currentUser) {
    return <CitizenAuthGate />;
  }

  // Dynamic point values from config (NO HARDCODING)
  const reportPoints = config?.rules?.VALID_INCIDENT_REPORT?.points ?? 10;
  const locationPoints = config?.rules?.VERIFIED_LOCATION_CORRECTION?.points ?? 5;
  const taskPoints = config?.rules?.CONFIRMED_AUTHORIZED_RESPONDER_TASK?.points ?? 20;
  const logisticsPoints = config?.rules?.SUCCESSFUL_EMERGENCY_LOGISTICS_TASK?.points ?? 15;

  // Breakdown counts from audit history specifically for this logged-in citizen
  const userAudits = auditHistory.filter(h => h.citizenId === currentUser.citizenId);
  const countReports = userAudits.filter(h => h.actionKey === 'VALID_INCIDENT_REPORT' && h.verificationStatus === 'VERIFIED_VALID').length;
  const countLocations = userAudits.filter(h => h.actionKey === 'VERIFIED_LOCATION_CORRECTION' && h.verificationStatus === 'VERIFIED_VALID').length;
  const countTasks = userAudits.filter(h => h.actionKey === 'CONFIRMED_AUTHORIZED_RESPONDER_TASK' && h.verificationStatus === 'VERIFIED_VALID').length;
  const countLogistics = userAudits.filter(h => h.actionKey === 'SUCCESSFUL_EMERGENCY_LOGISTICS_TASK' && h.verificationStatus === 'VERIFIED_VALID').length;

  // Next level tier calculations
  const nextTierPoints = 120;
  const currentLevel = currentUser.totalPoints >= 100
    ? 'Level 4: Emergency Sentinel'
    : currentUser.totalPoints >= 50
    ? 'Level 3: Community Guardian'
    : 'Level 2: Active Responder';
  const progressPercent = Math.min(100, Math.round((currentUser.totalPoints / nextTierPoints) * 100));

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Top Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Points Display */}
        <div className="relative overflow-hidden p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-brand-card to-brand-surface shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-semibold">
              Total Verified Points
            </span>
            <span className="text-2xl p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300">⚡</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-200">
              {currentUser.totalPoints}
            </span>
            <span className="font-mono text-sm font-bold text-cyan-300">RIP</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-brand-muted font-mono pt-3 border-t border-brand-border/60">
            <span>Verified by Hospital ER Intake</span>
            <span className="text-emerald-400 font-bold">✓ Authenticated</span>
          </div>
        </div>

        {/* Verified Contributions */}
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-brand-card to-brand-surface shadow-2xl shadow-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
              Verified Contributions
            </span>
            <span className="text-2xl p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300">📋</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl lg:text-5xl font-black text-emerald-400">
              {currentUser.verifiedContributions}
            </span>
            <span className="font-mono text-xs text-emerald-300 font-semibold">Field Assists</span>
          </div>
          <div className="mt-3 text-xs text-brand-muted font-mono flex items-center justify-between pt-3 border-t border-brand-border/60">
            <span>Hospital ER Queue:</span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingVerifications.length} Pending
            </span>
          </div>
        </div>

        {/* Account Standing Status */}
        <div className={`p-6 rounded-2xl border shadow-2xl ${
          currentUser.accountStatus === 'Good Standing'
            ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-brand-card to-brand-surface'
            : currentUser.accountStatus === 'Under Review'
            ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-brand-card to-brand-surface'
            : 'border-rose-500/50 bg-gradient-to-br from-rose-950/40 via-brand-card to-brand-surface'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-gray-300 font-semibold">
              Account Standing
            </span>
            <span className="text-2xl">
              {currentUser.accountStatus === 'Good Standing' ? '🛡️' : currentUser.accountStatus === 'Under Review' ? '⏳' : '⛔'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${
              currentUser.accountStatus === 'Good Standing'
                ? 'bg-emerald-400 shadow-[0_0_12px_#00ff88]'
                : currentUser.accountStatus === 'Under Review'
                ? 'bg-amber-400 shadow-[0_0_12px_#ffa500]'
                : 'bg-rose-500 shadow-[0_0_12px_#ff3333]'
            }`} />
            <span className={`font-display text-xl font-bold tracking-wide ${
              currentUser.accountStatus === 'Good Standing'
                ? 'text-emerald-400'
                : currentUser.accountStatus === 'Under Review'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {currentUser.accountStatus}
            </span>
          </div>
          <div className="mt-3 text-xs text-brand-muted font-mono pt-3 border-t border-brand-border/60">
            {currentUser.accountStatus === 'Good Standing'
              ? 'Compliant with rate limits & zero abuse flags'
              : currentUser.accountStatus === 'Under Review'
              ? 'Appeal currently undergoing Hospital Review'
              : 'Restriction active — see Anti-Abuse tab'}
          </div>
        </div>
      </div>

      {/* User Identity & Tier Progression Bar */}
      <div className="p-5 rounded-2xl border border-brand-border bg-brand-surface/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{currentUser.avatar || '👨‍💼'}</span>
            <span className="font-display text-base font-bold text-gray-100">{currentUser.fullName}</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {currentUser.citizenId}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {currentLevel}
            </span>
          </div>
          <p className="text-xs text-brand-muted font-body">
            Zone: <strong className="text-gray-300">{currentUser.communityZone}</strong> • Organization: <strong className="text-gray-300">{currentUser.organization}</strong>
          </p>
        </div>
        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-brand-muted">Next Tier Progression</span>
            <span className="text-cyan-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full bg-brand-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Verified Contribution Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-gray-100 flex items-center gap-2">
              <span>📊</span> Points Contribution Breakdown
            </h3>
            <p className="text-xs text-brand-muted mt-0.5 font-body">
              All point values are fetched dynamically from backend configuration. Points credit solely after hospital patient intake.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onOpenReportModal}
              className="px-3.5 py-2 rounded-xl text-xs font-display font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
            >
              <span>+</span> File Report
            </button>
            <button
              onClick={onSwitchToHospitalPortal}
              className="px-3.5 py-2 rounded-xl text-xs font-display font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 transition-all border border-emerald-500/40 flex items-center gap-1.5"
            >
              <span>🏥</span> Hospital Triage Queue ({pendingVerifications.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Valid Incident Report */}
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card hover:border-cyan-500/40 transition-all">
            <div className="flex items-start justify-between">
              <span className="text-2xl p-2 rounded-lg bg-cyan-500/10 text-cyan-400">🚨</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                +{reportPoints} PTS
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-gray-100">Valid Incident Report</h4>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed font-body">
              Initial accurate coordinates and scene description verified on arrival.
            </p>
            <div className="mt-3 pt-3 border-t border-brand-border/60 flex items-center justify-between font-mono text-xs">
              <span className="text-brand-muted">Verified:</span>
              <span className="font-bold text-cyan-400">{countReports} ({countReports * reportPoints} pts)</span>
            </div>
          </div>

          {/* Card 2: Location Correction */}
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card hover:border-emerald-500/40 transition-all">
            <div className="flex items-start justify-between">
              <span className="text-2xl p-2 rounded-lg bg-emerald-500/10 text-emerald-400">📍</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                +{locationPoints} PTS
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-gray-100">Location Correction</h4>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed font-body">
              Gate entrance, obstruction, or shortcut guidance verified by ambulance driver.
            </p>
            <div className="mt-3 pt-3 border-t border-brand-border/60 flex items-center justify-between font-mono text-xs">
              <span className="text-brand-muted">Verified:</span>
              <span className="font-bold text-emerald-400">{countLocations} ({countLocations * locationPoints} pts)</span>
            </div>
          </div>

          {/* Card 3: Responder Task */}
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card hover:border-amber-500/40 transition-all">
            <div className="flex items-start justify-between">
              <span className="text-2xl p-2 rounded-lg bg-amber-500/10 text-amber-400">🤝</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                +{taskPoints} PTS
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-gray-100">Authorized Field Task</h4>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed font-body">
              Hospital or paramedic-approved bystander task (clearing path, AED guide).
            </p>
            <div className="mt-3 pt-3 border-t border-brand-border/60 flex items-center justify-between font-mono text-xs">
              <span className="text-brand-muted">Verified:</span>
              <span className="font-bold text-amber-400">{countTasks} ({countTasks * taskPoints} pts)</span>
            </div>
          </div>

          {/* Card 4: Emergency Logistics Task */}
          <div className="p-4 rounded-xl border border-brand-border bg-brand-card hover:border-purple-500/40 transition-all">
            <div className="flex items-start justify-between">
              <span className="text-2xl p-2 rounded-lg bg-purple-500/10 text-purple-400">📦</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                +{logisticsPoints} PTS
              </span>
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-gray-100">Emergency Logistics</h4>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed font-body">
              Medical equipment handover, perimeter coordination, or route clearance.
            </p>
            <div className="mt-3 pt-3 border-t border-brand-border/60 flex items-center justify-between font-mono text-xs">
              <span className="text-brand-muted">Verified:</span>
              <span className="font-bold text-purple-400">{countLogistics} ({countLogistics * logisticsPoints} pts)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Isolation Safeguard Note */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs text-cyan-200/90 flex items-start gap-2.5 font-mono">
        <span className="text-base text-cyan-400 shrink-0">🛡️</span>
        <div className="leading-relaxed">
          <strong className="text-cyan-300">Mandatory Ethical Safeguard Directive: </strong>
          Points reward verified civic coordination and logistical accuracy. Points are <span className="text-rose-300 font-bold">NEVER awarded based on patient clinical outcomes or survival</span>. Emergency dispatch and medical care are 100% isolated and protocol-driven.
        </div>
      </div>
    </div>
  );
}
