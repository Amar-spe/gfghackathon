/**
 * ============================================================================
 * CITIZEN DESKTOP DASHBOARD — RESCUE IMPACT POINTS
 * ============================================================================
 * 
 * CORE ARCHITECTURAL & PRIVACY RULES:
 * 1. User's personal details, point balances, and audit history are ONLY
 *    displayed after authentication/login.
 * 2. In the Emergency Nature dropdown, an "Other" option allows entering
 *    any custom emergency.
 * 3. Dynamic verification logic: Points are strictly awarded ONLY after a
 *    Hospital user approves/verifies the patient intake. Nothing is hardcoded.
 * 4. Critical Safety & Ethical Safeguards:
 *    - NEVER award points based on patient survival or clinical outcomes.
 *    - Dispatch priority is 100% isolated from reward points.
 *    - Prominent visible disclaimer displayed at top of dashboard.
 */

import React, { useState } from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';
import MyImpactPanel from './MyImpactPanel';
import CommunityLeaderboard from './CommunityLeaderboard';
import RecognitionBadges from './RecognitionBadges';
import AuditHistoryTable from './AuditHistoryTable';
import AntiAbuseControls from './AntiAbuseControls';
import HospitalVerificationPortal from './HospitalVerificationPortal';
import CitizenAuthGate from './CitizenAuthGate';

