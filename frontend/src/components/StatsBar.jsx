'use client';

/**
 * StatsBar — Top metrics display showing entity counts from the graph.
 */

import GlassCard from './GlassCard';

const statConfig = [
  { key: 'ThreatActor', label: 'THREAT ACTORS', icon: '🎭', color: 'var(--accent-red)', variant: 'cyan' },
  { key: 'IPAddress', label: 'IP ADDRESSES', icon: '🌐', color: 'var(--accent-amber)', variant: 'amber' },
  { key: 'Asset', label: 'ASSETS', icon: '💻', color: 'var(--accent-cyan)', variant: 'cyan' },
  { key: 'Vulnerability', label: 'VULNERABILITIES', icon: '🔓', color: 'var(--accent-purple)', variant: 'magenta' },
  { key: 'LogEntry', label: 'LOG ENTRIES', icon: '📋', color: 'var(--accent-emerald)', variant: 'emerald' },
];

export default function StatsBar({ graphData }) {
  // Count nodes by label
  const counts = {};
  if (graphData?.nodes) {
    for (const node of graphData.nodes) {
      counts[node.label] = (counts[node.label] || 0) + 1;
    }
  }

  return (
    <div className="grid grid-cols-5 gap-3">
      {statConfig.map(({ key, label, icon, color, variant }) => (
        <GlassCard key={key} variant={variant} className="p-4 text-center">
          <div className="text-2xl mb-1">{icon}</div>
          <div className="text-2xl font-bold font-display" style={{ color }}>
            {counts[key] || 0}
          </div>
          <div className="text-[10px] font-mono tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
            {label}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
