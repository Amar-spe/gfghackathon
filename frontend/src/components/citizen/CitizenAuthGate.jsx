/**
 * ============================================================================
 * CITIZEN AUTHENTICATION GATEWAY
 * ============================================================================
 * 
 * Clean, trustworthy, modern enterprise authentication interface.
 * Deep navy, off-white, restrained emergency red, teal, and amber palette.
 * Professional Lucide icons, consistent spacing, and subtle shadows.
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  UserPlus, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  MapPin, 
  Award,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useCitizenRescue, REGISTERED_CITIZENS } from '../../context/CitizenRescueContext';
import { isSupabaseConfigured } from '../../../lib/supabase';

export default function CitizenAuthGate() {
  const { loginCitizen, registerCitizen } = useCitizenRescue();
  const [authMode, setAuthMode] = useState('demo'); // 'demo' | 'login' | 'register'

  // Custom login state
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regZone, setRegZone] = useState('Koramangala, Bengaluru');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (mode) => {
    setFormError('');
    setAuthMode(mode);
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!loginInput.trim()) {
      setFormError('Please enter your Citizen ID or Email.');
      return;
    }

    setSubmitting(true);
    const result = await loginCitizen(loginInput.trim(), loginPassword);
    setSubmitting(false);

    if (!result || !result.success) {
      setFormError(result?.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!regName.trim()) {
      setFormError('Please enter your full legal name.');
      return;
    }

    if (isSupabaseConfigured && (!regEmail.trim() || !regPassword.trim())) {
      setFormError('Email and Password are required for registered verification.');
      return;
    }

    setSubmitting(true);
    const result = await registerCitizen({
      fullName: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim(),
      communityZone: regZone
    });
    setSubmitting(false);

    if (!result || !result.success) {
      setFormError(result?.error || 'Registration failed. Please try again.');
      return;
    }

    if (result && result.needsConfirmation) {
      setLoginInput(regEmail.trim());
      switchMode('login');
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-6 space-y-6">
      {/* ── Hero Welcome Banner ────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] shadow-sm text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-3">
          <Lock size={12} className="text-teal" />
          <span>Secure Citizen Access Gateway</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          LifeLine AI Citizen Rescue Portal
        </h2>

        <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Personal Rescue Impact Points, earned verification badges, and hospital intake audit records are encrypted and accessible upon verification.
        </p>

        {/* Auth Mode Tabs */}
        <div className="inline-flex p-1 mt-5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => switchMode('demo')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              authMode === 'demo'
                ? 'bg-white dark:bg-[#10243A] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap size={13} className={authMode === 'demo' ? 'text-amber-500' : 'text-slate-400'} />
            <span>1-Click Demo Login</span>
          </button>
          <button
            onClick={() => switchMode('login')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-white dark:bg-[#10243A] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound size={13} className={authMode === 'login' ? 'text-teal' : 'text-slate-400'} />
            <span>Citizen Sign-In</span>
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-white dark:bg-[#10243A] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus size={13} className={authMode === 'register' ? 'text-primary-600' : 'text-slate-400'} />
            <span>Register Volunteer</span>
          </button>
        </div>
      </div>

      {/* ── MODE 1: 1-Click Demo Login ───────────────────────────────── */}
      {authMode === 'demo' && (
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Select verified demonstration profile to view live impact metrics:
            </span>
          </div>

          <div className="max-w-md mx-auto">
            {REGISTERED_CITIZENS.map((cit) => (
              <div
                key={cit.citizenId}
                onClick={() => loginCitizen(cit.citizenId)}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 text-teal flex items-center justify-center font-bold">
                      <UserCheck size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {cit.citizenId}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
                    {cit.fullName}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{cit.handle}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} className="text-teal" />
                    <span>{cit.communityZone}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <span className="text-slate-500">Verified Impact Points:</span>
                    <strong className="text-teal font-bold text-sm">{cit.totalPoints} RIP</strong>
                  </div>
                  <button className="w-full py-2.5 rounded-lg text-xs font-bold bg-teal hover:bg-teal-600 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs">
                    <span>Sign In as {cit.fullName}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODE 2: Custom Sign-In ───────────────────────────────────── */}
      {authMode === 'login' && (
        <div className="max-w-md mx-auto p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-teal" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Citizen Identity Sign-In
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in with your registered email and password, or demo Citizen ID (<code className="font-mono text-teal font-semibold">CIT-8492</code>).
          </p>

          <form onSubmit={handleCustomLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email / Citizen ID:
              </label>
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="you@example.com (or demo: CIT-8492)"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password:
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your account password"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            {formError && (
              <div role="alert" className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg text-xs font-bold bg-teal hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors shadow-xs"
            >
              {submitting ? 'Signing in…' : 'Access Citizen Telemetry'}
            </button>
          </form>
        </div>
      )}

      {/* ── MODE 3: Register New Civic Volunteer ─────────────────────── */}
      {authMode === 'register' && (
        <div className="max-w-md mx-auto p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-teal" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Civic Volunteer Registration
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Join the verified community response grid. Points are credited upon hospital intake validation of emergency assists.
          </p>

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name:</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Sandeep Varma"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email {isSupabaseConfigured ? '' : '(Optional in demo mode)'}:
              </label>
              <input
                type="email"
                required={isSupabaseConfigured}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            {isSupabaseConfigured && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password (min 6 characters):</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (For verification):</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bengaluru Civic Zone:</label>
              <select
                value={regZone}
                onChange={(e) => setRegZone(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <option value="Koramangala, Bengaluru">Koramangala</option>
                <option value="Indiranagar, Bengaluru">Indiranagar</option>
                <option value="Whitefield, Bengaluru">Whitefield</option>
                <option value="Jayanagar, Bengaluru">Jayanagar</option>
                <option value="Electronic City, Bengaluru">Electronic City</option>
                <option value="Central MG Road, Bengaluru">Central MG Road</option>
              </select>
            </div>

            {formError && (
              <div role="alert" className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5">
                <AlertCircle size={13} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg text-xs font-bold bg-teal hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors shadow-xs"
            >
              {submitting ? 'Creating account…' : 'Create Account & Enter Grid'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
