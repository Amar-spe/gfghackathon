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
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  UserCheck, 
  MapPin, 
  Clock, 
  Check, 
  ArrowLeft,
  FileCheck2,
  Ambulance,
  Scale
} from 'lucide-react';
import { useCitizenRescue } from '../../context/CitizenRescueContext';

export default function HospitalVerificationPortal({ onSwitchToCitizenImpact, initialHospitalName }) {
  const { pendingVerifications, verifyReportByHospital, config, loading } = useCitizenRescue();

  const hospitalsList = [
    { name: 'Victoria Hospital ER', verifier: 'Dr. Aris Thorne (Chief Triage Officer)', badge: 'Level 1 Trauma Hub' },
    { name: 'Bowring & Lady Curzon Hospital', verifier: 'Dr. Kavita Menon (Head of Emergency)', badge: 'Multi-Specialty ER' },
    { name: 'Manipal Hospital HAL', verifier: 'Dr. Rajesh Rao (Lead ER Registrar)', badge: 'Cardiac & Neuro Center' },
    { name: 'Apollo Hospitals Bannerghatta', verifier: 'Dr. Neha Swaminathan (Clinical Director)', badge: 'Super-Specialty Intake' }
  ];

  const matchedHosp = hospitalsList.find(h => initialHospitalName && (h.name.toLowerCase().includes(initialHospitalName.toLowerCase()) || initialHospitalName.toLowerCase().includes(h.name.toLowerCase()))) || hospitalsList[0];

  const [selectedHospital, setSelectedHospital] = useState(matchedHosp.name);
  const [verifierName, setVerifierName] = useState(matchedHosp.verifier);
  const [verificationNotes, setVerificationNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);

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
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Hospital ER Triage & Patient Verification Station
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    INTAKE TERMINAL
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirm logistical accuracy upon physical patient arrival. Points are credited to the citizen dynamically.
                </p>
              </div>
            </div>
          </div>

          {/* Hospital & Staff Switcher */}
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Receiving Facility:</span>
            <div className="flex flex-wrap gap-1.5">
              {hospitalsList.map((h) => (
                <button
                  key={h.name}
                  onClick={() => handleHospitalChange(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedHospital === h.name
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700 font-semibold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{h.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verifier Credentials Badge */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Active Staff:</span>
            <strong className="text-slate-900 dark:text-slate-100">{verifierName}</strong>
            <span className="text-slate-400">({selectedHospital})</span>
          </div>
          {onSwitchToCitizenImpact && (
            <button
              onClick={onSwitchToCitizenImpact}
              className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to ER Bed Telemetry</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending Reports Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-primary-600" />
              Incoming Reports Awaiting ER Verification ({pendingVerifications.length})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review incident details and confirm physical handover before awarding community rescue points.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            Strict: Points award only on physical intake verification
          </div>
        </div>

        {pendingVerifications.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600">
              <Check className="w-6 h-6" />
            </div>
            <h5 className="text-base font-semibold text-slate-800 dark:text-slate-200 font-display">
              All Incoming Reports Have Been Verified
            </h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No pending incident handovers currently waiting in the ER triage queue. You can submit new incident reports from the Citizen Impact view.
            </p>
            <button
              onClick={onSwitchToCitizenImpact}
              className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-sm"
            >
              Go to Citizen Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingVerifications.map((report) => {
              const pointReward = config?.rules?.[report.actionKey]?.points ?? 10;
              const isProcessing = processingId === report.reportId;

              return (
                <div
                  key={report.reportId}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between gap-4"
                >
                  {/* Top Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm font-display">
                            {report.emergencyType} — {report.reportId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                            {report.actionLabel}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Reported by: <strong className="text-slate-800 dark:text-slate-200">{report.citizenName}</strong> ({report.citizenId})</span>
                          <span>•</span>
                          <span>Unit: <strong className="text-slate-800 dark:text-slate-200">{report.ambulanceAssigned}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                        {report.patientIntakeStatus}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Incident Location</span>
                      <p className="text-slate-800 dark:text-slate-200 text-xs mt-1 font-medium">{report.location}</p>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 block font-mono">Geofence: Validated</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Reported Details</span>
                      <p className="text-slate-700 dark:text-slate-300 text-xs mt-1">{report.details}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Reward on Verification</span>
                      <div className="mt-1 flex items-baseline gap-1.5 font-bold text-lg text-emerald-600 dark:text-emerald-400 font-display">
                        <span>+{pointReward}</span>
                        <span className="text-xs font-mono text-emerald-500">RIP</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        Duplicate Risk: {report.duplicateScore}
                      </span>
                    </div>
                  </div>

                  {/* Intake Verification Notes */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                      Hospital ER Verification Intake Notes (Optional):
                    </label>
                    <input
                      type="text"
                      value={verificationNotes[report.reportId] || ''}
                      onChange={(e) => setVerificationNotes({ ...verificationNotes, [report.reportId]: e.target.value })}
                      placeholder="e.g., Patient admitted to Bay 2. Incident coordinates verified by triage."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-mono text-slate-500">
                      Receiving Facility: <strong className="text-slate-800 dark:text-slate-200">{selectedHospital}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={isProcessing}
                        onClick={() => handleVerify(report.reportId, 'VERIFY_VALID')}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Award +{pointReward} RIP</span>
                      </button>

                      <button
                        disabled={isProcessing}
                        onClick={() => handleVerify(report.reportId, 'MARK_DUPLICATE')}
                        className="px-3 py-2 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Duplicate (0 pts)</span>
                      </button>

                      <button
                        disabled={isProcessing}
                        onClick={() => handleVerify(report.reportId, 'FLAG_FRAUDULENT')}
                        className="px-3 py-2 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Flag Fraud</span>
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
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
        <Scale className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 dark:text-slate-200">Hospital Medical Verification Protocol: </strong>
          Emergency clinicians confirm logistical accuracy of reported incident parameters. Under no circumstances are points awarded or withheld based on patient survival, physiological recovery, or clinical outcomes. Emergency triage order remains strictly clinical and independent.
        </div>
      </div>
    </div>
  );
}
