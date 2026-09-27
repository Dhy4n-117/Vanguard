'use client';

/**
 * SuggestedQueries — Categorized clickable query chips for threat analysis.
 * Includes basic, advanced, and incident response query templates.
 */

import { useState } from 'react';

const CATEGORIES = {
  'Quick': [
    { label: 'APT28 Targets', query: 'What servers has APT28 targeted?' },
    { label: 'Malicious IPs', query: 'Show me all malicious IP addresses and their connections' },
    { label: 'Critical CVEs', query: 'Which vulnerabilities are actively being exploited?' },
    { label: 'Recent Attacks', query: 'Show me the most recent attack activity' },
  ],
  'Hunting': [
    { label: 'Lateral Movement', query: 'Find lateral movement patterns between compromised assets' },
    { label: 'C2 Channels', query: 'Identify potential command and control communication channels' },
    { label: 'Privilege Escalation', query: 'Show assets where privilege escalation was attempted' },
    { label: 'Data Exfil Paths', query: 'Trace data exfiltration paths from internal assets to external IPs' },
  ],
  'IR': [
    { label: 'Blast Radius', query: 'Calculate the blast radius of the most connected threat actor' },
    { label: 'Isolation Targets', query: 'Which compromised assets should be isolated first?' },
    { label: 'Attack Timeline', query: 'Reconstruct the timeline of the latest multi-stage attack' },
  ],
};

const CATEGORY_COLORS = {
  'Quick': { bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.15)', text: 'var(--accent-cyan)' },
  'Hunting': { bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.15)', text: '#f97316' },
  'IR': { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
};

export default function SuggestedQueries({ onSelect, disabled }) {
  const [activeCategory, setActiveCategory] = useState('Quick');

  const colors = CATEGORY_COLORS[activeCategory];

  return (
    <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      {/* Category Tabs */}
      <div className="flex gap-2 mb-2">
        {Object.keys(CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="text-[8px] font-display tracking-widest uppercase px-2.5 py-1 rounded-md transition-all"
            style={{
              background: activeCategory === cat ? CATEGORY_COLORS[cat].bg : 'transparent',
              color: activeCategory === cat ? CATEGORY_COLORS[cat].text : 'var(--text-muted)',
              border: `1px solid ${activeCategory === cat ? CATEGORY_COLORS[cat].border : 'transparent'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Query Chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES[activeCategory].map(({ label, query }) => (
          <button
            key={label}
            onClick={() => onSelect(query)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wide cursor-pointer transition-all duration-200"
            style={{
              background: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = colors.border;
              e.target.style.borderColor = colors.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = colors.bg;
              e.target.style.borderColor = colors.border;
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
