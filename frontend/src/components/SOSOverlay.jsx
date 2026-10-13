import React, { useEffect, useState, useRef } from 'react';

/**
 * SOSOverlay — Emergency SOS modal.
 * Clean, authoritative, trustworthy interface with refined red and amber accents.
 */
export default function SOSOverlay({ visible, onConfirm, onCancel, countdownSecs = 5 }) {
  const [countdown, setCountdown] = useState(countdownSecs);
  const [canCancel, setCanCancel] = useState(true);
  const timerRef = useRef(null);
  const cancelWindowRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setCountdown(countdownSecs);
      setCanCancel(true);

      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onConfirm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cancel window expires at 2s remaining
      cancelWindowRef.current = setTimeout(() => {
        setCanCancel(false);
      }, (countdownSecs - 2) * 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cancelWindowRef.current) clearTimeout(cancelWindowRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cancelWindowRef.current) clearTimeout(cancelWindowRef.current);
    };
  }, [visible, countdownSecs, onConfirm]);

  if (!visible) return null;

  const pct = ((countdownSecs - countdown) / countdownSecs) * 100;

  const handleCancel = () => {
    if (!canCancel) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (cancelWindowRef.current) clearTimeout(cancelWindowRef.current);
    onCancel();
  };

  const handleConfirm = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cancelWindowRef.current) clearTimeout(cancelWindowRef.current);
    onConfirm();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(11, 18, 32, 0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{
        background: '#10243A',
        border: '1px solid #1E2D44',
        borderRadius: 16,
        padding: '32px 28px',
        maxWidth: 380,
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      }}>
        {/* SOS icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(229, 57, 53, 0.15)',
          color: '#E53935',
          margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>

        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 18, fontWeight: 800,
          color: '#F8FAFC', letterSpacing: '0.05em',
          marginBottom: 6,
        }}>EMERGENCY SOS INITIATED</div>

        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12, color: '#94A3B8',
          marginBottom: 20, lineHeight: 1.5,
        }}>
          Emergency services are being dispatched to your verified live location coordinates.
        </div>

        {/* Countdown ring */}
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
          <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#1E2D44" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke={canCancel ? '#D97706' : '#E53935'}
              strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20, fontWeight: 700,
              color: canCancel ? '#F59E0B' : '#E53935',
            }}>{countdown}</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#64748B', fontWeight: 600 }}>SEC</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {canCancel && (
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 8,
                border: '1px solid #334E68',
                background: '#1E293B',
                color: '#CBD5E1',
                fontFamily: "'Inter', sans-serif",
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              Cancel SOS
            </button>
          )}
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 8,
              border: 'none',
              background: '#E53935',
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Confirm Dispatch
          </button>
        </div>

        {canCancel && (
          <div style={{
            marginTop: 14,
            fontFamily: "'Inter', sans-serif", fontSize: 10,
            color: '#64748B', lineHeight: 1.4,
          }}>
            Cancel window closes in {countdown}s.<br />
            After that, dispatch authorization locks.
          </div>
        )}
        {!canCancel && (
          <div style={{
            marginTop: 14,
            fontFamily: "'Inter', sans-serif", fontSize: 10,
            color: '#E53935', fontWeight: 600,
          }}>
            Authorization locked — dispatch in progress.
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
