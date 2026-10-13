import React, { useState } from 'react';
import { X, Lock, Smartphone, Shield, KeyRound, AlertCircle, ArrowRight, RadioTower } from 'lucide-react';

const ROLE_CONFIG = {
  dispatcher: {
    title: 'Dispatcher Access',
    subtitle: 'Central emergency coordination & fleet control console.',
    badge: 'Operations Command',
    validIds: [
      { id: 'DISP-001', phone: '9845000001', name: 'Arjun Sharma', role: 'Senior Dispatcher' },
      { id: 'DISP-002', phone: '9845000002', name: 'Meena Reddy', role: 'Dispatch Coordinator' },
      { id: 'DISP-003', phone: '9845000003', name: 'Rahul Nair', role: 'Emergency Operator' },
    ]
  },
  hospital: {
    title: 'Hospital Staff Access',
    subtitle: 'ER intake, triage coordination, and capacity telemetry.',
    badge: 'Medical Intake',
    validIds: [
      { id: 'HOSP-M01', phone: '9844001001', name: 'Dr. Rajesh Rao', role: 'Lead ER Registrar', hospitalId: 1, hospitalName: 'Manipal Hospital HAL' },
      { id: 'HOSP-F01', phone: '9844002001', name: 'Dr. Priya Menon', role: 'Triage Head', hospitalId: 2, hospitalName: 'Fortis Hospital Bannerghatta' },
      { id: 'HOSP-A01', phone: '9844003001', name: 'Dr. Vikram Nair', role: 'Chief Medical Officer', hospitalId: 3, hospitalName: 'Apollo Hospitals Bannerghatta' },
      { id: 'HOSP-V01', phone: '9844004001', name: 'Dr. Aris Thorne', role: 'Chief Triage Officer', hospitalId: 4, hospitalName: 'Victoria Hospital ER Complex' },
      { id: 'HOSP-B01', phone: '9844005001', name: 'Dr. Fatima Khan', role: 'ER Department Head', hospitalId: 5, hospitalName: 'Bowring & Lady Curzon Hospital' },
    ]
  },
  ambulance: {
    title: 'Ambulance Crew Access',
    subtitle: 'In-cab mobile data terminal, road navigation & patient status.',
    badge: 'Mobile Unit',
    validIds: [
      { id: 'AMB-M01', phone: '9847001001', name: 'Ravi Kumar', role: 'Driver / Paramedic Lead', unitId: 101, unit: 'MANIPAL-ICU-01' },
      { id: 'AMB-M02', phone: '9847001002', name: 'Suresh Pillai', role: 'ALS Paramedic', unitId: 102, unit: 'MANIPAL-ALS-02' },
      { id: 'AMB-F01', phone: '9847002001', name: 'Mohan Das', role: 'BLS Crew Lead', unitId: 201, unit: 'FORTIS-ICU-01' },
      { id: 'AMB-A01', phone: '9847003001', name: 'Kiran Shetty', role: 'Advanced Paramedic', unitId: 301, unit: 'APOLLO-ICU-01' },
    ]
  }
};
ROLE_CONFIG.dispatch = ROLE_CONFIG.dispatcher;

export default function RoleLoginModal({ role, onSuccess, onClose }) {
  const normRole = role === 'dispatch' ? 'dispatcher' : role;
  const config = ROLE_CONFIG[normRole] || ROLE_CONFIG[role];
  const [staffId, setStaffId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [gpsRequested, setGpsRequested] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);

  if (!config) return null;

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const found = config.validIds.find(
        u => u.id.toUpperCase() === staffId.trim().toUpperCase() &&
             u.phone === phone.replace(/\D/g, '').slice(-10)
      );

      if (found) {
        if (role === 'ambulance') {
          // Require / prompt for real live location access
          setVerifiedUser({ role, ...found });
          setGpsRequested(true);
          setLoading(false);
        } else {
          onSuccess({ role, ...found });
          setLoading(false);
        }
      } else {
        setError('Invalid Staff Badge ID or Phone Number. Please check credentials.');
        setLoading(false);
      }
    }, 600);
  };

  const requestGpsAccess = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by device. Proceeding with standby telemetry.');
      setTimeout(() => {
        if (verifiedUser) onSuccess(verifiedUser);
      }, 1000);
      return;
    }

    setGpsStatus('Requesting high-accuracy device location access...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 50,
          accuracy: Math.round(pos.coords.accuracy),
          active: true,
          unitName: verifiedUser?.unit || 'AMB-101',
          timestamp: Date.now()
        };
        try {
          localStorage.setItem('lifeline_ambulance_live_pos', JSON.stringify(liveCoords));
          window.dispatchEvent(new CustomEvent('lifeline:ambulance-location', { detail: liveCoords }));
        } catch (_) {}
        setGpsStatus(`✓ Location granted (Accuracy: ±${liveCoords.accuracy}m). Launching MDT...`);
        setTimeout(() => {
          onSuccess({ ...verifiedUser, liveCoords });
        }, 700);
      },
      (err) => {
        setGpsStatus(`⚠️ Location permission skipped (${err.message}). Launching MDT...`);
        setTimeout(() => {
          onSuccess(verifiedUser);
        }, 1200);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleQuickDemo = () => {
    const demo = config.validIds[0];
    setStaffId(demo.id);
    setPhone(demo.phone);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#10243A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-modal overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/60 text-primary-800 dark:text-primary-200">
                {config.badge}
              </span>
              <span className="text-xs text-slate-400">• Authenticated Session</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {config.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {config.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {gpsRequested ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/30 text-teal mx-auto flex items-center justify-center">
              <RadioTower className="w-7 h-7 animate-pulse text-teal" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Live GPS Location Authorization
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                LifeLine AI requires real-time device location access. Your live GPS coordinates will be streamed continuously to the Central Dispatcher console and waiting citizens on the tracking map.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-left font-mono space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Assigned Unit:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{verifiedUser?.unit || 'MANIPAL-ICU-01'}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Crew Lead:</span>
                <span className="text-slate-900 dark:text-slate-100">{verifiedUser?.name}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Telemetry Mode:</span>
                <span className="text-teal font-semibold">Real-Time High Precision GPS</span>
              </div>
              {gpsStatus && (
                <div className="pt-2 text-teal font-sans text-[11px] font-semibold border-t border-slate-200 dark:border-slate-800">
                  {gpsStatus}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={requestGpsAccess}
                className="w-full py-2.5 px-4 rounded-lg bg-teal hover:bg-teal-600 text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Authorize & Share Live Location</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => onSuccess(verifiedUser)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium transition-colors"
              >
                Skip / Continue with Simulation Mode
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Staff Badge ID / Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={15} />
                </div>
                <input
                  type="text"
                  value={staffId}
                  onChange={e => setStaffId(e.target.value.toUpperCase())}
                  placeholder={`e.g. ${config.validIds[0].id}`}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Registered Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Smartphone size={15} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-emergency">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading || !staffId.trim() || !phone.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-500 text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Sign In & Access Portal'}</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                Autofill Demo Credentials ({config.validIds[0].id})
              </button>
            </div>
          </form>
        )}

        {/* Demo Reference Hints */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="font-semibold text-slate-600 dark:text-slate-300">Authorized Personnel Roster:</div>
          <div className="space-y-0.5 font-mono text-[10px]">
            {config.validIds.slice(0, 2).map(u => (
              <div key={u.id} className="flex justify-between">
                <span>{u.id} • {u.phone}</span>
                <span className="text-slate-400 font-sans">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
