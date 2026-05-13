'use client';

/**
 * useWebSocket — React hook for real-time event streaming.
 * Connects to the FastAPI WebSocket, auto-reconnects, and fires callbacks for each event type.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/ws/stream';
const RECONNECT_DELAY = 3000; // ms

export default function useWebSocket({ onEvent, enabled = true }) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WS] Connected to live stream');
        setIsConnected(true);
      };

      ws.onmessage = (evt) => {
        try {
          const message = JSON.parse(evt.data);
          if (message.type && onEvent) {
            onEvent(message.type, message.data);
          }
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);

        // Auto-reconnect
        if (enabled) {
          reconnectTimer.current = setTimeout(() => {
            if (wsRef.current === ws) connect();
          }, RECONNECT_DELAY);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Error:', err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.warn('[WS] Connection failed:', err);
    }
  }, [enabled, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected };
}
