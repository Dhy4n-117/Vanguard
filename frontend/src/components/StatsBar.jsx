'use client';

/**
 * StatsBar — Top metrics display showing entity counts from the graph.
 */

import { useState, useEffect } from 'react';
import GlassCard from './GlassCard';

const statConfig = [
  { key: 'ThreatActor', label: 'THREAT ACTORS', icon: '🎭', color: 'var(--accent-red)', variant: 'cyan' },
  { key: 'IPAddress', label: 'IP ADDRESSES', icon: '🌐', color: 'var(--accent-amber)', variant: 'amber' },
  { key: 'Asset', label: 'ASSETS', icon: '💻', color: 'var(--accent-cyan)', variant: 'cyan' },
  { key: 'Vulnerability', label: 'VULNERABILITIES', icon: '🔓', color: 'var(--accent-purple)', variant: 'magenta' },
  { key: 'LogEntry', label: 'LOG ENTRIES', icon: '📋', color: 'var(--accent-emerald)', variant: 'emerald' },
];

export default function StatsBar({ graphData }) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Count nodes by label
  const counts = {};
  if (graphData?.nodes) {
    for (const node of graphData.nodes) {
      counts[node.label] = (counts[node.label] || 0) + 1;
    }
  }

  const edgeCount = graphData?.links?.length || 0;

  return (
    <div className="grid grid-cols-6 gap-3">
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
      <GlassCard variant="cyan" className="p-4 text-center">
        <div className="text-2xl mb-1">🔗</div>
        <div className="text-2xl font-bold font-display" style={{ color: 'var(--accent-cyan)' }}>
          {edgeCount}
        </div>
        <div className="text-[10px] font-mono tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
          RELATIONSHIPS
        </div>
        <div className="text-[8px] font-mono mt-1" style={{ color: 'var(--accent-cyan)' }}>
          {clock}
        </div>
      </GlassCard>
    </div>
  );
}
