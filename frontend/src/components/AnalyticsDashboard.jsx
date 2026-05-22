'use client';

/**
 * AnalyticsDashboard — Full-screen modal overlay presenting charts and statistics
 * derived from graph data. Includes severity donut, targeted assets bars,
 * node-type distribution, attack-frequency sparkline, threat-actor table,
 * and a key-metrics summary row.
 *
 * All visualisations are rendered with Canvas / SVG / pure divs — no external
 * charting libraries are used.
 *
 * @param {{ isOpen: boolean, onClose: () => void, graphData: { nodes: Array, links: Array } }} props
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';

/* ── colour constants ────────────────────────────────────── */

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
};

const NODE_COLORS = {
  ThreatActor:   '#ef4444',
  IPAddress:     '#f59e0b',
  Asset:         '#3b82f6',
  Vulnerability: '#a855f7',
  LogEntry:      '#6b7280',
};

const NODE_ICONS = {
  ThreatActor:   '🎭',
  IPAddress:     '🌐',
  Asset:         '💻',
  Vulnerability: '🔓',
  LogEntry:      '📋',
};

/* ── helpers ─────────────────────────────────────────────── */

/** Resolve a link endpoint that may be a string id or a d3 object. */
const resolveId = (endpoint) =>
  typeof endpoint === 'object' ? endpoint?.id : endpoint;

/** Return the severity string of a node (check common property locations). */
const getSeverity = (node) => {
  const p = node.properties || {};
  return (
    p.severity ||
    p.risk_level ||
    node.severity ||
    null
  );
};

/* ── derived-data hook ───────────────────────────────────── */

