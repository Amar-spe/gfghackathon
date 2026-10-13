import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, ShieldCheck, 
  Building2, Radio, Ambulance, User, LogOut 
} from 'lucide-react';

export default function HamburgerMenu({
  darkMode,
  onDarkModeToggle,
  onNavigate,
  loggedInRoles = {},
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ROLE_ITEMS = [
    {
      key: 'hospital',
      icon: Building2,
      label: 'Hospital ER Portal',
      desc: 'Bed availability & triage',
      badgeColor: 'text-teal bg-teal/10 border-teal/20',
    },
    {
      key: 'dispatch',
      icon: Radio,
      label: 'Dispatcher Console',
      desc: 'Central fleet coordination',
      badgeColor: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    },
    {
      key: 'ambulance',
      icon: Ambulance,
      label: 'Ambulance MDT',
      desc: 'In-cab telemetry & navigation',
      badgeColor: 'text-emergency bg-emergency/10 border-emergency/20',
    },
  ];

  return (
    <div ref={menuRef} className="relative z-[9100]">
      {/* ── Hamburger Trigger Button ─────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Navigation Menu"
        className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
          open
            ? 'bg-primary-50 dark:bg-slate-800 border-primary-300 dark:border-slate-700 text-primary-900 dark:text-slate-100'
            : 'bg-white dark:bg-[#131F33] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* ── Menu Dropdown ────────────────────────────────────────────── */}
      {open && (
        <div className="absolute top-11 right-0 w-72 bg-white dark:bg-[#10243A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Emergency Network Portals
            </span>
            <span className="text-[10px] text-teal font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              Live Online
            </span>
          </div>

          <div className="p-2 space-y-1">
            {/* Citizen Portal (Public) */}
            <button
              onClick={() => { onNavigate('citizen'); setOpen(false); }}
              className="w-full text-left p-2.5 rounded-lg flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 group-hover:bg-primary-50 group-hover:text-primary-700 dark:group-hover:bg-slate-700 transition-colors">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Citizen Portal
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Nearby hospitals & ambulance access
                </div>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Public
              </span>
            </button>

            {/* Role Protected Portals */}
            {ROLE_ITEMS.map(item => {
              const ItemIcon = item.icon;
              const loggedIn = loggedInRoles?.[item.key] || (item.key === 'dispatch' && loggedInRoles?.dispatcher);

              return (
                <div key={item.key} className="flex items-center gap-1 group">
                  <button
                    onClick={() => {
                      if (!loggedIn && (item.key === 'dispatch' || item.key === 'ambulance')) {
                        onNavigate(`login:${item.key}`);
                      } else {
                        onNavigate(item.key);
                      }
                      setOpen(false);
                    }}
                    className="flex-1 text-left p-2.5 rounded-lg flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                      <ItemIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {loggedIn && <ShieldCheck size={12} className="text-teal" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {loggedIn ? loggedIn.name : (item.key === 'dispatch' || item.key === 'ambulance' ? `Login required • ${item.desc}` : item.desc)}
                      </div>
                    </div>
                    {loggedIn ? (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                        Auth
                      </span>
                    ) : (item.key === 'dispatch' || item.key === 'ambulance') ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                        Sign In
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        →
                      </span>
                    )}
                  </button>

                  {loggedIn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLogout(item.key);
                      }}
                      title="Log Out"
                      className="p-2 rounded-lg text-slate-400 hover:text-emergency hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
