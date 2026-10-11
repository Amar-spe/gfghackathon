import React, { useState } from 'react';
import { EMERGENCY_PROFILES } from '../utils/aiEngine';

const EMERGENCY_TYPES = [
  'Cardiac Arrest',
  'Heart Attack',
  'Stroke',
  'Accident',
  'Trauma',
  'Burn',
  'Pregnancy',
  'General',
  'Other',
];

const EMERGENCY_ICONS = {
  'Cardiac Arrest': '❤️',
  'Heart Attack':   '💔',
  'Stroke':         '🧠',
  'Accident':       '💥',
  'Trauma':         '🩸',
  'Burn':           '🔥',
  'Pregnancy':      '🤰',
  'General':        '🏥',
  'Other':          '⚡',
};

export default function EmergencyInput({ emergencyType, onChange, phase, emergencyLocation }) {
  const isCustomType = !EMERGENCY_TYPES.slice(0, -1).includes(emergencyType);
  const [customText, setCustomText] = useState(isCustomType && emergencyType !== 'Other' ? emergencyType : '');
  const [showCustomInput, setShowCustomInput] = useState(isCustomType);

  // Fall back to 'General' profile if emergencyType is custom or 'Other'
  const profile = EMERGENCY_PROFILES[emergencyType] || EMERGENCY_PROFILES['General'];

  const handleSelect = (type) => {
    if (type === 'Other') {
      setShowCustomInput(true);
      onChange(customText.trim() ? customText.trim() : 'Other');
    } else {
      setShowCustomInput(false);
      onChange(type);
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomText(val);
    onChange(val.trim() ? val.trim() : 'Other');
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #071525 0%, #0a1e35 100%)',
      border: '1px solid #0f3060',
      borderRadius: 12,
      padding: 14,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10, color: '#4a7090',
          letterSpacing: '0.15em',
          fontWeight: 700,
        }}>EMERGENCY NATURE</div>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-mono)',
          color: '#00d4ff', background: 'rgba(0,212,255,0.1)',
          padding: '1px 6px', borderRadius: 4,
          border: '1px solid rgba(0,212,255,0.2)'
        }}>AI CLASSIFIED</span>
      </div>

      {/* Type selector: 3 columns grid for sleek presentation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
        {EMERGENCY_TYPES.map(type => {
          const isSelected = type === 'Other'
            ? (showCustomInput || emergencyType === 'Other')
            : emergencyType === type;
          const icon = EMERGENCY_ICONS[type] || '🏥';

          return (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              disabled={phase === 'enroute' || phase === 'arrived'}
              style={{
                padding: '7px 4px',
                borderRadius: 8,
                border: isSelected ? '1px solid #00d4ff' : '1px solid #0f3060',
                background: isSelected ? 'rgba(0,212,255,0.16)' : 'rgba(7,21,37,0.7)',
                color: isSelected ? '#00d4ff' : '#6482a0',
                fontFamily: 'var(--font-body)',
                fontSize: 11, fontWeight: isSelected ? 700 : 500,
                cursor: phase === 'enroute' || phase === 'arrived' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                boxShadow: isSelected ? '0 0 12px rgba(0,212,255,0.25)' : 'none',
                opacity: phase === 'enroute' || phase === 'arrived' ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span style={{
                fontSize: 9, textAlign: 'center', lineHeight: 1.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'
              }}>{type}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Emergency Input field if "Other" is chosen */}
      {showCustomInput && (
        <div style={{ marginTop: 10, animation: 'fadeInUp 0.3s ease-out' }}>
          <label style={{
            display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)',
            color: '#00d4ff', marginBottom: 4, letterSpacing: '0.05em'
          }}>
            Specify Custom Emergency Nature:
          </label>
          <input
            type="text"
            value={customText}
            onChange={handleCustomChange}
            placeholder="e.g. Chemical Spill, Building Collapse, Electric Shock..."
            disabled={phase === 'enroute' || phase === 'arrived'}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 6,
              background: '#040c18',
              border: '1px solid #00d4ff66',
              color: '#c8e0f4',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              outline: 'none',
              boxShadow: '0 0 8px rgba(0,212,255,0.15)',
            }}
          />
        </div>
      )}

      {/* Severity badge */}
      <div style={{
        marginTop: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px',
        background: `${profile.color}14`,
        border: `1px solid ${profile.color}33`,
        borderRadius: 8,
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7090' }}>
          TRIAGE LEVEL
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: 2,
              background: i < profile.severity ? profile.color : '#0f3060',
              boxShadow: i < profile.severity ? `0 0 5px ${profile.color}90` : 'none',
            }} />
          ))}
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10, fontWeight: 700,
            color: profile.color,
            marginLeft: 4, letterSpacing: '0.08em',
          }}>
            {showCustomInput && customText ? customText.toUpperCase() : profile.label}
          </span>
        </div>
      </div>

      {/* Location status */}
      <div style={{
        marginTop: 8,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px',
        background: emergencyLocation ? 'rgba(0,255,136,0.08)' : 'rgba(7,21,37,0.8)',
        border: `1px solid ${emergencyLocation ? '#00ff8844' : '#0f3060'}`,
        borderRadius: 8,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: emergencyLocation ? '#00ff88' : '#4a7090',
          boxShadow: emergencyLocation ? '0 0 8px #00ff88' : 'none',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: emergencyLocation ? '#00ff88' : '#4a7090',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {emergencyLocation
            ? `📍 ${emergencyLocation.lat.toFixed(4)}, ${emergencyLocation.lng.toFixed(4)}`
            : 'Click map to set emergency pin'}
        </span>
      </div>
    </div>
  );
}
