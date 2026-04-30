'use client';

/**
 * ForceGraph — Dynamic import wrapper for react-force-graph-2d.
 * SSR is disabled since the library requires browser APIs.
 */

import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-3"
          style={{ color: 'var(--accent-cyan)' }}
        />
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          INITIALIZING GRAPH ENGINE...
        </p>
      </div>
    </div>
  ),
});

export default ForceGraph2D;
