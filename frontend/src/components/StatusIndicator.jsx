'use client';

/**
 * StatusIndicator — Shows backend connection status as a glowing dot.
 */

export default function StatusIndicator({ status = 'disconnected' }) {
  const isConnected = status === 'connected';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}
    >
      <span className={`status-dot ${isConnected ? 'status-dot--connected' : 'status-dot--disconnected'}`} />
      <span className="text-xs font-mono uppercase tracking-wider"
        style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-red)' }}
      >
        {isConnected ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  );
}
