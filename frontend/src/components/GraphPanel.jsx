'use client';

/**
 * GraphPanel — Right-side force-directed graph visualization.
 * Renders Neo4j nodes and relationships with cyberpunk styling.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import ForceGraph2D from './ForceGraph';

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

export default function GraphPanel({ graphData }) {
  const graphRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);

  // Track container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height - 60, // subtract header
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Custom node rendering
  const paintNode = useCallback((node, ctx, globalScale) => {
    const label = node.label || 'Unknown';
    const color = NODE_COLORS[label] || '#6b7280';
    const size = label === 'LogEntry' ? 4 : label === 'ThreatActor' ? 10 : 7;
    const isHovered = hoveredNode?.id === node.id;

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
    ctx.fillStyle = isHovered ? color : color + 'CC';
    ctx.fill();

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();

    // Label (only show when zoomed in enough or hovered)
    if (globalScale > 1.5 || isHovered) {
      const name = node.name || '';
      const fontSize = Math.max(10 / globalScale, 3);
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(name, node.x, node.y + size + 3);
    }
  }, [hoveredNode]);

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
    <GlassCard variant="magenta" className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div>
          <h2 className="font-display text-sm font-semibold tracking-widest" style={{ color: 'var(--accent-magenta)' }}>
            🔮 THREAT GRAPH
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {hasData ? `${graphData.nodes.length} nodes · ${graphData.links.length} edges` : 'No data — ingest to populate'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-3">
          {Object.entries(NODE_COLORS).filter(([k]) => k !== 'LogEntry').map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{label.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="flex-1 graph-container" style={{ minHeight: 0 }}>
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
            enableNodeDrag={true}
            enableZoomInteraction={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
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

      {/* Hovered node details */}
      {hoveredNode && (
        <div className="px-5 py-3 animate-fade-in-up" style={{ borderTop: '1px solid var(--glass-border)', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: NODE_COLORS[hoveredNode.label] }} />
            <span className="font-mono text-xs font-semibold" style={{ color: NODE_COLORS[hoveredNode.label] }}>
              {hoveredNode.label}
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
              {hoveredNode.name}
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
