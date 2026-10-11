import React from 'react';
import { useCitizenRescue } from '../context/CitizenRescueContext';

const PHASE_STATUS = {
  idle:       { label: 'STANDBY',    color: '#4a7090', dot: '#4a7090' },
  located:    { label: 'ANALYZING',  color: '#ffa500', dot: '#ffa500' },
  dispatched: { label: 'DISPATCHING',color: '#00d4ff', dot: '#00d4ff' },
  enroute:    { label: 'EN ROUTE',   color: '#00ff88', dot: '#00ff88' },
  arrived:    { label: 'ARRIVED',    color: '#00ff88', dot: '#00ff88' },
};

export default function Header({
  phase,
  currentTime,
  onMenuToggle,
  currentView = 'dispatch',
  onViewChange = () => {}
}) {
  const status = PHASE_STATUS[phase] || PHASE_STATUS.idle;
  const { currentUser, pendingVerifications } = useCitizenRescue();

  return (
    <header style={{
      height: 56,
      background: 'linear-gradient(90deg, #040c18 0%, #071525 50%, #040c18 100%)',
      borderBottom: '1px solid #0f3060',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px',
      boxShadow: '0 2px 20px rgba(0,212,255,0.08)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 100,
    }}>
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-[#0f3060] bg-[#071525] text-[#4a7090] mr-2 shrink-0"
        style={{ fontSize: 18 }}
      >☰</button>

      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, flexShrink: 0,
          background: 'linear-gradient(135deg, #ff3333, #cc0000)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          boxShadow: '0 0 15px rgba(255,51,51,0.4)',
        }}>🚑</div>
        <div className="hidden sm:block">
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15, fontWeight: 800,
            color: '#c8e0f4',
            letterSpacing: '0.12em',
            lineHeight: 1.1,
          }}>
            LIFELINE <span style={{ color: '#00d4ff' }}>AI</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8, color: '#4a7090',
            letterSpacing: '0.12em',
          }}>SMART EMERGENCY RESPONSE</div>
        </div>
      </div>

      {/* Center: View Navigation Switcher & Dispatch Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* View Switcher Pills */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(7,21,37,0.85)',
          padding: '3px 4px',
          borderRadius: 8,
          border: '1px solid #0f3060',
        }}>
          {/* View 1: Dispatch */}
          <button
            onClick={() => onViewChange('dispatch')}
            style={{
              padding: '4px 10px', borderRadius: 6,
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em',
              border: currentView === 'dispatch' ? '1px solid #00d4ff66' : '1px solid transparent',
              background: currentView === 'dispatch' ? 'rgba(0,212,255,0.18)' : 'transparent',
              color: currentView === 'dispatch' ? '#00d4ff' : '#4a7090',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>🚨</span>
            <span className="hidden md:inline">DISPATCH</span>
          </button>

          {/* View 2: Citizen Impact */}
          <button
            onClick={() => onViewChange('citizen')}
            style={{
              padding: '4px 10px', borderRadius: 6,
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em',
              border: currentView === 'citizen' ? '1px solid #00ff8866' : '1px solid transparent',
              background: currentView === 'citizen' ? 'rgba(0,255,136,0.18)' : 'transparent',
              color: currentView === 'citizen' ? '#00ff88' : '#4a7090',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>👤</span>
            <span className="hidden md:inline">
              {currentUser ? currentUser.fullName.split(' ')[0] : 'CITIZEN'}
            </span>
            <span style={{
              fontSize: 9, fontFamily: 'var(--font-mono)',
              padding: '1px 5px', borderRadius: 4,
              background: currentUser ? 'rgba(0,255,136,0.2)' : 'rgba(255,165,0,0.15)',
              color: currentUser ? '#00ff88' : '#ffa500',
              fontWeight: 800,
            }}>
              {currentUser ? `${currentUser.totalPoints}p` : '🔒 Sign In'}
            </span>
          </button>

          {/* View 3: Hospital Triage */}
          <button
            onClick={() => onViewChange('hospital')}
            style={{
              padding: '4px 10px', borderRadius: 6,
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em',
              border: currentView === 'hospital' ? '1px solid #ffa50066' : '1px solid transparent',
              background: currentView === 'hospital' ? 'rgba(255,165,0,0.18)' : 'transparent',
              color: currentView === 'hospital' ? '#ffa500' : '#4a7090',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>🏥</span>
            <span className="hidden md:inline">HOSPITAL TRIAGE</span>
            {pendingVerifications?.length > 0 && (
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-mono)',
                padding: '1px 5px', borderRadius: 4,
                background: 'rgba(255,165,0,0.3)', color: '#ffa500',
                fontWeight: 800,
              }}>
                {pendingVerifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Status Pill (When on dispatch view) */}
        {currentView === 'dispatch' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(10,30,53,0.8)',
            border: `1px solid ${status.color}33`,
            borderRadius: 6, padding: '4px 10px',
          }} className="hidden xl:flex">
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: status.dot,
              boxShadow: `0 0 8px ${status.dot}`,
              animation: phase === 'enroute' ? 'pulse 1s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10, fontWeight: 600,
              color: status.color,
              letterSpacing: '0.12em',
            }}>{status.label}</span>
          </div>
        )}
      </div>

      {/* Right: Clock */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500,
          color: '#00d4ff', letterSpacing: '0.1em',
        }}>
          {currentTime}
        </div>
        <div className="hidden sm:block" style={{
          fontFamily: 'var(--font-mono)', fontSize: 8, color: '#4a7090',
          letterSpacing: '0.08em',
        }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
