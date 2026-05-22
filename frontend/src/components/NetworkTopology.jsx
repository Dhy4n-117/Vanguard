'use client';

/**
 * NetworkTopology — Full-screen modal showing a structured network topology map.
 * Renders graph nodes organized into security zones (External, DMZ, Internal, Data Layer)
 * with SVG bezier connection lines and interactive tooltips.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen    - Whether the modal is visible
 * @param {Function} props.onClose   - Callback to close the modal
 * @param {Object}   props.graphData - { nodes: [], links: [] } from the graph store
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────

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

/** Sub-type icons for Asset nodes based on name heuristics */
const ASSET_SUBTYPE_ICONS = {
  'web':    '🌍',
  'vpn':    '🔒',
  'mail':   '📧',
  'file':   '📁',
  'auth':   '🛡️',
  'proxy':  '🔀',
  'db':     '🗄️',
  'data':   '🗄️',
};

/**
 * Zone definitions — each zone has a label, description, background tint,
 * accent color, and a classifier function that determines if a node belongs.
 * Order matters: nodes are checked top-to-bottom, first match wins.
 */
const ZONES = [
  {
    id: 'external',
    label: 'EXTERNAL ZONE',
    description: 'Threat actors & external IPs',
    bgTint: 'rgba(239, 68, 68, 0.04)',
    borderAccent: 'rgba(239, 68, 68, 0.15)',
    accentColor: '#ef4444',
    classify: (node) => {
      if (node.label === 'ThreatActor') return true;
      if (node.label === 'IPAddress') {
        const name = (node.name || '').toLowerCase();
        // External heuristic: public IPs, external tags, or simply all IPs not tagged internal
        return !name.includes('internal') && !name.includes('10.') && !name.includes('192.168.');
      }
      return false;
    },
  },
  {
    id: 'dmz',
    label: 'DMZ',
    description: 'Web-facing assets — web servers, VPN gateways, mail servers',
    bgTint: 'rgba(245, 158, 11, 0.04)',
    borderAccent: 'rgba(245, 158, 11, 0.15)',
    accentColor: '#f59e0b',
    classify: (node) => {
      if (node.label !== 'Asset') return false;
      const name = (node.name || '').toLowerCase();
      return ['web', 'vpn', 'mail', 'gateway', 'proxy-ext', 'dmz', 'load-balancer', 'lb', 'cdn', 'waf'].some(k => name.includes(k));
    },
  },
  {
    id: 'internal',
    label: 'INTERNAL NETWORK',
    description: 'Internal assets — file servers, auth proxies, workstations',
    bgTint: 'rgba(6, 182, 212, 0.04)',
    borderAccent: 'rgba(6, 182, 212, 0.15)',
    accentColor: '#06b6d4',
    classify: (node) => {
      if (node.label === 'Asset') {
        const name = (node.name || '').toLowerCase();
        // Anything that is NOT DMZ or data-layer
        return !['web', 'vpn', 'mail', 'gateway', 'proxy-ext', 'dmz', 'load-balancer', 'lb', 'cdn', 'waf', 'db', 'database', 'sql', 'mongo', 'redis', 'elastic', 'postgres'].some(k => name.includes(k));
      }
      if (node.label === 'IPAddress') {
        const name = (node.name || '').toLowerCase();
        return name.includes('internal') || name.includes('10.') || name.includes('192.168.');
      }
      if (node.label === 'LogEntry') return true;
      return false;
    },
  },
  {
    id: 'data',
    label: 'DATA LAYER',
    description: 'Databases, data stores & vulnerabilities',
    bgTint: 'rgba(168, 85, 247, 0.04)',
    borderAccent: 'rgba(168, 85, 247, 0.15)',
    accentColor: '#a855f7',
    classify: (node) => {
      if (node.label === 'Vulnerability') return true;
      if (node.label === 'Asset') {
        const name = (node.name || '').toLowerCase();
        return ['db', 'database', 'sql', 'mongo', 'redis', 'elastic', 'postgres'].some(k => name.includes(k));
      }
      return false;
    },
  },
];

/** Map relationship types to line colors */
const LINK_COLORS = {
  ATTACKED:       '#ef4444',
  ATTACKS:        '#ef4444',
  EXPLOITS:       '#eab308',
  EXPLOITED_BY:   '#eab308',
  HAS_VULNERABILITY: '#a855f7',
  SCANNED:        '#f59e0b',
  LOGS:           '#06b6d4',
  LOGGED_BY:      '#06b6d4',
  CONNECTS_TO:    '#3b82f6',
  RESOLVES_TO:    '#10b981',
  COMMUNICATES:   '#06b6d4',
};

