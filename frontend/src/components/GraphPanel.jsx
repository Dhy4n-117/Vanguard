'use client';

/**
 * GraphPanel — Right-side force-directed graph visualization.
 * Renders Neo4j nodes and relationships with cyberpunk styling.
 * Supports double-click node expansion for interactive graph exploration.
 */

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import GlassCard from './GlassCard';
import ForceGraph2D from './ForceGraph';
import { expandNode } from '../lib/api';
import GraphFilters from './GraphFilters';
import NodeDetailPanel from './NodeDetailPanel';

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
  
  // NEW: Graph Filters State
  const [activeFilters, setActiveFilters] = useState([
    'ThreatActor', 'IPAddress', 'Asset', 'Vulnerability', 'LogEntry'
  ]);

  // Track container size using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateSize);
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

    const isIsolated = node.properties?.isolated === true;

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
    if (isHovered && !isIsolated) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 8, 0, 2 * Math.PI);
      ctx.fillStyle = color + '30';
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    
    if (isIsolated) {
      ctx.fillStyle = '#1e293b'; // Dark gray
      ctx.strokeStyle = '#ef4444'; // Red border
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 2]);
    } else {
      ctx.fillStyle = isHovered || isSelected ? color : color + 'CC';
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.setLineDash([]);
    }
    
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

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

  // Filter data based on active filters
  const { filteredData, nodeCounts } = useMemo(() => {
    if (!graphData?.nodes) return { filteredData: { nodes: [], links: [] }, nodeCounts: {} };
    
    const counts = {};
    graphData.nodes.forEach(n => {
      counts[n.label] = (counts[n.label] || 0) + 1;
    });

    const activeNodes = graphData.nodes.filter(n => activeFilters.includes(n.label));
    const activeIds = new Set(activeNodes.map(n => n.id));
    
    // Only include links where both source and target are still visible
    const activeLinks = graphData.links.filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return activeIds.has(srcId) && activeIds.has(tgtId);
    });

    return {
      filteredData: { nodes: activeNodes, links: activeLinks },
      nodeCounts: counts
    };
  }, [graphData, activeFilters]);

  const handleExportScreenshot = useCallback(() => {
    if (!graphRef.current) return;
    
    // The canvas is rendered via react-force-graph
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    
    // Create a temporary link to download the image
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `threat-graph-export-${new Date().toISOString().slice(0,10)}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const handleExportData = useCallback(() => {
    if (!filteredData?.nodes) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredData, null, 2));
    const link = document.createElement('a');
    link.download = `threat-graph-data-${new Date().toISOString().slice(0,10)}.json`;
    link.href = dataStr;
    link.click();
  }, [filteredData]);

  const hasData = graphData?.nodes?.length > 0;

  return (
    <GlassCard variant="magenta" className="flex flex-col h-full overflow-hidden relative">
      {/* Export Buttons */}
      {hasData && (
        <div className="absolute top-3 right-4 z-10 flex gap-2">
          <button
            onClick={handleExportData}
            className="text-[9px] font-mono tracking-widest uppercase py-1.5 px-3 rounded-md bg-[rgba(10,15,30,0.8)] border border-[rgba(255,255,255,0.1)] hover:border-white hover:bg-[rgba(255,255,255,0.1)] transition-all flex items-center gap-1.5"
            style={{ color: '#e2e8f0' }}
            title="Export filtered graph data as JSON"
          >
            💾 DATA
          </button>
          <button
            onClick={handleExportScreenshot}
            className="text-[9px] font-mono tracking-widest uppercase py-1.5 px-3 rounded-md bg-[rgba(10,15,30,0.8)] border border-[rgba(255,255,255,0.1)] hover:border-white hover:bg-[rgba(255,255,255,0.1)] transition-all flex items-center gap-1.5"
            style={{ color: '#e2e8f0' }}
            title="Export visual graph screenshot as PNG"
          >
            📸 EXPORT
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 pr-24" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div>
          <h2 className="font-display text-sm font-semibold tracking-widest" style={{ color: 'var(--accent-magenta)' }}>
            🔮 THREAT GRAPH
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {hasData ? `${filteredData.nodes.length} nodes · ${filteredData.links.length} edges` : 'No data — ingest to populate'}
            {isExpanding && ' · Expanding...'}
          </p>
        </div>
      </div>

      {/* Graph Filters */}
      {hasData && (
        <GraphFilters 
          activeFilters={activeFilters} 
          onFilterChange={setActiveFilters} 
          nodeCounts={nodeCounts} 
        />
      )}

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
              graphData={filteredData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="transparent"
              nodeCanvasObject={paintNode}
              linkCanvasObject={paintLink}
              nodeRelSize={6}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={0.8}
              d3AlphaDecay={0.08} // Faster settling
              d3VelocityDecay={0.5} // Higher friction to stop jitter
              warmupTicks={0} 
              cooldownTicks={60} // Force stop simulation after 60 ticks
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

      {/* Selected Node Detail Panel */}
      <NodeDetailPanel 
        node={selectedNode}
        graphData={graphData}
        onClose={() => setSelectedNode(null)}
        onExpand={handleNodeDoubleClick}
        isExpanding={isExpanding}
      />
    </GlassCard>
  );
}
