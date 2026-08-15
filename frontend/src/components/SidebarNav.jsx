'use client';

/**
 * SidebarNav — Left sidebar navigation pillar with icon buttons.
 * Provides quick access to all major views and actions.
 */

import { useState } from 'react';
import { 
  LayoutDashboard, BarChart3, Globe, Swords, FileText, 
  Settings, Shield, HelpCircle, ChevronRight, ChevronLeft, Map,
  Crosshair, Search, Link2, BrainCircuit
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', section: 'view' },
  { id: 'topology', icon: Globe, label: 'Topology', section: 'view' },
  { id: 'geomap', icon: Map, label: 'Geo Map', section: 'view' },
  { id: 'mitre', icon: Crosshair, label: 'MITRE ATT&CK', section: 'view' },
  { id: 'playbooks', icon: Swords, label: 'Playbooks', section: 'view' },
  { id: 'correlation', icon: Link2, label: 'Correlation', section: 'view' },
  { id: 'report', icon: FileText, label: 'Report', section: 'action' },
  { id: 'shortcuts', icon: HelpCircle, label: 'Shortcuts', section: 'info' },
];

export default function SidebarNav({ 
  isExpanded, 
  onToggle, 
  onNavigate, 
  activeView = 'dashboard' 
}) {
  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${isExpanded ? 'w-52' : 'w-16'} border-r flex flex-col relative`} 
      style={{ 
        borderColor: 'var(--glass-border)', 
        background: 'rgba(10, 15, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 40 
      }}
    >
      {/* Logo Area */}
      <div className="h-14 flex items-center justify-center border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="text-xl">🛡️</div>
        {isExpanded && (
          <span 
            className="ml-2 font-display text-xs tracking-[0.2em] uppercase animate-fade-in-up"
            style={{ color: 'var(--accent-cyan)' }}
          >
            SENTINEL
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col py-3 gap-1 px-2">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          // Add separator before different sections
          const prevSection = idx > 0 ? NAV_ITEMS[idx - 1].section : null;
          const showSeparator = prevSection && prevSection !== item.section;

          return (
            <div key={item.id}>
              {showSeparator && (
                <div className="h-px mx-2 my-2" style={{ background: 'var(--glass-border)' }} />
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 rounded-lg transition-all duration-200
                  ${isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'}
                  ${isActive 
                    ? 'bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)]' 
                    : 'hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
                  }
                `}
                title={!isExpanded ? item.label : undefined}
                style={{ cursor: 'pointer' }}
              >
                <Icon 
                  size={18} 
                  className="flex-shrink-0 transition-colors"
                  style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
                />
                {isExpanded && (
                  <span 
                    className="text-[11px] font-mono tracking-widest uppercase whitespace-nowrap animate-fade-in-up"
                    style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
                  >
                    {item.label}
                  </span>
                )}
                {isActive && !isExpanded && (
                  <div 
                    className="absolute left-0 w-0.5 h-5 rounded-r"
                    style={{ background: 'var(--accent-cyan)' }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Expand/Collapse Toggle */}
      <div className="border-t px-2 py-2" style={{ borderColor: 'var(--glass-border)' }}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
          style={{ cursor: 'pointer' }}
        >
          {isExpanded ? (
            <>
              <ChevronLeft size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Collapse
              </span>
            </>
          ) : (
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </button>
      </div>

      {/* Active status indicator */}
      <div className="h-1 rounded-t" style={{ background: 'var(--accent-emerald)' }} />
    </div>
  );
}
