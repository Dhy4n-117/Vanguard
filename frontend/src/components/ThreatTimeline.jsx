'use client';

/**
 * ThreatTimeline — Horizontal timeline view of security events.
 * Displays events chronologically with severity-based styling and scroll navigation.
 */

import { useRef, useEffect, useMemo } from 'react';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const SEVERITY_PRIORITY = { critical: 0, high: 1, medium: 2, low: 3 };

export default function ThreatTimeline({ events = [], isVisible = true }) {
  const scrollRef = useRef(null);

  // Sort events by timestamp descending
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const ta = new Date(a.timestamp || a.properties?.timestamp || 0).getTime();
      const tb = new Date(b.timestamp || b.properties?.timestamp || 0).getTime();
      return tb - ta;
    });
  }, [events]);

  // Auto-scroll to newest
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [events.length]);

  if (!isVisible || sortedEvents.length === 0) return null;

  const formatTime = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return '--:--:--';
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm">⏱️</span>
          <h3 className="text-[10px] font-display tracking-widest uppercase" style={{ color: 'var(--accent-cyan)' }}>
            THREAT TIMELINE
          </h3>
          <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {sortedEvents.length} events
          </span>
        </div>

        {/* Severity summary */}
        <div className="flex items-center gap-3">
          {Object.entries(SEVERITY_COLORS).map(([sev, color]) => {
            const count = sortedEvents.filter(e => e.severity === sev).length;
            if (count === 0) return null;
            return (
              <span key={sev} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-[9px] font-mono" style={{ color }}>{count}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="flex items-stretch gap-0 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
        {sortedEvents.slice(0, 50).map((evt, i) => {
          const color = SEVERITY_COLORS[evt.severity] || '#6b7280';
          const time = formatTime(evt.timestamp || evt.properties?.timestamp);

          return (
            <div key={evt.id || i} className="flex items-center flex-shrink-0">
              {/* Event node */}
              <div className="flex flex-col items-center gap-1 px-3 group cursor-default">
                {/* Time label */}
                <span className="text-[8px] font-mono opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: '#94a3b8' }}>
                  {time}
                </span>

                {/* Node dot */}
                <div
                  className="w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-150"
                  style={{ borderColor: color, background: `${color}40` }}
                />

                {/* Event label */}
                <span className="text-[8px] font-mono text-center leading-tight max-w-[80px] group-hover:text-white transition-colors" style={{ color: '#64748b' }}>
                  {(evt.event_type || evt.name || '').replace(/_/g, ' ')}
                </span>

                {/* Target */}
                <span className="text-[7px] font-mono opacity-0 group-hover:opacity-80 transition-opacity" style={{ color }}>
                  {evt.target_asset || ''}
                </span>
              </div>

              {/* Connector line */}
              {i < sortedEvents.length - 1 && (
                <div className="w-8 h-px flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