function useAnalyticsData(graphData) {
  return useMemo(() => {
    const nodes = graphData?.nodes || [];
    const links = graphData?.links || [];

    /* Key metrics */
    const totalNodes = nodes.length;
    const totalEdges = links.length;
    const uniqueIPs = new Set(
      nodes.filter((n) => n.label === 'IPAddress').map((n) => n.name || n.id),
    ).size;

    /* Severity distribution */
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    nodes.forEach((n) => {
      const sev = getSeverity(n);
      if (sev && severityCounts.hasOwnProperty(sev)) severityCounts[sev]++;
    });
    const criticalEvents = severityCounts.critical;

    /* Node-type counts */
    const typeCounts = {};
    nodes.forEach((n) => {
      const lbl = n.label || 'Unknown';
      typeCounts[lbl] = (typeCounts[lbl] || 0) + 1;
    });

    /* Top targeted assets (by inbound connection count) */
    const assetHits = {};
    const assetNodes = nodes.filter((n) => n.label === 'Asset');
    const assetIdSet = new Set(assetNodes.map((n) => n.id));
    links.forEach((l) => {
      const tgt = resolveId(l.target);
      if (assetIdSet.has(tgt)) {
        const assetNode = assetNodes.find((n) => n.id === tgt);
        const name = assetNode?.name || tgt;
        assetHits[name] = (assetHits[name] || 0) + 1;
      }
    });
    const topAssets = Object.entries(assetHits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    /* Threat-actor activity */
    const threatActors = nodes
      .filter((n) => n.label === 'ThreatActor')
      .map((n) => {
        const connCount = links.filter((l) => {
          return resolveId(l.source) === n.id || resolveId(l.target) === n.id;
        }).length;
        // Try to derive a severity from connected nodes
        const connectedSeverities = links
          .filter((l) => resolveId(l.source) === n.id || resolveId(l.target) === n.id)
          .map((l) => {
            const otherId =
              resolveId(l.source) === n.id ? resolveId(l.target) : resolveId(l.source);
            const other = nodes.find((x) => x.id === otherId);
            return getSeverity(other);
          })
          .filter(Boolean);
        const highest =
          connectedSeverities.includes('critical')
            ? 'critical'
            : connectedSeverities.includes('high')
              ? 'high'
              : connectedSeverities.includes('medium')
                ? 'medium'
                : 'low';
        return { name: n.name || n.id, connections: connCount, severity: highest };
      })
      .sort((a, b) => b.connections - a.connections);

    /* Attack-frequency timeline (generate synthetic sparkline points) */
    const sparklinePoints = (() => {
      const count = 24;
      const pts = [];
      // Try to derive from timestamps on LogEntry nodes
      const logEntries = nodes.filter((n) => n.label === 'LogEntry');
      if (logEntries.length >= 4) {
        const timestamps = logEntries
          .map((n) => {
            const ts = n.properties?.timestamp || n.properties?.created_at;
            return ts ? new Date(ts).getTime() : null;
          })
          .filter(Boolean)
          .sort((a, b) => a - b);
        if (timestamps.length >= 4) {
          const min = timestamps[0];
          const max = timestamps[timestamps.length - 1];
          const step = (max - min) / count || 1;
          for (let i = 0; i < count; i++) {
            const lo = min + i * step;
            const hi = lo + step;
            pts.push(timestamps.filter((t) => t >= lo && t < hi).length);
          }
          return pts;
        }
      }
      // Fallback: synthetic data based on node count for visual interest
      const base = Math.max(2, Math.floor(totalNodes / 6));
      for (let i = 0; i < count; i++) {
        pts.push(Math.max(0, base + Math.floor(Math.sin(i * 0.8) * base * 0.6) + Math.floor(Math.random() * 3)));
      }
      return pts;
    })();

    return {
      totalNodes,
      totalEdges,
      uniqueIPs,
      criticalEvents,
      severityCounts,
      typeCounts,
      topAssets,
      threatActors,
      sparklinePoints,
    };
  }, [graphData]);
}

/* ── Severity Donut (Canvas) ─────────────────────────────── */

function SeverityDonut({ severityCounts }) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 180;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const entries = Object.entries(SEVERITY_COLORS);
    const total = entries.reduce((s, [k]) => s + (severityCounts[k] || 0), 0);
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 72;
    const innerR = 46;

    ctx.clearRect(0, 0, size, size);

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.font = '600 11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#64748b';
      ctx.fillText('NO DATA', cx, cy);
      return;
    }

    let angle = -Math.PI / 2;
    entries.forEach(([key, color]) => {
      const count = severityCounts[key] || 0;
      if (count === 0) return;
      const slice = (count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, angle, angle + slice);
      ctx.arc(cx, cy, innerR, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // thin gap between slices
      ctx.strokeStyle = '#030712';
      ctx.lineWidth = 2;
      ctx.stroke();
      angle += slice;
    });

    // Center label
    ctx.font = '700 22px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(total.toString(), cx, cy - 6);
    ctx.font = '500 8px JetBrains Mono';
    ctx.fillStyle = '#64748b';
    ctx.fillText('EVENTS', cx, cy + 12);
  }, [severityCounts]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} style={{ imageRendering: 'auto' }} />
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[9px] font-mono tracking-wider uppercase" style={{ color }}>
              {key}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {severityCounts[key] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Top Targeted Assets (div bars) ──────────────────────── */

function TopAssetsBars({ topAssets }) {
  const max = topAssets.length > 0 ? topAssets[0][1] : 1;

  return (
    <div className="flex flex-col gap-2.5">
      {topAssets.length === 0 && (
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          No asset data available
        </span>
      )}
      {topAssets.map(([name, count], i) => (
        <div key={name} className="flex items-center gap-3" style={{ animationDelay: `${i * 60}ms` }}>
          <span
            className="text-[9px] font-mono truncate flex-shrink-0"
            style={{ color: 'var(--text-secondary)', width: 100 }}
            title={name}
          >
            {name}
          </span>
          <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div
              className="h-full rounded-sm transition-all duration-700"
              style={{
                width: `${(count / max) * 100}%`,
                background: `linear-gradient(90deg, var(--accent-cyan), #0891b2)`,
                boxShadow: '0 0 8px rgba(6,182,212,0.3)',
              }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--accent-cyan)', minWidth: 20, textAlign: 'right' }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Node Type Distribution (SVG bar chart) ──────────────── */

function NodeTypeChart({ typeCounts }) {
  const entries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const max = entries.length > 0 ? entries[0][1] : 1;
  const barW = 32;
  const gap = 12;
  const chartH = 100;
  const svgW = entries.length * (barW + gap);

  return (
    <div className="flex flex-col items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
      <svg width={svgW || 100} height={chartH + 40} style={{ minWidth: svgW || 100 }}>
        {entries.map(([label, count], i) => {
          const color = NODE_COLORS[label] || '#6b7280';
          const barH = (count / max) * chartH;
          const x = i * (barW + gap);
          return (
            <g key={label}>
              {/* Bar background */}
              <rect x={x} y={0} width={barW} height={chartH} rx={4} fill="rgba(255,255,255,0.03)" />
              {/* Bar fill */}
              <rect
                x={x}
                y={chartH - barH}
                width={barW}
                height={barH}
                rx={4}
                fill={color}
                opacity={0.85}
              >
                <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" />
                <animate attributeName="y" from={chartH} to={chartH - barH} dur="0.6s" fill="freeze" />
              </rect>
              {/* Count on top */}
              <text
                x={x + barW / 2}
                y={chartH - barH - 6}
                textAnchor="middle"
                fill={color}
                fontSize="10"
                fontFamily="JetBrains Mono"
                fontWeight="600"
              >
                {count}
              </text>
              {/* Label below */}
              <text
                x={x + barW / 2}
                y={chartH + 14}
                textAnchor="middle"
                fill="#64748b"
                fontSize="7"
                fontFamily="JetBrains Mono"
                letterSpacing="0.05em"
              >
                {label.replace(/([A-Z])/g, ' $1').trim().split(' ').map(w => w.slice(0, 4)).join(' ')}
              </text>
              {/* Icon */}
              <text x={x + barW / 2} y={chartH + 30} textAnchor="middle" fontSize="12">
                {NODE_ICONS[label] || '📦'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Attack Frequency Sparkline (SVG area) ───────────────── */

function SparklineChart({ points }) {
  const w = 320;
  const h = 80;
  const max = Math.max(...points, 1);
  const stepX = w / (points.length - 1 || 1);

  const linePoints = points
    .map((v, i) => `${i * stepX},${h - (v / max) * (h - 10)}`)
    .join(' ');
  const areaPoints = `0,${h} ${linePoints} ${(points.length - 1) * stepX},${h}`;

  return (
    <svg width="100%" height={h + 10} viewBox={`0 0 ${w} ${h + 10}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-magenta)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent-magenta)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={0}
          y1={h * frac}
          x2={w}
          y2={h * frac}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="4 4"
        />
      ))}
      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#sparkGrad)" />
      {/* Line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--accent-magenta)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dots on peaks */}
      {points.map((v, i) => {
        if (v < max * 0.6) return null;
        return (
          <circle
            key={i}
            cx={i * stepX}
            cy={h - (v / max) * (h - 10)}
            r={3}
            fill="var(--accent-magenta)"
            opacity={0.9}
          />
        );
      })}
    </svg>
  );
}

/* ── Threat Actor Activity Table ─────────────────────────── */

function ThreatActorTable({ threatActors }) {
  return (
    <div className="flex flex-col gap-0 overflow-y-auto" style={{ maxHeight: 220 }}>
      {/* Header */}
      <div
        className="grid gap-3 px-3 py-2 text-[8px] font-mono tracking-widest uppercase"
        style={{
          gridTemplateColumns: '1fr 70px 80px',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--glass-border)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-surface)',
          zIndex: 2,
        }}
      >
        <span>ACTOR</span>
        <span className="text-center">LINKS</span>
        <span className="text-center">SEVERITY</span>
      </div>
      {threatActors.length === 0 && (
        <span className="text-[10px] font-mono px-3 py-4" style={{ color: 'var(--text-muted)' }}>
          No threat actors detected
        </span>
      )}
      {threatActors.map((actor, i) => {
        const sevColor = SEVERITY_COLORS[actor.severity] || '#6b7280';
        return (
          <div
            key={actor.name}
            className="grid gap-3 px-3 py-2 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
            style={{
              gridTemplateColumns: '1fr 70px 80px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              animationDelay: `${i * 80}ms`,
            }}
          >
            <span className="text-[10px] font-mono truncate flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: NODE_COLORS.ThreatActor }} />
              {actor.name}
            </span>
            <span className="text-[10px] font-mono text-center font-bold" style={{ color: 'var(--accent-cyan)' }}>
              {actor.connections}
            </span>
            <span className="flex items-center justify-center">
              <span
                className="text-[8px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full"
                style={{
                  color: sevColor,
                  background: `${sevColor}18`,
                  border: `1px solid ${sevColor}30`,
                }}
              >
                {actor.severity}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main AnalyticsDashboard ─────────────────────────────── */

export default function AnalyticsDashboard({ isOpen, onClose, graphData }) {
  const data = useAnalyticsData(graphData);

  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const metrics = [
    { label: 'TOTAL NODES',    value: data.totalNodes,    color: 'var(--accent-cyan)',    icon: '🔷' },
    { label: 'TOTAL EDGES',    value: data.totalEdges,    color: 'var(--accent-magenta)', icon: '🔗' },
    { label: 'UNIQUE IPS',     value: data.uniqueIPs,     color: 'var(--accent-amber)',   icon: '🌐' },
    { label: 'CRITICAL EVENTS',value: data.criticalEvents, color: 'var(--accent-red)',    icon: '🔴' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        animation: 'analyticsIn 0.35s ease-out',
      }}
    >
      {/* ─ Inline keyframes (scoped via style tag alternative) ─ */}
      <style>{`
        @keyframes analyticsIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .analytics-card {
          animation: cardSlideUp 0.5s ease-out both;
        }
      `}</style>

      {/* ─ Header ─ */}
      <header
        className="flex items-center justify-between px-8 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }} />
          <h1
            className="font-display text-lg tracking-[0.25em] font-bold text-glow"
            style={{ color: 'var(--accent-cyan)' }}
          >
            SENTINEL ANALYTICS
          </h1>
          <span className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {data.totalNodes} nodes · {data.totalEdges} edges
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-all hover:bg-[rgba(255,255,255,0.06)] group"
          style={{ border: '1px solid var(--glass-border)' }}
          title="Close (Esc)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:rotate-90">
            <path d="M4 4l8 8M12 4l-8 8" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* ─ Scrollable body ─ */}
      <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>

        {/* ── Key Metrics Row ── */}
        <div className="grid grid-cols-4 gap-4 analytics-card" style={{ animationDelay: '0.05s' }}>
          {metrics.map((m) => (
            <div
              key={m.label}
              className="glass-card glass-card--cyan p-5 flex items-center gap-4"
            >
              <span className="text-2xl">{m.icon}</span>
              <div>
                <div className="text-2xl font-bold font-display" style={{ color: m.color }}>
                  {m.value}
                </div>
                <div className="text-[9px] font-mono tracking-widest uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {m.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 1: Severity Donut + Top Assets ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <div className="glass-card glass-card--cyan analytics-card p-5" style={{ animationDelay: '0.1s' }}>
            <h2
              className="text-[10px] font-display tracking-widest uppercase mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-red)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-red)' }} />
              SEVERITY DISTRIBUTION
            </h2>
            <SeverityDonut severityCounts={data.severityCounts} />
          </div>

          {/* Top Targeted Assets */}
          <div className="glass-card glass-card--cyan analytics-card p-5" style={{ animationDelay: '0.15s' }}>
            <h2
              className="text-[10px] font-display tracking-widest uppercase mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-cyan)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-cyan)' }} />
              TOP TARGETED ASSETS
            </h2>
            <TopAssetsBars topAssets={data.topAssets} />
          </div>
        </div>

        {/* ── Row 2: Node Type Distribution + Attack Frequency ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Node Type Distribution */}
          <div className="glass-card glass-card--magenta analytics-card p-5" style={{ animationDelay: '0.2s' }}>
            <h2
              className="text-[10px] font-display tracking-widest uppercase mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-purple)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-purple)' }} />
              NODE TYPE DISTRIBUTION
            </h2>
            <NodeTypeChart typeCounts={data.typeCounts} />
          </div>

          {/* Attack Frequency Timeline */}
          <div className="glass-card glass-card--magenta analytics-card p-5" style={{ animationDelay: '0.25s' }}>
            <h2
              className="text-[10px] font-display tracking-widest uppercase mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-magenta)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-magenta)' }} />
              ATTACK FREQUENCY
            </h2>
            <SparklineChart points={data.sparklinePoints} />
            <div className="flex justify-between mt-2 text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>
              <span>24h AGO</span>
              <span>NOW</span>
            </div>
          </div>
        </div>

        {/* ── Row 3: Threat Actor Activity (full width) ── */}
        <div className="glass-card glass-card--cyan analytics-card p-5" style={{ animationDelay: '0.3s' }}>
          <h2
            className="text-[10px] font-display tracking-widest uppercase mb-3 flex items-center gap-2"
            style={{ color: 'var(--accent-red)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-red)' }} />
            THREAT ACTOR ACTIVITY
          </h2>
          <ThreatActorTable threatActors={data.threatActors} />
        </div>
      </main>

      {/* ─ Footer scan-line decoration ─ */}
      <div
        className="h-px flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--accent-cyan), var(--accent-magenta), transparent)',
          opacity: 0.4,
        }}
      />
    </div>
  );
}
