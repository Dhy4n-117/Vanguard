'use client';

/**
 * ErrorBoundary — Catches React rendering errors in child components
 * and displays a fallback UI instead of crashing the entire dashboard.
 */

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="flex flex-col items-center justify-center h-full w-full p-6 rounded-xl border"
          style={{ 
            background: 'rgba(239, 68, 68, 0.05)', 
            borderColor: 'rgba(239, 68, 68, 0.2)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="text-3xl mb-3">⚠️</div>
          <h3 
            className="font-display text-sm tracking-widest uppercase mb-2"
            style={{ color: 'var(--accent-red)' }}
          >
            {this.props.title || 'Component Error'}
          </h3>
          <p className="text-[11px] font-mono text-center mb-4 max-w-md" style={{ color: 'var(--text-muted)' }}>
            {this.state.error?.message || 'An unexpected error occurred in this panel.'}
          </p>
          
          {/* Error details (collapsible) */}
          <details className="w-full max-w-md mb-4">
            <summary 
              className="text-[9px] font-mono tracking-widest uppercase cursor-pointer mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Stack Trace
            </summary>
            <pre 
              className="text-[8px] font-mono p-3 rounded-lg overflow-auto max-h-32 border"
              style={{ 
                background: 'var(--bg-base)', 
                borderColor: 'var(--glass-border)',
                color: 'var(--text-muted)' 
              }}
            >
              {this.state.error?.stack || 'No stack trace available'}
            </pre>
          </details>

          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-lg text-[10px] font-display tracking-widest uppercase transition-all duration-200 border"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--accent-cyan)',
              borderColor: 'rgba(59, 130, 246, 0.2)',
              cursor: 'pointer'
            }}
          >
            ↻ Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * PanelErrorBoundary — Pre-configured error boundary for dashboard panels.
 */
export function PanelErrorBoundary({ children, panelName }) {
  return (
    <ErrorBoundary title={`${panelName} Error`}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
