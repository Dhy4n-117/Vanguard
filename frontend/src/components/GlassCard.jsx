'use client';

/**
 * GlassCard — Reusable glassmorphism panel with spotlight glow.
 * Wraps content in a glass-effect container.
 * Supports optional onClick for interactive cards and hover elevation.
 */

export default function GlassCard({ children, className = '', variant = 'cyan', onClick, interactive = false, ...props }) {
  return (
    <div
      className={`glass-card glass-card--${variant} ${interactive || onClick ? 'cursor-pointer hover:brightness-110 active:scale-[0.99] transition-transform' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
