'use client';

/**
 * NodeDetailPanel — Slide-out panel showing full node properties when clicked.
 * Displays all metadata, relationships count, and quick actions.
 */

import { useEffect, useRef } from 'react';

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

export default function NodeDetailPanel({ node, graphData, onClose, onExpand, isExpanding }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!node) return null;

  const color = NODE_COLORS[node.label] || '#6b7280';
  const icon = NODE_ICONS[node.label] || '📦';
  const props = node.properties || {};

  // Count connections
  const connections = graphData?.links?.filter(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    return src === node.id || tgt === node.id;
  }) || [];

  // Get connected node types
  const connectedTypes = {};
  connections.forEach(l => {
    const otherId = (typeof l.source === 'object' ? l.source.id : l.source) === node.id
      ? (typeof l.target === 'object' ? l.target.id : l.target)
      : (typeof l.source === 'object' ? l.source.id : l.source);
    const otherNode = graphData?.nodes?.find(n => n.id === otherId);
    if (otherNode) {
      connectedTypes[otherNode.label] = (connectedTypes[otherNode.label] || 0) + 1;
    }
  });

  // Filter out internal props
  const displayProps = Object.entries(props).filter(
    ([key]) => !['id', 'elementId'].includes(key)
  );

  return (
    <div 
      ref={panelRef}
      className="absolute top-0 right-0 h-full w-[320px] z-40 flex flex-col animate-fade-in-up"
      style={{
        background: 'rgba(10, 15, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        borderLeft: `2px solid ${color}40`,
        boxShadow: `-8px 0 40px rgba(0, 0, 0, 0.5)`,
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${color}30` }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="font-display text-sm font-bold tracking-wider" style={{ color }}>
              {node.label?.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <p className="text-xs font-mono mt-0.5" style={{ color: '#94a3b8' }}>{node.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[#94a3b8] hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Connection Summary */}
      <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <p className="text-[9px] font-mono tracking-widest uppercase mb-2" style={{ color: '#64748b' }}>
          CONNECTIONS ({connections.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(connectedTypes).map(([type, count]) => (
            <span key={type} className="px-2 py-1 rounded text-[10px] font-mono" style={{
              background: `${NODE_COLORS[type] || '#6b7280'}15`,
              color: NODE_COLORS[type] || '#6b7280',
              border: `1px solid ${NODE_COLORS[type] || '#6b7280'}30`,
            }}>
              {count}× {type}
            </span>
          ))}
          {Object.keys(connectedTypes).length === 0 && (
            <span className="text-[10px] font-mono" style={{ color: '#64748b' }}>No connections found</span>
          )}
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <p className="text-[9px] font-mono tracking-widest uppercase mb-3" style={{ color: '#64748b' }}>
          PROPERTIES
        </p>
        <div className="space-y-2">
          {displayProps.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono tracking-wider uppercase" style={{ color: '#64748b' }}>
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-mono px-2 py-1.5 rounded-lg break-all" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                {typeof value === 'boolean' ? (value ? '✅ true' : '❌ false') : String(value)}
              </span>
            </div>
          ))}
          {displayProps.length === 0 && (
            <p className="text-[10px] font-mono" style={{ color: '#64748b' }}>No properties available</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 flex gap-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => onExpand?.(node)}
          disabled={isExpanding}
          className="flex-1 px-3 py-2 rounded-lg text-[10px] font-display tracking-widest transition-all hover:brightness-125"
          style={{
            background: 'rgba(6, 182, 212, 0.1)',
            color: '#06b6d4',
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          {isExpanding ? 'EXPANDING...' : '🔍 EXPAND'}
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-[10px] font-display tracking-widest transition-all hover:brightness-125"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
