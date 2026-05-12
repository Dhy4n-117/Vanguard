'use client';

/**
 * SuggestedQueries — Clickable query chips for common threat analysis questions.
 */

const SUGGESTIONS = [
  { label: 'APT28 Targets', query: 'What servers has APT28 targeted?' },
  { label: 'Malicious IPs', query: 'Show me all malicious IP addresses and their connections' },
  { label: 'Critical CVEs', query: 'Which vulnerabilities are actively being exploited?' },
  { label: 'Lateral Movement', query: 'Find lateral movement patterns between compromised assets' },
  { label: 'DB Server Threats', query: 'What threats are targeting the database server?' },
  { label: 'Recent Attacks', query: 'Show me the most recent attack activity' },
];

export default function SuggestedQueries({ onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      {SUGGESTIONS.map(({ label, query }) => (
        <button
          key={label}
          onClick={() => onSelect(query)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wide cursor-pointer transition-all duration-200"
          style={{
            background: 'var(--accent-cyan-dim)',
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(6, 182, 212, 0.25)';
            e.target.style.borderColor = 'var(--accent-cyan)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--accent-cyan-dim)';
            e.target.style.borderColor = 'rgba(6, 182, 212, 0.15)';
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
