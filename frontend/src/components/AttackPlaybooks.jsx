'use client';

/**
 * AttackPlaybooks — Modal overlay presenting predefined attack scenario templates.
 * Replaces the simple "SIMULATE ATTACK" button with a curated selection of
 * named playbooks (APT28, Ransomware, Insider Threat, DDoS, Supply Chain).
 *
 * Each playbook card shows an icon, name, description, severity badge,
 * and a mini numbered-stage timeline. Clicking a card fires
 * `onSelectPlaybook(playbook)` and closes the modal.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen           - Whether the modal is visible
 * @param {Function} props.onClose          - Called when the modal should close
 * @param {Function} props.onSelectPlaybook - Called with the selected playbook object
 */

import { useEffect, useCallback } from 'react';

/* ── Playbook definitions ──────────────────────────────────── */

const PLAYBOOKS = [
  {
    id: 'apt28',
    name: 'APT28 Campaign',
    icon: '🎭',
    severity: 'critical',
    description: 'Multi-stage nation-state attack targeting government infrastructure',
    stages: ['Spear phishing', 'Credential harvest', 'Lateral movement', 'Data exfiltration'],
    color: '#ef4444',
  },
  {
    id: 'ransomware',
    name: 'Ransomware Spread',
    icon: '💀',
    severity: 'critical',
    description: 'WannaCry-style worm propagation across network segments',
    stages: ['Initial exploit', 'Privilege escalation', 'Network propagation', 'Encryption'],
    color: '#f97316',
  },
  {
    id: 'insider',
    name: 'Insider Threat',
    icon: '🕵️',
    severity: 'high',
    description: 'Compromised employee accessing sensitive database servers',
    stages: ['Credential abuse', 'Database access', 'Data staging', 'Exfiltration'],
    color: '#eab308',
  },
  {
    id: 'ddos',
    name: 'DDoS Assault',
    icon: '🌊',
    severity: 'high',
    description: 'Distributed denial-of-service targeting web infrastructure',
    stages: ['Bot activation', 'Traffic amplification', 'Service degradation', 'Full outage'],
    color: '#a855f7',
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain Attack',
    icon: '📦',
    severity: 'critical',
    description: 'Compromised dependency injecting malicious code into build pipeline',
    stages: ['Package compromise', 'Build injection', 'Deployment', 'Backdoor activation'],
    color: '#06b6d4',
  },
];

/* ── Severity badge styles ─────────────────────────────────── */

const SEVERITY_STYLES = {
  critical: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    text: '#ef4444',
    label: 'CRITICAL',
  },
  high: {
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)',
    text: '#f97316',
    label: 'HIGH',
  },
  medium: {
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.4)',
    text: '#eab308',
    label: 'MEDIUM',
  },
};

/* ── Component ─────────────────────────────────────────────── */

export default function AttackPlaybooks({ isOpen, onClose, onSelectPlaybook }) {
  /* Close on Escape */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (playbook) => {
    onSelectPlaybook?.(playbook);
    onClose?.();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(3, 7, 18, 0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* Modal container */}
      <div
        className="relative w-full max-w-2xl mx-4 animate-fade-in-up"
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          boxShadow:
            '0 0 80px rgba(6, 182, 212, 0.08), 0 24px 64px rgba(0, 0, 0, 0.6)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--glass-border)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">⚔️</span>
            <div>
              <h2
                className="text-xs font-display tracking-widest uppercase"
                style={{ color: 'var(--accent-cyan)' }}
              >
                Attack Playbooks
              </h2>
              <p
                className="text-[9px] font-mono mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Select a scenario to simulate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Playbook list ───────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
          style={{ scrollbarWidth: 'thin' }}
        >
          {PLAYBOOKS.map((pb, idx) => {
            const sev = SEVERITY_STYLES[pb.severity] || SEVERITY_STYLES.medium;

            return (
              <button
                key={pb.id}
                onClick={() => handleSelect(pb)}
                className="w-full text-left rounded-xl transition-all group"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderLeft: `3px solid ${pb.color}`,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  animationDelay: `${idx * 60}ms`,
                  animation: 'fadeInUp 0.4s ease-out both',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${pb.color}0a`;
                  e.currentTarget.style.borderColor = `${pb.color}30`;
                  e.currentTarget.style.borderLeftColor = pb.color;
                  e.currentTarget.style.boxShadow = `0 0 24px ${pb.color}15, inset 0 0 40px ${pb.color}05`;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderLeftColor = pb.color;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* Top row: icon + name + severity */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl flex-shrink-0">{pb.icon}</span>

                  <span
                    className="font-display text-sm tracking-wider font-semibold flex-1"
                    style={{ color: pb.color }}
                  >
                    {pb.name}
                  </span>

                  {/* Severity badge */}
                  <span
                    className="px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase flex-shrink-0"
                    style={{
                      background: sev.bg,
                      color: sev.text,
                      border: `1px solid ${sev.border}`,
                    }}
                  >
                    {sev.label}
                  </span>
                </div>

                {/* Description */}
                <p
                  className="text-[10px] font-mono leading-relaxed mb-3 ml-9"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {pb.description}
                </p>

                {/* Stages mini-timeline */}
                <div className="flex items-center gap-0 ml-9 flex-wrap">
                  {pb.stages.map((stage, si) => (
                    <div key={si} className="flex items-center">
                      {/* Stage node */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold flex-shrink-0"
                          style={{
                            background: `${pb.color}20`,
                            color: pb.color,
                            border: `1px solid ${pb.color}40`,
                          }}
                        >
                          {si + 1}
                        </span>
                        <span
                          className="text-[9px] font-mono whitespace-nowrap"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {stage}
                        </span>
                      </div>

                      {/* Connector */}
                      {si < pb.stages.length - 1 && (
                        <div
                          className="mx-2 flex-shrink-0"
                          style={{
                            width: '16px',
                            height: '1px',
                            background: `linear-gradient(90deg, ${pb.color}40, ${pb.color}10)`,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Footer hint ─────────────────────────────────── */}
        <div
          className="px-6 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: '1px solid var(--glass-border)' }}
        >
          <span
            className="text-[9px] font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            {PLAYBOOKS.length} playbooks available
          </span>
          <span
            className="text-[9px] font-mono flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <kbd
              className="px-1.5 py-0.5 rounded text-[8px]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              ESC
            </kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
