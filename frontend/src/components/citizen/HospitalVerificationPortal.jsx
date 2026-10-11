/**
 * ============================================================================
 * HOSPITAL INTAKE & VERIFICATION PORTAL
 * ============================================================================
 * 
 * CORE VERIFICATION BUSINESS LOGIC:
 * "Points must ONLY be awarded to the citizen's account after a 'Hospital' user
 * explicitly verifies the patient report is valid upon receiving the patient."
 * 
 * This component provides the Hospital ER Triage interface where authorized
 * medical intake personnel verify community reports upon physical patient arrival.
 * 
 * CRITICAL SAFETY & ETHICAL NOTE:
 * - Verification confirms report authenticity, location accuracy, and logistics.
 * - NEVER award points based on patient survival or clinical outcomes.
 * - Dispatch priority is completely decoupled from community points.
 */

import React, { useState } from 'react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';

export default function HospitalVerificationPortal({ onSwitchToCitizenImpact }) {
  const { pendingVerifications, verifyReportByHospital, config, loading } = useCitizenRescue();

  const [selectedHospital, setSelectedHospital] = useState('Victoria Hospital ER');
  const [verifierName, setVerifierName] = useState('Dr. Aris Thorne (Chief Triage Officer)');
  const [verificationNotes, setVerificationNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const hospitalsList = [
    { name: 'Victoria Hospital ER', verifier: 'Dr. Aris Thorne (Chief Triage Officer)', badge: 'Level 1 Trauma Hub' },
    { name: 'Bowring & Lady Curzon Hospital', verifier: 'Dr. Kavita Menon (Head of Emergency)', badge: 'Multi-Specialty ER' },
    { name: 'Manipal Hospital HAL', verifier: 'Dr. Rajesh Rao (Lead ER Registrar)', badge: 'Cardiac & Neuro Center' },
    { name: 'Apollo Hospitals Bannerghatta', verifier: 'Dr. Neha Swaminathan (Clinical Director)', badge: 'Super-Specialty Intake' }
  ];

  const handleHospitalChange = (hosp) => {
    setSelectedHospital(hosp.name);
    setVerifierName(hosp.verifier);
  };

  const handleVerify = async (reportId, result) => {
    setProcessingId(reportId);
    const notes = verificationNotes[reportId] || '';

    await verifyReportByHospital({
      reportId,
      verificationResult: result,
      verifierName,
      verifierRole: 'Hospital Emergency Intake Staff',
      hospitalName: selectedHospital,
      notes
    });

    setProcessingId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hospital Intake Station Header */}
      <div className="p-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-brand-card to-brand-surface shadow-xl shadow-emerald-500/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <h3 className="font-display text-base font-bold text-gray-100">
                Hospital ER Triage & Patient Verification Station
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                AUTHORIZED INTAKE TERMINAL
              </span>
            </div>
            <p className="text-xs text-brand-muted">
              Confirm report accuracy upon physical patient arrival. Points are credited to the citizen dynamically per municipal rules.
            </p>
          </div>

          {/* Hospital & Staff Switcher */}
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <span className="text-[10px] font-mono text-brand-muted uppercase">Select Active Hospital Receiving Facility:</span>
            <div className="flex flex-wrap gap-1.5">
              {hospitalsList.map((h) => (
                <button
                  key={h.name}
                  onClick={() => handleHospitalChange(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                    selectedHospital === h.name
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-md shadow-emerald-500/10'
                      : 'bg-brand-surface text-brand-muted hover:text-gray-200 border border-brand-border'
                  }`}
                >
                  <span>🏥</span>
                  <span>{h.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verifier Credentials Badge */}
        <div className="mt-4 pt-3 border-t border-brand-border/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-emerald-400">● Logged In Staff:</span>
            <strong className="text-white">{verifierName}</strong>
            <span className="text-brand-muted">({selectedHospital})</span>
          </div>
          <button
            onClick={onSwitchToCitizenImpact}
            className="text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1 text-xs"
          >
            <span>👤 Return to Citizen Impact View</span>
          </button>
        </div>
      </div>

      {/* Pending Reports Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display text-sm font-bold text-gray-100 flex items-center gap-2">
              <span>📥</span> Incoming Reports Awaiting ER Verification ({pendingVerifications.length})
            </h4>
            <p className="text-xs text-brand-muted mt-0.5">
              Review details and confirm patient intake before awarding points.
            </p>
          </div>
          <div className="text-xs font-mono text-brand-muted">
            Strict Rule: Points ONLY award after explicit hospital triage verification.
          </div>
        </div>

        {pendingVerifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-brand-border bg-brand-card/50 space-y-3">
            <span className="text-4xl">✅</span>
            <h5 className="font-display text-base font-bold text-gray-200">
              All Incoming Reports Have Been Verified!
            </h5>
            <p className="text-xs text-brand-muted max-w-md mx-auto">
              No pending incident handovers currently waiting in the ER triage queue. You can submit new reports from the Citizen Impact tab to test the intake flow again.
            </p>
            <button
              onClick={onSwitchToCitizenImpact}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-display font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-lg shadow-cyan-600/30"
            >
              Go to Citizen Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingVerifications.map((report) => {
              // Dynamic point value from config
              const pointReward = config?.rules?.[report.actionKey]?.points ?? 10;
              const isProcessing = processingId === report.reportId;

              return (
                <div
                  key={report.reportId}
                  className="p-5 rounded-2xl border border-brand-border bg-brand-card hover:border-emerald-500/40 transition-all shadow-lg flex flex-col justify-between gap-4"
                >
                  {/* Top Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-brand-border/70">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-lg">🚨</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-gray-100">
                            {report.emergencyType} — {report.reportId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                            {report.actionLabel}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-brand-muted mt-0.5 flex items-center gap-2">
                          <span>Reported by: <strong className="text-gray-200">{report.citizenName}</strong> ({report.citizenId})</span>
                          <span>•</span>
                          <span>Unit: <strong className="text-amber-300">{report.ambulanceAssigned}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold animate-pulse">
                        📍 {report.patientIntakeStatus}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-brand-surface border border-brand-border/60">
                      <span className="text-[10px] text-brand-muted uppercase">Incident Location</span>
                      <p className="text-gray-200 font-sans text-xs mt-1 font-semibold">{report.location}</p>
                      <span className="text-[10px] text-cyan-400 mt-1 block">GPS Geofence: Valid</span>
                    </div>

                    <div className="p-3 rounded-xl bg-brand-surface border border-brand-border/60">
                      <span className="text-[10px] text-brand-muted uppercase">Reported Details & Action</span>
                      <p className="text-gray-200 font-sans text-xs mt-1">{report.details}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-brand-surface border border-brand-border/60">
                      <span className="text-[10px] text-brand-muted uppercase">Dynamic Reward On Verification</span>
                      <div className="mt-1 flex items-baseline gap-1.5 font-display text-lg font-bold text-emerald-400">
                        <span>+{pointReward}</span>
                        <span className="text-xs font-mono text-emerald-300">RIP</span>
                      </div>
                      <span className="text-[10px] text-brand-muted block mt-0.5">
                        Duplicate Risk: {report.duplicateScore}
                      </span>
                    </div>
                  </div>

                  {/* Intake Verification Notes */}
                  <div>
                    <label className="block text-[11px] font-mono text-brand-muted mb-1">
                      Hospital ER Verification Intake Notes (Optional):
                    </label>
                    <input
                      type="text"
                      value={verificationNotes[report.reportId] || ''}
                      onChange={(e) => setVerificationNotes({ ...verificationNotes, [report.reportId]: e.target.value })}
                      placeholder={`e.g., Patient admitted to Bay 2. Citizen coordinates verified accurate by triage.`}
                      className="w-full px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-mono text-gray-200 placeholder-brand-muted focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-brand-border/70">
                    <div className="text-[11px] font-mono text-brand-muted">
                      Receiving Facility: <strong className="text-gray-300">{selectedHospital}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Button 1: Verify Valid */}
                      <button
                        disabled={isProcessing}
                        onClick={() => handleVerify(report.reportId, 'VERIFY_VALID')}
                        className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span>✓</span>
                        <span>Verify & Award +{pointReward} RIP</span>
                      </button>

                      {/* Button 2: Mark Duplicate */}
                      <button
                        disabled={isProcessing}
                        onClick={() => handleVerify(report.reportId, 'MARK_DUPLICATE')}
                        className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span>⚠</span>
                        <span>Duplicate (0 pts)</span>
                      </button>

                      {/* Button 3: Flag Fraudulent */}
                      <button
                        disabled={isProcessing}
                        onClick={() => handleVerify(report.reportId, 'FLAG_FRAUDULENT')}
                        className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span>⛔</span>
                        <span>Flag Fraud (Restrict)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ethical Protocol Notice */}
      <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs font-mono text-cyan-200/90 flex items-start gap-2.5">
        <span className="text-cyan-400 text-base shrink-0">⚖️</span>
        <div>
          <strong className="text-cyan-300">Hospital Medical Verification Protocol: </strong>
          Emergency clinicians confirm logistical accuracy of reported incident parameters. Under no circumstances are points awarded or withheld based on patient survival, physiological recovery, or clinical outcomes. Emergency triage order remains strictly clinical and independent.
        </div>
      </div>
    </div>
  );
}

