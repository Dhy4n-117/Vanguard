'use client';

/**
 * Navbar — Top navigation bar with branding, status indicator, and action buttons.
 */

import { useState } from 'react';
import StatusIndicator from './StatusIndicator';

export default function Navbar({ 
  onIngest, isIngesting, backendStatus, onSearch, 
  onSimulateAttack, isSimulating, onOpenAnalytics, onOpenTopology 
}) {
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
            onClick={onOpenAnalytics}
            className="px-4 py-2.5 rounded-lg text-xs font-display tracking-widest transition-all duration-200 cursor-pointer"
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              color: 'var(--accent-purple)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}
          >
            📊 ANALYTICS
          </button>

          <button
            onClick={onOpenTopology}
            className="px-4 py-2.5 rounded-lg text-xs font-display tracking-widest transition-all duration-200 cursor-pointer"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            🌐 TOPOLOGY
          </button>

          <button
            onClick={onSearch}
            className="px-4 py-2.5 rounded-lg text-xs font-display tracking-widest transition-all duration-200 cursor-pointer"
            style={{
              background: 'var(--accent-emerald-dim)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            🔍 SEARCH
          </button>

          <button
            onClick={onSimulateAttack}
            disabled={isSimulating}
            className="px-4 py-2.5 rounded-lg text-xs font-display tracking-widest transition-all duration-200 cursor-pointer flex items-center gap-2"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {isSimulating ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ATTACKING...
              </>
            ) : (
              <>
                <span>🔥</span>
                ATTACK PLAYBOOKS
              </>
            )}
          </button>

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
