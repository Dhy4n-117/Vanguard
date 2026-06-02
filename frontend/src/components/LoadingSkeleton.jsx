'use client';

/**
 * LoadingSkeleton — Shimmer skeleton placeholders for dashboard panels.
 * Shows animated pulse bars that match the cyberpunk aesthetic while content loads.
 */

/**
 * A single shimmer bar with configurable width and height.
 */
function ShimmerBar({ width = '100%', height = '12px', className = '', delay = 0 }) {
  return (
    <div
      className={`rounded ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(59,130,246,0.08) 50%, rgba(255,255,255,0.03) 75%)',
        backgroundSize: '200% 100%',
        animation: `shimmer 1.8s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

/**
 * Graph panel skeleton — simulates the force-graph loading state.
 */
export function GraphSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
      {/* Fake node circles */}
      <div className="relative w-48 h-48">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 12 + i * 4,
              height: 12 + i * 4,
              left: `${20 + i * 15}%`,
              top: `${15 + (i % 3) * 25}%`,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              animation: `pulse 2s ease-in-out infinite`,
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
          <line x1="30%" y1="25%" x2="50%" y2="40%" stroke="var(--accent-cyan)" strokeWidth="1" />
          <line x1="50%" y1="40%" x2="70%" y2="30%" stroke="var(--accent-cyan)" strokeWidth="1" />
          <line x1="45%" y1="65%" x2="65%" y2="50%" stroke="var(--accent-cyan)" strokeWidth="1" />
        </svg>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
          Initializing Threat Graph
        </p>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--accent-cyan)',
                animation: `pulse 1.4s ease-in-out infinite`,
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Chat panel skeleton — simulates chat messages loading.
 */
export function ChatSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-3 p-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="w-8 h-8 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.1)' }} />
        <ShimmerBar width="120px" height="14px" />
      </div>

      {/* Message skeletons */}
      <div className="flex-1 flex flex-col gap-4 py-2">
        {/* AI message */}
        <div className="flex gap-2 max-w-[80%]">
          <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)' }} />
          <div className="flex flex-col gap-1.5 flex-1">
            <ShimmerBar width="90%" height="10px" delay={0} />
            <ShimmerBar width="75%" height="10px" delay={100} />
            <ShimmerBar width="60%" height="10px" delay={200} />
          </div>
        </div>

        {/* User message */}
        <div className="flex gap-2 max-w-[70%] self-end">
          <div className="flex flex-col gap-1.5 flex-1 items-end">
            <ShimmerBar width="80%" height="10px" delay={300} />
            <ShimmerBar width="50%" height="10px" delay={400} />
          </div>
        </div>

        {/* Another AI message */}
        <div className="flex gap-2 max-w-[80%]">
          <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)' }} />
          <div className="flex flex-col gap-1.5 flex-1">
            <ShimmerBar width="85%" height="10px" delay={500} />
            <ShimmerBar width="65%" height="10px" delay={600} />
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <ShimmerBar width="100%" height="36px" />
      </div>

      {/* Global shimmer keyframe */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Stats bar skeleton — simulates stat cards loading.
 */
export function StatsSkeleton() {
  return (
    <div className="flex gap-3 w-full">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="flex-1 rounded-xl p-3 border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <ShimmerBar width="40%" height="8px" delay={i * 100} />
          <div className="mt-2">
            <ShimmerBar width="60%" height="18px" delay={i * 100 + 50} />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export default { GraphSkeleton, ChatSkeleton, StatsSkeleton };
