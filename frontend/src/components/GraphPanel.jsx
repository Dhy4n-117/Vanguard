'use client';

/**
 * GraphPanel — Right-side force-directed graph visualization.
 * Renders Neo4j nodes and relationships with cyberpunk styling.
 * Supports double-click node expansion for interactive graph exploration.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import ForceGraph2D from './ForceGraph';
import { expandNode } from '../lib/api';

// Node color mapping by label
const NODE_COLORS = {
  ThreatActor:   '#ef4444',
  IPAddress:     '#f59e0b',
  Asset:         '#3b82f6',
  Vulnerability: '#a855f7',
  LogEntry:      '#6b7280',
};

const NODE_LABELS = {
  ThreatActor:   '🎭',
  IPAddress:     '🌐',
  Asset:         '💻',
  Vulnerability: '🔓',
  LogEntry:      '📋',
};

export default function GraphPanel({ graphData, onGraphUpdate }) {
  const graphRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Track container size using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height, // Removed the -60 subtraction, we can just rely on flex layout
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(containerRef.current);
    updateSize(); // Initial call

    return () => resizeObserver.disconnect();
  }, []);

  // ─── Double-click to expand a node ──────────────────────
  const handleNodeDoubleClick = useCallback(async (node) => {
    if (isExpanding || expandedNodeIds.has(node.id)) return;

    setIsExpanding(true);
    setSelectedNode(node);

    try {
      const neighborData = await expandNode(node.id);

      if (neighborData?.nodes?.length > 0 && onGraphUpdate) {
        // Merge new nodes/links into existing graph (deduplicate by id)
        const existingNodeIds = new Set(graphData.nodes.map(n => n.id));
        const existingLinkKeys = new Set(
          graphData.links.map(l => {
            const src = typeof l.source === 'object' ? l.source.id : l.source;
            const tgt = typeof l.target === 'object' ? l.target.id : l.target;
            return `${src}-${l.type}-${tgt}`;
          })
        );

        const newNodes = neighborData.nodes.filter(n => !existingNodeIds.has(n.id));
        const newLinks = neighborData.links.filter(l => {
          const key = `${l.source}-${l.type}-${l.target}`;
          return !existingLinkKeys.has(key);
        });

        const mergedGraph = {
          nodes: [...graphData.nodes, ...newNodes],
          links: [...graphData.links, ...newLinks],
        };

        onGraphUpdate(mergedGraph);
        setExpandedNodeIds(prev => new Set([...prev, node.id]));
      }
    } catch (err) {
      console.error('Node expansion failed:', err);
    } finally {
      setIsExpanding(false);
    }
  }, [graphData, onGraphUpdate, isExpanding, expandedNodeIds]);

  // ─── Single-click to select / inspect a node ───────────
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => (prev?.id === node.id ? null : node));
  }, []);

  // Custom node rendering
  const paintNode = useCallback((node, ctx, globalScale) => {
    const label = node.label || 'Unknown';
    const color = NODE_COLORS[label] || '#6b7280';
    const size = label === 'LogEntry' ? 4 : label === 'ThreatActor' ? 10 : 7;
    const isHovered = hoveredNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isExpanded = expandedNodeIds.has(node.id);

    // Outer pulse ring for expanded nodes
    if (isExpanded) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 6, 0, 2 * Math.PI);
      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Selection ring
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Outer glow
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 8, 0, 2 * Math.PI);
      ctx.fillStyle = color + '30';
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = isHovered || isSelected ? color : color + 'CC';
    ctx.fill();

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();

    // Label (only show when zoomed in enough or hovered)
    if (globalScale > 1.5 || isHovered || isSelected) {
      const name = node.name || '';
      const fontSize = Math.max(10 / globalScale, 3);
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(name, node.x, node.y + size + 3);
    }
  }, [hoveredNode, selectedNode, expandedNodeIds]);

  // Custom link rendering
  const paintLink = useCallback((link, ctx) => {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  }, []);

  const hasData = graphData?.nodes?.length > 0;

  return (
    <GlassCard variant="magenta" className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div>
          <h2 className="font-display text-sm font-semibold tracking-widest" style={{ color: 'var(--accent-magenta)' }}>
            🔮 THREAT GRAPH
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {hasData ? `${graphData.nodes.length} nodes · ${graphData.links.length} edges` : 'No data — ingest to populate'}
            {isExpanding && ' · Expanding...'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(NODE_COLORS).filter(([k]) => k !== 'LogEntry').map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{label.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expansion hint */}
      {hasData && (
        <div className="px-5 py-1.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(6, 182, 212, 0.03)' }}>
          <span className="text-[10px] font-mono tracking-wide" style={{ color: 'var(--accent-cyan)' }}>
            TIP: Double-click a node to expand its relationships
          </span>
        </div>
      )}

      {/* Graph */}
      <div className="flex-1 relative min-h-0 min-w-0 w-full">
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
          {hasData ? (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="transparent"
              nodeCanvasObject={paintNode}
              linkCanvasObject={paintLink}
              nodeRelSize={6}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={0.8}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              warmupTicks={50}
              cooldownTime={3000}
              onNodeHover={setHoveredNode}
              onNodeClick={handleNodeClick}
              onNodeDblClick={handleNodeDoubleClick}
              enableNodeDrag={true}
              enableZoomInteraction={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-30">🔮</div>
                <p className="font-display text-sm tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  AWAITING DATA
                </p>
                <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-muted)' }}>
                  Click &quot;INGEST DATA&quot; to populate the graph
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected / Hovered node detail panel */}
      {(selectedNode || hoveredNode) && (
        <div className="px-5 py-3 animate-fade-in-up" style={{ borderTop: '1px solid var(--glass-border)', background: 'var(--bg-elevated)' }}>
          {(() => {
            const node = selectedNode || hoveredNode;
            const isExp = expandedNodeIds.has(node.id);
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: NODE_COLORS[node.label] }} />
                  <span className="font-mono text-xs font-semibold" style={{ color: NODE_COLORS[node.label] }}>
                    {node.label}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                    {node.name}
                  </span>
                  {isExp && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}>
                      EXPANDED
                    </span>
                  )}
                </div>
                {!isExp && selectedNode && (
                  <button
                    onClick={() => handleNodeDoubleClick(node)}
                    disabled={isExpanding}
                    className="text-[10px] font-mono px-3 py-1 rounded-lg cursor-pointer transition-colors"
                    style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.2)' }}
                  >
                    {isExpanding ? 'EXPANDING...' : 'EXPAND'}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </GlassCard>
  );
}
