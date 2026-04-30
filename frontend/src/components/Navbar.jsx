'use client';

/**
 * Navbar — Top navigation bar with branding, status indicator, and action buttons.
 */

import { useState } from 'react';
import StatusIndicator from './StatusIndicator';

export default function Navbar({ onIngest, isIngesting, backendStatus }) {
  return (
    <nav className="glass-card" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none' }}>
      <div className="flex items-center justify-between px-6 py-3">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">🛡️</div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-wider" style={{ color: 'var(--accent-cyan)' }}>
              VANGUARD <span style={{ color: 'var(--text-primary)' }}>SENTINEL</span>
            </h1>
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Cybersecurity Knowledge Graph OS
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <StatusIndicator status={backendStatus} />

          <button
            onClick={onIngest}
            disabled={isIngesting}
            className="btn-primary flex items-center gap-2"
          >
            {isIngesting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                INGESTING...
              </>
            ) : (
              <>
                <span>⚡</span>
                INGEST DATA
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
