'use client';

/**
 * LiveFeed — Real-time event ticker that shows incoming cyber events as they stream in.
 * Displayed as a horizontal scrolling feed at the bottom of the dashboard.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { startStream, stopStream } from '../lib/api';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const MAX_EVENTS = 50;

export default function LiveFeed({ onNewEvent }) {
  const [events, setEvents] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const feedRef = useRef(null);

  const handleEvent = useCallback((type, data) => {
    if (type === 'NEW_EVENT') {
      setEvents(prev => {
        const updated = [data, ...prev];
        return updated.slice(0, MAX_EVENTS);
      });

      // Notify parent (for graph refresh)
      if (onNewEvent) onNewEvent(data);
    }
  }, [onNewEvent]);

  const { isConnected } = useWebSocket({
    onEvent: handleEvent,
    enabled: isStreaming,
  });

  const toggleStream = async () => {
    try {
      if (isStreaming) {
        await stopStream();
        setIsStreaming(false);
      } else {
        await startStream(4); // event every 4 seconds
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Stream toggle failed:', err);
    }
  };

  return (
    <div
      className="glass-card px-4 py-2 flex items-center gap-3"
      style={{ borderRadius: '12px' }}
    >
      {/* Stream control */}
      <button
        onClick={toggleStream}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-display tracking-widest cursor-pointer transition-all duration-200"
        style={{
          background: isStreaming ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          color: isStreaming ? '#ef4444' : '#22c55e',
          border: `1px solid ${isStreaming ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: isStreaming ? '#ef4444' : '#6b7280',
            animation: isStreaming ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
          }}
        />
        {isStreaming ? 'STOP LIVE' : 'GO LIVE'}
      </button>

      {/* Status */}
      {isStreaming && (
        <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {isConnected ? 'CONNECTED' : 'RECONNECTING...'}
          {events.length > 0 && ` · ${events.length} events`}
        </span>
      )}

      {/* Event ticker */}
      <div ref={feedRef} className="flex-1 overflow-hidden" style={{ minWidth: 0 }}>
        {events.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {events.slice(0, 10).map((evt, i) => (
              <div
                key={`${evt.id}-${i}`}
                className="flex items-center gap-2 px-3 py-1 rounded-lg animate-fade-in-up"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${SEVERITY_COLORS[evt.severity]}20`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: SEVERITY_COLORS[evt.severity] }}
                />
                <span className="text-[10px] font-mono" style={{ color: SEVERITY_COLORS[evt.severity] }}>
                  {evt.severity?.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {evt.event_type?.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-primary)' }}>
                  {evt.target_asset}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {isStreaming ? 'Waiting for events...' : 'Click "GO LIVE" to start real-time monitoring'}
          </span>
        )}
      </div>
    </div>
  );
}
