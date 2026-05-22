'use client';

/**
 * KeyboardShortcuts — Global keyboard shortcut handler with visual hint overlay.
 *
 * Registers document-level keydown listeners for common dashboard actions and
 * renders a glassmorphism overlay listing every shortcut when the user taps '?'.
 *
 * Renders nothing (null) when the overlay is hidden — zero visual footprint.
 */

import { useState, useMemo } from 'react';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

/** Shortcut descriptor used by the overlay table */
const SHORTCUT_ROWS = [
  { keys: ['Ctrl', 'K'],         label: 'Open semantic search' },
  { keys: ['Ctrl', 'Shift', 'A'], label: 'Trigger attack simulation' },
  { keys: ['Ctrl', 'Shift', 'I'], label: 'Trigger data ingestion' },
  { keys: ['Ctrl', 'B'],         label: 'Toggle chat panel' },
  { keys: ['Ctrl', 'Shift', 'S'], label: 'Toggle stats bar' },
  { keys: ['Esc'],               label: 'Close all modals / panels' },
  { keys: ['?'],                  label: 'Show this shortcut guide' },
];

export default function KeyboardShortcuts({
  onSearch,
  onSimulateAttack,
  onIngest,
  onToggleChat,
  onToggleStats,
  onCloseAll,
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  // Build the shortcut map consumed by the hook.
  // Memoised so the reference only changes when callbacks change.
  const shortcuts = useMemo(
    () => [
      { key: 'k',      ctrl: true,                        action: () => onSearch?.(),          description: 'Open semantic search' },
      { key: 'a',      ctrl: true, shift: true,           action: () => onSimulateAttack?.(),  description: 'Trigger attack simulation' },
      { key: 'i',      ctrl: true, shift: true,           action: () => onIngest?.(),          description: 'Trigger data ingestion' },
      { key: 'b',      ctrl: true,                        action: () => onToggleChat?.(),      description: 'Toggle chat panel' },
      { key: 's',      ctrl: true, shift: true,           action: () => onToggleStats?.(),     description: 'Toggle stats bar' },
      { key: 'Escape',                                    action: () => { onCloseAll?.(); setShowOverlay(false); }, description: 'Close all' },
      { key: '?',                                         action: () => setShowOverlay((v) => !v), description: 'Shortcut guide' },
    ],
    [onSearch, onSimulateAttack, onIngest, onToggleChat, onToggleStats, onCloseAll],
  );

  useKeyboardShortcuts(shortcuts);

  /* ── Render nothing when the overlay is hidden ──────────────────────── */
  if (!showOverlay) return null;

  /* ── Overlay ────────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-8"
      style={{ background: 'rgba(3, 7, 18, 0.75)', backdropFilter: 'blur(10px)' }}
      onClick={() => setShowOverlay(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up w-full"
        style={{ maxWidth: '520px' }}
      >
        {/* Glass card — matches the project's glassmorphism tokens */}
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 0 60px rgba(6, 182, 212, 0.08), 0 0 120px rgba(6, 182, 212, 0.04)',
          }}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--glass-border)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: 'rgba(6, 182, 212, 0.12)' }}
              >
                ⌨️
              </span>
              <div>
                <h2
                  className="font-display text-sm font-semibold tracking-widest uppercase"
                  style={{ color: 'var(--accent-cyan)' }}
                >
                  Keyboard Shortcuts
                </h2>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Press <Kbd>?</Kbd> to toggle this guide
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOverlay(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
            >
              ✕
            </button>
          </div>

          {/* ── Shortcut Rows ───────────────────────────────────────── */}
          <div className="px-6 py-4 space-y-2">
            {SHORTCUT_ROWS.map(({ keys, label }, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-xl transition-colors"
                style={{
                  background: i % 2 === 0 ? 'rgba(6, 182, 212, 0.04)' : 'transparent',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
                }}
              >
                {/* Key badges */}
                <div className="flex items-center gap-1.5">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </div>

                {/* Description */}
                <span
                  className="text-xs font-mono tracking-wide"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer hint ─────────────────────────────────────────── */}
          <div
            className="px-6 py-3 flex items-center justify-center gap-2"
            style={{ borderTop: '1px solid var(--glass-border)' }}
          >
            <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              Press <Kbd>Esc</Kbd> or click outside to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Kbd — inline keyboard key badge ──────────────────────────────────── */

/**
 * Renders a single keyboard key in a small rounded badge.
 * Used inside the overlay rows and descriptive text.
 */
function Kbd({ children }) {
  return (
    <kbd
      className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold leading-none tracking-wider"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--glass-border)',
        color: 'var(--accent-cyan)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        minWidth: '22px',
        textAlign: 'center',
      }}
    >
      {children}
    </kbd>
  );
}
