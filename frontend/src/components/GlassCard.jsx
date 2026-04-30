'use client';

/**
 * GlassCard — Reusable glassmorphism panel with spotlight glow.
 * Wraps content in a glass-effect container.
 */

export default function GlassCard({ children, className = '', variant = 'cyan', ...props }) {
  return (
    <div
      className={`glass-card glass-card--${variant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
