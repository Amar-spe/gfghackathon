/**
 * ============================================================================
 * CITIZEN AUTHENTICATION GATEWAY
 * ============================================================================
 * 
 * Protects personal citizen details, points, badges, and audit history.
 * Displays only after login, per system requirements.
 */

import React, { useState } from 'react';
import { useCitizenRescue, REGISTERED_CITIZENS } from '../../context/CitizenRescueContext';

export default function CitizenAuthGate() {
  const { loginCitizen, registerCitizen, authConfigured } = useCitizenRescue();
  const [authMode, setAuthMode] = useState('demo'); // 'demo' | 'login' | 'register'

  // Custom login state
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regZone, setRegZone] = useState('Koramangala, Bengaluru');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const switchMode = (mode) => {
    setAuthMode(mode);
    setFormError('');
  };

  // Is this one of the built-in demo profiles (Citizen ID / email / name)?
  const isDemoIdentifier = (value) => {
    const v = value.trim().toLowerCase();
    return REGISTERED_CITIZENS.some(
      (c) => c.citizenId.toLowerCase() === v || c.email.toLowerCase() === v || c.fullName.toLowerCase() === v
    );
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    setFormError('');
    const identifier = loginInput.trim();
    if (!identifier) return;

    // Demo profile typed by hand, no password needed
    if (!loginPassword && isDemoIdentifier(identifier)) {
      loginCitizen(identifier);
      return;
    }

    if (!authConfigured) {
      setFormError('Supabase is not configured. Use a demo profile, or add the Supabase keys to frontend/.env.');
      return;
    }
    if (!identifier.includes('@')) {
      setFormError('Enter the email address you registered with.');
      return;
    }
    if (!loginPassword) {
      setFormError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    const result = await loginCitizen(identifier, loginPassword);
    setSubmitting(false);
    if (result && !result.success) {
      setFormError(result.error || 'Sign-in failed.');
    } else {
      setLoginPassword('');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!regName.trim()) return;

    if (authConfigured) {
      if (!regEmail.trim()) {
        setFormError('Email is required to create an account.');
        return;
      }
      if (regPassword.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
    }

    setSubmitting(true);
    const result = await registerCitizen({
      fullName: regName.trim(),
      phone: regPhone.trim(),
      communityZone: regZone,
      email: regEmail.trim(),
      password: authConfigured ? regPassword : undefined
    });
    setSubmitting(false);

    if (result && result.success === false) {
      setFormError(result.error || 'Registration failed.');
      return;
    }
    setRegPassword('');
    if (result && result.needsConfirmation) {
      // Email confirmation is enabled in Supabase: send the user to sign-in
      setLoginInput(regEmail.trim());
      switchMode('login');
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 space-y-8 animate-fade-in-up">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-brand-card to-brand-surface shadow-2xl shadow-cyan-500/10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold mb-4">
          <span>🔒</span> SECURE CITIZEN ACCESS GATEWAY
        </div>

        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-cyan-200 to-emerald-300 tracking-tight">
          LifeLine AI Citizen Rescue Portal
        </h2>

        <p className="max-w-2xl mx-auto text-sm text-brand-muted mt-3 leading-relaxed font-body">
          Personal Rescue Impact Points, earned verification badges, and hospital intake audit logs are encrypted and visible <strong className="text-cyan-300">only after authenticating</strong>.
        </p>

        {/* Auth Mode Tabs */}
        <div className="inline-flex p-1 mt-6 rounded-xl bg-brand-surface border border-brand-border/80">
          <button
            onClick={() => switchMode('demo')}
            className={`px-4 py-2 rounded-lg text-xs font-display font-bold transition-all ${
              authMode === 'demo'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-brand-muted hover:text-gray-200'
            }`}
          >
            ⚡ 1-Click Demo Profiles
          </button>
          <button
            onClick={() => switchMode('login')}
            className={`px-4 py-2 rounded-lg text-xs font-display font-bold transition-all ${
              authMode === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-brand-muted hover:text-gray-200'
            }`}
          >
            🔑 Citizen Sign-In
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`px-4 py-2 rounded-lg text-xs font-display font-bold transition-all ${
              authMode === 'register'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-brand-muted hover:text-gray-200'
            }`}
          >
            📝 Register New Volunteer
          </button>
        </div>
      </div>

      {/* MODE 1: 1-Click Demo Profiles */}
      {authMode === 'demo' && (
        <div className="space-y-4">
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-wider text-brand-muted">
              Select an authorized civic profile to unlock personal impact telemetry:
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REGISTERED_CITIZENS.map((cit) => (
              <div
                key={cit.citizenId}
                onClick={() => loginCitizen(cit.citizenId)}
                className="group relative p-6 rounded-2xl border border-brand-border bg-brand-card hover:border-cyan-400 hover:shadow-cyan/20 hover:shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2.5 rounded-xl bg-brand-surface border border-brand-border group-hover:scale-110 transition-transform">
                      {cit.avatar}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {cit.citizenId}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-base font-bold text-gray-100 group-hover:text-cyan-300 transition-colors">
                    {cit.fullName}
                  </h3>
                  <div className="text-xs text-brand-muted font-mono">{cit.handle}</div>
                  <div className="text-xs text-emerald-400 font-mono mt-1">📍 {cit.communityZone}</div>
                </div>

                <div className="mt-6 pt-4 border-t border-brand-border/60">
                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <span className="text-brand-muted">Verified Points:</span>
                    <strong className="text-cyan-400 font-display text-sm">{cit.totalPoints} RIP</strong>
                  </div>
                  <button className="w-full py-2 rounded-xl text-xs font-display font-bold bg-cyan-600/30 group-hover:bg-cyan-500 text-cyan-200 group-hover:text-slate-950 border border-cyan-500/40 transition-all">
                    Sign In as {cit.fullName.split(' ')[0]} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 2: Custom Sign-In */}
      {authMode === 'login' && (
        <div className="max-w-md mx-auto p-6 rounded-2xl border border-brand-border bg-brand-card shadow-xl space-y-4">
          <h3 className="font-display text-base font-bold text-gray-100 flex items-center gap-2">
            <span>🔑</span> Citizen Identity Sign-In
          </h3>
          <p className="text-xs text-brand-muted">
            Sign in with your registered <strong className="text-cyan-300">email and password</strong>.
            Demo profiles can also be opened with their Citizen ID (e.g. <code className="text-cyan-300">CIT-8492</code>) and no password.
          </p>

          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Email / Citizen ID:
              </label>
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="you@example.com (or demo: CIT-8492)"
                className="w-full p-3 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-100 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Password:
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your account password"
                className="w-full p-3 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {formError && (
              <div role="alert" className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-300">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-xs font-display font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-cyan-600/30"
            >
              {submitting ? 'Signing in…' : 'Unlock Personal Rescue Telemetry'}
            </button>
          </form>
        </div>
      )}

      {/* MODE 3: Register New Civic Volunteer */}
      {authMode === 'register' && (
        <div className="max-w-md mx-auto p-6 rounded-2xl border border-brand-border bg-brand-card shadow-xl space-y-4">
          <h3 className="font-display text-base font-bold text-gray-100 flex items-center gap-2">
            <span>📝</span> Civic Volunteer Registration
          </h3>
          <p className="text-xs text-brand-muted">
            Join the verified community response grid. Points are credited when hospital intake approves emergency assists.
          </p>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Full Legal Name:</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Sandeep Varma"
                className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-sans text-gray-100 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Email{authConfigured ? '' : ' (optional)'}:
              </label>
              <input
                type="email"
                required={authConfigured}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-100 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
              />
            </div>

            {authConfigured && (
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">Password (min 6 characters):</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-100 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Phone Number (For verification):</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-100 placeholder-brand-muted focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Bengaluru Civic Zone:</label>
              <select
                value={regZone}
                onChange={(e) => setRegZone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-gray-100 focus:outline-none focus:border-cyan-400"
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
              <div role="alert" className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-300">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-xs font-display font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-emerald-600/30"
            >
              {submitting ? 'Creating account…' : 'Create Account & Enter Grid'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}