export default function CitizenDashboard({ onBackToDispatch }) {
  const {
    currentUser,
    isLoggedIn,
    logoutCitizen,
    config,
    pendingVerifications,
    lastNotification,
    clearNotification,
    submitCitizenReport,
    resetToBaseline,
  } = useCitizenRescue();

  const [activeTab, setActiveTab] = useState('impact'); // 'impact' | 'community' | 'badges' | 'audit' | 'antiAbuse' | 'hospital'
  const [showReportModal, setShowReportModal] = useState(false);

  // Form State for new report
  const [reportActionKey, setReportActionKey] = useState('VALID_INCIDENT_REPORT');
  const [reportEmergencyType, setReportEmergencyType] = useState('Road Collision');
  const [customEmergencyText, setCustomEmergencyText] = useState('');
  const [reportLocation, setReportLocation] = useState('Koramangala Sony World Signal');
  const [reportDetails, setReportDetails] = useState('');
  const [reportHospital, setReportHospital] = useState('Victoria Hospital ER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateReport = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      alert('Please sign in or select a citizen profile to submit reports and earn points.');
      return;
    }

    const finalEmergencyType = reportEmergencyType === 'Other'
      ? (customEmergencyText.trim() || 'Custom Emergency')
      : reportEmergencyType;

    setIsSubmitting(true);
    await submitCitizenReport({
      actionKey: reportActionKey,
      emergencyType: finalEmergencyType,
      location: reportLocation,
      details: reportDetails,
      receivingHospital: reportHospital
    });
    setIsSubmitting(false);
    setShowReportModal(false);
    setReportDetails('');
    setCustomEmergencyText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-brand-bg text-brand-text font-body">
      {/* ── Toast Notification Banner ──────────────────────────────── */}
      {lastNotification && (
        <div className={`px-4 py-2.5 text-xs font-mono flex items-center justify-between border-b transition-all ${
          lastNotification.type === 'success'
            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
            : lastNotification.type === 'danger'
            ? 'bg-rose-950/80 text-rose-200 border-rose-500/40'
            : lastNotification.type === 'warning'
            ? 'bg-amber-950/80 text-amber-200 border-amber-500/40'
            : 'bg-cyan-950/80 text-cyan-200 border-cyan-500/40'
        }`}>
          <div className="flex items-center gap-2">
            <span>
              {lastNotification.type === 'success' ? '⚡' : lastNotification.type === 'danger' ? '⛔' : lastNotification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{lastNotification.message}</span>
          </div>
          <button
            onClick={clearNotification}
            className="text-gray-400 hover:text-white font-mono text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Top Bar / Desktop Header ───────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-b border-brand-border bg-gradient-to-r from-brand-surface via-brand-card to-brand-surface flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        {/* Left: Identity & Access Gate */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center text-2xl shadow-cyan/30 shadow-lg border border-cyan-400/30">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-lg font-black tracking-wide text-gray-100">
                CITIZEN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">IMPACT PORTAL</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                RESCUE IMPACT POINTS v{config.version}
              </span>
            </div>

            {/* User Details — Displayed ONLY if logged in */}
            {isLoggedIn && currentUser ? (
              <div className="text-xs font-mono text-brand-muted mt-0.5 flex flex-wrap items-center gap-2">
                <span className="text-gray-100 font-bold">{currentUser.fullName}</span>
                <span>•</span>
                <span className="text-cyan-400 font-bold">{currentUser.citizenId}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">📍 {currentUser.communityZone}</span>
              </div>
            ) : (
              <div className="text-xs font-mono text-amber-400/90 mt-0.5 flex items-center gap-1.5">
                <span>🔒</span>
                <span>User details protected — Sign in below to access personal points & telemetry</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Metrics & Quick Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* User Logged In Pills */}
          {isLoggedIn && currentUser ? (
            <>
              {/* Quick Points Pill */}
              <div className="px-3.5 py-1.5 rounded-xl bg-brand-surface/90 border border-cyan-500/40 shadow-cyan/10 shadow-md flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <div>
                  <div className="text-[10px] font-mono text-brand-muted uppercase">Verified Points</div>
                  <div className="font-display text-base font-bold text-cyan-400 leading-none">
                    {currentUser.totalPoints} <span className="text-[10px] text-cyan-300 font-mono">RIP</span>
                  </div>
                </div>
              </div>

              {/* Account Status Pill */}
              <div className="px-3 py-1.5 rounded-xl bg-brand-surface/90 border border-brand-border flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  currentUser.accountStatus === 'Good Standing' ? 'bg-emerald-400 shadow-[0_0_8px_#00ff88]' : currentUser.accountStatus === 'Under Review' ? 'bg-amber-400' : 'bg-rose-500 shadow-[0_0_8px_#ff3333]'
                }`} />
                <div>
                  <div className="text-[10px] font-mono text-brand-muted uppercase">Account Status</div>
                  <div className={`font-mono text-xs font-bold leading-none ${
                    currentUser.accountStatus === 'Good Standing' ? 'text-emerald-400' : currentUser.accountStatus === 'Under Review' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {currentUser.accountStatus}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logoutCitizen}
                title="Sign out of citizen account"
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-brand-muted hover:text-rose-300 bg-brand-surface hover:bg-rose-950/30 border border-brand-border hover:border-rose-500/40 transition-all flex items-center gap-1.5"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('impact')}
              className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-cyan-600/30 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 transition-all flex items-center gap-1.5"
            >
              <span>🔑</span>
              <span>Citizen Sign-In</span>
            </button>
          )}

          {/* Action Button: File Report */}
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
          >
            <span>+</span>
            <span>File Community Report</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={resetToBaseline}
            title="Reset demo baseline"
            className="p-2 rounded-xl bg-brand-surface hover:bg-brand-card text-brand-muted hover:text-gray-200 border border-brand-border text-xs font-mono transition-all"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── MANDATORY ETHICAL & CLINICAL SAFETY DISCLAIMER BANNER ─── */}
      <div className="shrink-0 px-6 py-2.5 bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-blue-950/40 border-b border-cyan-500/30 flex items-start sm:items-center gap-3 text-xs font-mono text-cyan-100">
        <span className="text-cyan-400 text-lg shrink-0">⚖️</span>
        <div className="flex-1 text-[11px] leading-tight">
          <strong className="text-cyan-300">CRITICAL SAFETY & ETHICAL SAFEGUARD: </strong>
          Rescue Impact Points are awarded strictly for timely, verified logistical information upon hospital intake.
          Points are <strong className="text-rose-300">NEVER awarded based on patient survival or clinical outcomes</strong>.
          Emergency dispatch priorities and triage tiers are strictly determined by medical necessity and AI clinical protocols, completely isolated from this reward system.
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-3 border-b border-brand-border bg-brand-surface/50 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('impact')}
            className={`px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'impact'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-brand-muted hover:text-gray-200 hover:bg-brand-card/50'
            }`}
          >
            <span>📊</span> My Impact {(!isLoggedIn || !currentUser) && <span className="text-[10px]">🔒</span>}
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'community'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-brand-muted hover:text-gray-200 hover:bg-brand-card/50'
            }`}
          >
            <span>🏆</span> Community & Leaderboard
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-brand-muted hover:text-gray-200 hover:bg-brand-card/50'
            }`}
          >
            <span>🎖️</span> Recognition Badges {(!isLoggedIn || !currentUser) && <span className="text-[10px]">🔒</span>}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-brand-muted hover:text-gray-200 hover:bg-brand-card/50'
            }`}
          >
            <span>📜</span> Audit History {(!isLoggedIn || !currentUser) && <span className="text-[10px]">🔒</span>}
          </button>

          <button
            onClick={() => setActiveTab('antiAbuse')}
            className={`px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'antiAbuse'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-brand-muted hover:text-gray-200 hover:bg-brand-card/50'
            }`}
          >
            <span>🛡️</span> Anti-Abuse Controls {(!isLoggedIn || !currentUser) && <span className="text-[10px]">🔒</span>}
          </button>

          {/* Hospital Verification Station Tab */}
          <button
            onClick={() => setActiveTab('hospital')}
            className={`px-4 py-2.5 font-display text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'hospital'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/15'
                : 'border-transparent text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <span>🏥</span> Hospital Intake Triage
            {pendingVerifications.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                {pendingVerifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Back to Dispatch link */}
        {onBackToDispatch && (
          <button
            onClick={onBackToDispatch}
            className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/10 transition-all"
          >
            <span>🚨 Live Dispatch Map</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* ── Main Content Body ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* My Impact Panel (Guarded by Login) */}
          {activeTab === 'impact' && (
            <MyImpactPanel
              onOpenReportModal={() => setShowReportModal(true)}
              onSwitchToHospitalPortal={() => setActiveTab('hospital')}
            />
          )}

          {/* Community Leaderboard (Public city aggregates) */}
          {activeTab === 'community' && <CommunityLeaderboard />}

          {/* Badges (Guarded by Login) */}
          {activeTab === 'badges' && (
            isLoggedIn && currentUser ? <RecognitionBadges /> : <CitizenAuthGate />
          )}

          {/* Audit History (Guarded by Login) */}
          {activeTab === 'audit' && (
            isLoggedIn && currentUser ? <AuditHistoryTable /> : <CitizenAuthGate />
          )}

          {/* Anti-Abuse (Guarded by Login) */}
          {activeTab === 'antiAbuse' && (
            isLoggedIn && currentUser ? <AntiAbuseControls /> : <CitizenAuthGate />
          )}

          {/* Hospital Verification Terminal */}
          {activeTab === 'hospital' && (
            <HospitalVerificationPortal
              onSwitchToCitizenImpact={() => setActiveTab('impact')}
            />
          )}
        </div>
      </div>

      {/* ── NEW REPORT SUBMISSION MODAL WITH "OTHER" OPTION ─────────── */}
      {showReportModal && (
        <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-3xl border border-cyan-500/40 bg-brand-card p-6 shadow-2xl space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400">🚨</span>
                <div>
                  <h3 className="font-display text-base font-bold text-gray-100">
                    File Community Incident / Assist Report
                  </h3>
                  <p className="text-[11px] font-mono text-cyan-400">
                    {isLoggedIn && currentUser ? `Reporter: ${currentUser.fullName} (${currentUser.citizenId})` : '⚠️ Please sign in first'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-brand-muted hover:text-gray-200 text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-brand-muted font-body leading-relaxed">
              Points are <strong className="text-emerald-400">never hardcoded</strong> and will only be awarded once Hospital ER Triage validates the patient report upon ambulance arrival.
            </p>

            <form onSubmit={handleCreateReport} className="space-y-3.5">
              {/* Assistance Category */}
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Assistance Category (Dynamic Reward):
                </label>
                <select
                  value={reportActionKey}
                  onChange={(e) => setReportActionKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="VALID_INCIDENT_REPORT">
                    Valid Incident Report (+{config.rules?.VALID_INCIDENT_REPORT?.points || 10} RIP)
                  </option>
                  <option value="VERIFIED_LOCATION_CORRECTION">
                    Location Correction / Landmark (+{config.rules?.VERIFIED_LOCATION_CORRECTION?.points || 5} RIP)
                  </option>
                  <option value="CONFIRMED_AUTHORIZED_RESPONDER_TASK">
                    Authorized Field Task Assist (+{config.rules?.CONFIRMED_AUTHORIZED_RESPONDER_TASK?.points || 20} RIP)
                  </option>
                  <option value="SUCCESSFUL_EMERGENCY_LOGISTICS_TASK">
                    Emergency Logistics Task (+{config.rules?.SUCCESSFUL_EMERGENCY_LOGISTICS_TASK?.points || 15} RIP)
                  </option>
                </select>
              </div>

              {/* Emergency Nature Dropdown WITH "OTHER" OPTION */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Emergency Nature:
                  </label>
                  <select
                    value={reportEmergencyType}
                    onChange={(e) => setReportEmergencyType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Road Collision">Road Collision</option>
                    <option value="Cardiac Arrest">Cardiac Arrest</option>
                    <option value="Severe Trauma">Severe Trauma</option>
                    <option value="Pedestrian Injury">Pedestrian Injury</option>
                    <option value="Respiratory Distress">Respiratory Distress</option>
                    <option value="Fire / Hazard Rescue">Fire / Hazard Rescue</option>
                    <option value="Other">Other (Custom Emergency)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Receiving Hospital:
                  </label>
                  <select
                    value={reportHospital}
                    onChange={(e) => setReportHospital(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Victoria Hospital ER">Victoria Hospital ER</option>
                    <option value="Bowring & Lady Curzon Hospital">Bowring & Lady Curzon</option>
                    <option value="Manipal Hospital HAL">Manipal Hospital HAL</option>
                    <option value="Apollo Hospitals Bannerghatta">Apollo Hospitals</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC TEXT FIELD IF "OTHER" IS SELECTED */}
              {reportEmergencyType === 'Other' && (
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-1 animate-fade-in-up">
                  <label className="block text-xs font-mono text-cyan-300 font-bold">
                    Specify Custom Emergency Nature:
                  </label>
                  <input
                    type="text"
                    required
                    value={customEmergencyText}
                    onChange={(e) => setCustomEmergencyText(e.target.value)}
                    placeholder="e.g. Electric Shock, Structural Collapse, Hazmat Exposure, Severe Burns..."
                    className="w-full p-2.5 rounded-xl bg-brand-card border border-brand-border text-xs font-body text-gray-100 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Precise Location / Landmark:
                </label>
                <input
                  type="text"
                  required
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="e.g. 100ft Road, Near Sony World Junction, Koramangala"
                  className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-sans text-gray-100 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Observation & Civic Action Taken:
                </label>
                <textarea
                  required
                  rows="3"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="e.g., Bystander initiated CPR. Cleared ambulance approach route and confirmed patient status."
                  className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-sans text-gray-100 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-brand-muted hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isLoggedIn}
                  className="px-5 py-2.5 rounded-xl text-xs font-display font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-lg shadow-cyan-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : !isLoggedIn ? 'Sign In Required' : 'Submit for Hospital ER Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