const LINK_LEGEND = [
  { label: 'Attack', color: '#ef4444' },
  { label: 'Exploit', color: '#eab308' },
  { label: 'Logs / Comms', color: '#06b6d4' },
  { label: 'Vulnerability', color: '#a855f7' },
  { label: 'Connection', color: '#3b82f6' },
];

// ─── Helpers ──────────────────────────────────────────────────

/** Get the best display icon for a node */
function getNodeIcon(node) {
  if (node.label !== 'Asset') return NODE_ICONS[node.label] || '📦';
  const name = (node.name || '').toLowerCase();
  for (const [key, icon] of Object.entries(ASSET_SUBTYPE_ICONS)) {
    if (name.includes(key)) return icon;
  }
  return '💻';
}

/** Classify a node into a zone id */
function classifyNode(node) {
  for (const zone of ZONES) {
    if (zone.classify(node)) return zone.id;
  }
  // Fallback: put unknowns in internal
  return 'internal';
}

/** Resolve a link endpoint to an id string */
function resolveId(endpoint) {
  return typeof endpoint === 'object' ? endpoint.id : endpoint;
}

// ─── Component ────────────────────────────────────────────────

export default function NetworkTopology({ isOpen, onClose, graphData }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  // ─── Measure container ──────────────────────────────────
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // ─── Escape to close ───────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ─── Organize nodes into zones ─────────────────────────
  const { zoneMap, nodePositions, links } = useMemo(() => {
    if (!graphData?.nodes?.length) {
      return { zoneMap: {}, nodePositions: {}, links: [] };
    }

    // Bucket nodes into zones
    const buckets = {};
    ZONES.forEach(z => { buckets[z.id] = []; });

    graphData.nodes.forEach(node => {
      const zoneId = classifyNode(node);
      buckets[zoneId].push(node);
    });

    // Compute positions
    const { width, height } = containerSize;
    const ZONE_PADDING_TOP = 80;    // space for header
    const ZONE_PADDING_BOTTOM = 60; // space for legend
    const usableHeight = height - ZONE_PADDING_TOP - ZONE_PADDING_BOTTOM;
    const zoneHeight = usableHeight / ZONES.length;
    const NODE_CARD_W = 120;
    const NODE_CARD_H = 60;

    const positions = {};
    const zoneMapResult = {};

    ZONES.forEach((zone, zoneIndex) => {
      const nodes = buckets[zone.id] || [];
      const zoneY = ZONE_PADDING_TOP + zoneIndex * zoneHeight;
      const centerY = zoneY + zoneHeight / 2;
      const totalNodesWidth = nodes.length * NODE_CARD_W + (nodes.length - 1) * 20;
      const startX = Math.max(40, (width - totalNodesWidth) / 2);

      zoneMapResult[zone.id] = {
        ...zone,
        y: zoneY,
        height: zoneHeight,
        nodes,
      };

      nodes.forEach((node, i) => {
        positions[node.id] = {
          x: startX + i * (NODE_CARD_W + 20) + NODE_CARD_W / 2,
          y: centerY,
          width: NODE_CARD_W,
          height: NODE_CARD_H,
        };
      });
    });

    // Filter links to only include those with both endpoints present
    const validIds = new Set(Object.keys(positions));
    const validLinks = (graphData.links || []).filter(l => {
      return validIds.has(resolveId(l.source)) && validIds.has(resolveId(l.target));
    });

    return { zoneMap: zoneMapResult, nodePositions: positions, links: validLinks };
  }, [graphData, containerSize]);

  // ─── Mouse tracking for tooltip ────────────────────────
  const handleNodeMouseEnter = useCallback((e, node) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 8,
      });
    }
    setHoveredNode(node);
  }, []);

  const handleNodeMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 8,
      });
    }
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  if (!isOpen) return null;

  const hasData = graphData?.nodes?.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* ─── Header Bar ─────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center gap-4">
          <h1
            className="font-display text-sm font-bold tracking-[0.2em]"
            style={{ color: 'var(--accent-cyan)' }}
          >
            🌐 NETWORK TOPOLOGY MAP
          </h1>
          {hasData && (
            <span className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {graphData.nodes.length} NODES · {graphData.links?.length || 0} EDGES
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-display tracking-widest transition-all hover:brightness-125"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          ✕ CLOSE
        </button>
      </div>

      {/* ─── Main Content ───────────────────────────────── */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {!hasData ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-30">🌐</div>
              <p className="font-display text-sm tracking-widest" style={{ color: 'var(--text-muted)' }}>
                NO TOPOLOGY DATA
              </p>
              <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-muted)' }}>
                Ingest data to visualize the network topology
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ─── Zone Bands ────────────────────────────── */}
            {ZONES.map(zone => {
              const info = zoneMap[zone.id];
              if (!info) return null;

              return (
                <div
                  key={zone.id}
                  className="absolute left-0 right-0"
                  style={{
                    top: info.y,
                    height: info.height,
                    background: zone.bgTint,
                    borderTop: `1px solid ${zone.borderAccent}`,
                    borderBottom: `1px solid ${zone.borderAccent}`,
                  }}
                >
                  {/* Zone Label */}
                  <div className="absolute left-4 top-2 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: zone.accentColor, boxShadow: `0 0 8px ${zone.accentColor}60` }}
                    />
                    <span
                      className="text-[9px] font-display tracking-[0.2em] uppercase"
                      style={{ color: zone.accentColor }}
                    >
                      {zone.label}
                    </span>
                    <span
                      className="text-[8px] font-mono tracking-wide"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      — {zone.description}
                    </span>
                  </div>

                  {/* Node count badge */}
                  <div className="absolute right-4 top-2">
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                      style={{
                        background: `${zone.accentColor}15`,
                        color: zone.accentColor,
                        border: `1px solid ${zone.accentColor}30`,
                      }}
                    >
                      {info.nodes.length} {info.nodes.length === 1 ? 'node' : 'nodes'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* ─── SVG Connection Lines ──────────────────── */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={containerSize.width}
              height={containerSize.height}
              style={{ zIndex: 5 }}
            >
              <defs>
                {/* Glow filter for links */}
                <filter id="link-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {links.map((link, i) => {
                const srcId = resolveId(link.source);
                const tgtId = resolveId(link.target);
                const srcPos = nodePositions[srcId];
                const tgtPos = nodePositions[tgtId];

                if (!srcPos || !tgtPos) return null;

                const linkType = (link.type || link.label || '').toUpperCase();
                const color = LINK_COLORS[linkType] || 'rgba(100, 116, 139, 0.4)';

                // Compute bezier control points (vertical curve)
                const x1 = srcPos.x;
                const y1 = srcPos.y + srcPos.height / 2;
                const x2 = tgtPos.x;
                const y2 = tgtPos.y - tgtPos.height / 2;
                const midY = (y1 + y2) / 2;

                const isHovered = hoveredNode &&
                  (hoveredNode.id === srcId || hoveredNode.id === tgtId);

                return (
                  <path
                    key={`link-${i}`}
                    d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHovered ? 2 : 1}
                    strokeOpacity={isHovered ? 0.9 : 0.3}
                    filter={isHovered ? 'url(#link-glow)' : undefined}
                    strokeDasharray={linkType.includes('EXPLOIT') ? '6 3' : undefined}
                  />
                );
              })}
            </svg>

            {/* ─── Node Cards ────────────────────────────── */}
            {graphData.nodes.map(node => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const color = NODE_COLORS[node.label] || '#6b7280';
              const icon = getNodeIcon(node);
              const isThreat = node.label === 'ThreatActor';
              const isHovered = hoveredNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  className="absolute cursor-pointer transition-all duration-200"
                  style={{
                    left: pos.x - pos.width / 2,
                    top: pos.y - pos.height / 2,
                    width: pos.width,
                    height: pos.height,
                    zIndex: isHovered ? 20 : 10,
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => handleNodeMouseEnter(e, node)}
                  onMouseMove={handleNodeMouseMove}
                  onMouseLeave={handleNodeMouseLeave}
                >
                  {/* Pulse ring for threat actors */}
                  {isThreat && (
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        border: `1px solid ${color}`,
                        animation: 'topoThreatPulse 2s ease-in-out infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Card body */}
                  <div
                    className="w-full h-full rounded-lg flex flex-col items-center justify-center gap-1 relative overflow-hidden"
                    style={{
                      background: isHovered
                        ? 'rgba(15, 23, 42, 0.95)'
                        : 'rgba(10, 15, 30, 0.85)',
                      border: `1px solid ${color}${isHovered ? '80' : '40'}`,
                      boxShadow: isHovered
                        ? `0 0 20px ${color}30, 0 4px 16px rgba(0,0,0,0.4)`
                        : `0 2px 8px rgba(0,0,0,0.3)`,
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {/* Top accent line */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                      }}
                    />

                    <span className="text-base leading-none">{icon}</span>
                    <span
                      className="text-[8px] font-mono tracking-wider text-center leading-tight px-1 truncate w-full"
                      style={{ color: isHovered ? '#f1f5f9' : '#94a3b8' }}
                      title={node.name}
                    >
                      {node.name || node.id}
                    </span>

                    {/* Type badge */}
                    <span
                      className="text-[6px] font-mono tracking-widest uppercase px-1.5 py-0 rounded-full"
                      style={{
                        background: `${color}15`,
                        color: color,
                        border: `1px solid ${color}25`,
                      }}
                    >
                      {node.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* ─── Tooltip ───────────────────────────────── */}
            {hoveredNode && (
              <div
                className="absolute pointer-events-none animate-fade-in-up"
                style={{
                  left: tooltipPos.x,
                  top: tooltipPos.y,
                  zIndex: 100,
                  maxWidth: 260,
                }}
              >
                <div
                  className="rounded-lg px-3 py-2.5 space-y-1.5"
                  style={{
                    background: 'rgba(10, 15, 30, 0.97)',
                    border: `1px solid ${NODE_COLORS[hoveredNode.label] || '#6b7280'}50`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getNodeIcon(hoveredNode)}</span>
                    <span
                      className="text-[10px] font-display tracking-wider font-bold"
                      style={{ color: NODE_COLORS[hoveredNode.label] || '#6b7280' }}
                    >
                      {hoveredNode.name || hoveredNode.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-[8px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded"
                      style={{
                        background: `${NODE_COLORS[hoveredNode.label]}15`,
                        color: NODE_COLORS[hoveredNode.label],
                      }}
                    >
                      {hoveredNode.label}
                    </span>
                    <span className="text-[8px] font-mono" style={{ color: '#64748b' }}>
                      Zone: {classifyNode(hoveredNode).toUpperCase()}
                    </span>
                  </div>

                  {/* Properties preview */}
                  {hoveredNode.properties && Object.keys(hoveredNode.properties).length > 0 && (
                    <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {Object.entries(hoveredNode.properties)
                        .filter(([key]) => !['id', 'elementId'].includes(key))
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1.5">
                            <span className="text-[7px] font-mono tracking-wider uppercase" style={{ color: '#64748b' }}>
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-[8px] font-mono truncate" style={{ color: '#94a3b8' }}>
                              {String(value).slice(0, 40)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Connection count */}
                  {graphData?.links && (
                    <div className="text-[7px] font-mono" style={{ color: '#64748b' }}>
                      {graphData.links.filter(l =>
                        resolveId(l.source) === hoveredNode.id || resolveId(l.target) === hoveredNode.id
                      ).length} connections
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Legend Bar ──────────────────────────────────── */}
      {hasData && (
        <div
          className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(10, 15, 30, 0.6)',
          }}
        >
          {/* Zone legend */}
          <div className="flex items-center gap-4">
            <span className="text-[8px] font-mono tracking-widest uppercase" style={{ color: '#64748b' }}>
              ZONES:
            </span>
            {ZONES.map(zone => (
              <div key={zone.id} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{
                    background: zone.accentColor,
                    boxShadow: `0 0 4px ${zone.accentColor}40`,
                  }}
                />
                <span className="text-[8px] font-mono tracking-wider" style={{ color: '#94a3b8' }}>
                  {zone.label}
                </span>
              </div>
            ))}
          </div>

          {/* Link color legend */}
          <div className="flex items-center gap-4">
            <span className="text-[8px] font-mono tracking-widest uppercase" style={{ color: '#64748b' }}>
              LINKS:
            </span>
            {LINK_LEGEND.map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="w-4 h-[2px] rounded-full"
                  style={{
                    background: item.color,
                    boxShadow: `0 0 4px ${item.color}60`,
                  }}
                />
                <span className="text-[8px] font-mono tracking-wider" style={{ color: '#94a3b8' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Inline Keyframe Styles ──────────────────────── */}
      <style jsx="true">{`
        @keyframes topoThreatPulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.06);
            box-shadow: 0 0 16px 4px rgba(239, 68, 68, 0.15);
          }
        }
      `}</style>
    </div>
  );
}
