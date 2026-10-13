import React from 'react';

/**
 * Error Boundary — catches unhandled React render errors
 * and shows a styled fallback UI instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('LifeLine AI — Unhandled error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100vw',
          background: '#0B1220', color: '#F8FAFC',
          fontFamily: "'Inter', -apple-system, sans-serif", gap: 16, padding: 32,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'rgba(229, 57, 53, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
            Operational Session Interrupted
          </div>
          <div style={{
            fontSize: 12, color: '#94A3B8',
            background: '#10243A', border: '1px solid #1E2D44',
            borderRadius: 8, padding: '12px 20px', maxWidth: 540, textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {this.state.error?.message || 'An unexpected runtime error occurred.'}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); }}
            style={{
              marginTop: 8, padding: '10px 24px', borderRadius: 8,
              background: '#0F9D8A', border: 'none',
              color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Retry Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
