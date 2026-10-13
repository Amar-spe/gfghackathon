import React from 'react';
import HamburgerMenu from './auth/HamburgerMenu';
import { Shield, Ambulance, Building2, User, Radio, Activity, Sun, Moon } from 'lucide-react';

const PHASE_STATUS = {
  idle:       { label: 'Standby',    color: 'bg-slate-500',   textColor: 'text-slate-400' },
  located:    { label: 'Analyzing',  color: 'bg-amber-500',   textColor: 'text-amber-500' },
  dispatched: { label: 'Dispatching',color: 'bg-primary-500', textColor: 'text-primary-400' },
  enroute:    { label: 'En Route',   color: 'bg-teal',        textColor: 'text-teal' },
  arrived:    { label: 'On Scene',   color: 'bg-teal',        textColor: 'text-teal' },
};

const VIEW_METADATA = {
  citizen:   { icon: User,       label: 'Citizen Portal',  badge: 'Public' },
  dispatch:  { icon: Radio,      label: 'Dispatcher MDT',  badge: 'Control' },
  hospital:  { icon: Building2,  label: 'Hospital ER',     badge: 'Triage' },
  ambulance: { icon: Ambulance,  label: 'Ambulance Cab',   badge: 'Field' },
};

export default function Header({
  phase = 'idle',
  currentTime,
  currentView = 'citizen',
  onNavigate,
  darkMode,
  onDarkModeToggle,
  loggedInRoles,
  onLogout,
}) {
  const status = PHASE_STATUS[phase] || PHASE_STATUS.idle;
  const viewMeta = VIEW_METADATA[currentView] || VIEW_METADATA.citizen;
  const ViewIcon = viewMeta.icon;

  return (
    <header className="h-14 bg-white dark:bg-[#10243A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-5 flex-shrink-0 relative z-50 shadow-sm transition-colors duration-200">
      {/* ── Brand Logo & System Identifier ──────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emergency flex items-center justify-center text-white shadow-sm flex-shrink-0">
          <Activity size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-900 dark:text-slate-50 text-base leading-none">
            <span>LIFELINE</span>
            <span className="text-emergency font-black">AI</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Emergency Response System
          </span>
        </div>
      </div>

      {/* ── Center: Active Workspace Identifier & Operational Status ── */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <ViewIcon size={14} className="text-slate-600 dark:text-slate-300" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {viewMeta.label}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {viewMeta.badge}
          </span>
        </div>

        {/* Operational Status Dot (Only in dispatch console) */}
        {currentView === 'dispatch' && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className={`w-2 h-2 rounded-full ${status.color}`} />
            <span className={`text-[11px] font-medium ${status.textColor}`}>
              {status.label}
            </span>
          </div>
        )}
      </div>

      {/* ── Right: Real-Time Clock & System Navigation Menu ──────────── */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {currentTime || '12:00:00'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Bengaluru Regional Dispatch
          </span>
        </div>

        {/* Header Direct Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={onDarkModeToggle}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-xs cursor-pointer flex items-center justify-center"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? (
            <Moon size={16} className="text-indigo-400" />
          ) : (
            <Sun size={16} className="text-amber-500" />
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        <HamburgerMenu
          darkMode={darkMode}
          onDarkModeToggle={onDarkModeToggle}
          onNavigate={onNavigate}
          loggedInRoles={loggedInRoles}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
