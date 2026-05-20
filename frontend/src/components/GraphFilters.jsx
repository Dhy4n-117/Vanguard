'use client';

/**
 * GraphFilters — Toggleable filter chips for node types displayed above the threat graph.
 * Allows users to show/hide specific node categories for decluttered analysis.
 */

const NODE_TYPES = [
  { label: 'ThreatActor',   display: 'Threat Actors',   color: '#ef4444', icon: '🎭' },
  { label: 'IPAddress',     display: 'IP Addresses',    color: '#f59e0b', icon: '🌐' },
  { label: 'Asset',         display: 'Assets',          color: '#3b82f6', icon: '💻' },
  { label: 'Vulnerability', display: 'Vulnerabilities', color: '#a855f7', icon: '🔓' },
  { label: 'LogEntry',      display: 'Log Entries',     color: '#6b7280', icon: '📋' },
];

export default function GraphFilters({ activeFilters, onFilterChange, nodeCounts = {} }) {
  const toggleFilter = (label) => {
    if (activeFilters.includes(label)) {
      onFilterChange(activeFilters.filter(f => f !== label));
    } else {
      onFilterChange([...activeFilters, label]);
    }
  };

  const allActive = activeFilters.length === NODE_TYPES.length;

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      {/* Select All / None toggle */}
      <button
        onClick={() => onFilterChange(allActive ? [] : NODE_TYPES.map(t => t.label))}
        className="text-[9px] font-mono px-2 py-1 rounded border transition-all hover:brightness-125"
        style={{
          background: allActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
          color: '#06b6d4',
          borderColor: 'rgba(6, 182, 212, 0.3)',
        }}
      >
        {allActive ? 'HIDE ALL' : 'SHOW ALL'}
      </button>

      <div className="w-px h-4 bg-[rgba(255,255,255,0.1)]" />

      {NODE_TYPES.map(({ label, display, color, icon }) => {
        const isActive = activeFilters.includes(label);
        const count = nodeCounts[label] || 0;

        return (
          <button
            key={label}
            onClick={() => toggleFilter(label)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all duration-200 cursor-pointer"
            style={{
              background: isActive ? `${color}18` : 'transparent',
              color: isActive ? color : '#475569',
              border: `1px solid ${isActive ? color + '40' : 'rgba(255,255,255,0.06)'}`,
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <span className="w-2 h-2 rounded-full transition-all" style={{
              background: isActive ? color : '#374151',
            }} />
            {display}
            {count > 0 && (
              <span className="text-[8px] opacity-70">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
