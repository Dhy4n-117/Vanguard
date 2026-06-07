'use client';

/**
 * GeoThreatMap — Interactive world map showing threat actor origins,
 * asset locations, and attack paths using Leaflet.js with dark tiles.
 */

import { useEffect, useRef, useMemo, useState } from 'react';
import { X, Maximize2, Minimize2, Layers, Crosshair } from 'lucide-react';
import { buildGeoData } from '../lib/geoData';

// Color mapping for different entity types
const TYPE_COLORS = {
  threat: '#ef4444',
  asset: '#3b82f6',
  ip: '#f59e0b',
};

const LINK_COLORS = {
  ATTACKED: '#ef4444',
  EXPLOITS: '#f97316',
  SCANNED: '#eab308',
  LOGGED_BY: '#06b6d4',
  CONNECTED_TO: '#8b5cf6',
  DEFAULT: '#64748b',
};

export default function GeoThreatMap({ isOpen, onClose, graphData }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [stats, setStats] = useState({ threats: 0, assets: 0, ips: 0, connections: 0 });

  // Build geo data from graph
  const geoData = useMemo(() => {
    if (!graphData?.nodes?.length) return { markers: [], connections: [] };
    return buildGeoData(graphData);
  }, [graphData]);

  // Initialize map
  useEffect(() => {
    if (!isOpen || mapInstanceRef.current) return;

    // Dynamically import Leaflet (it needs window)
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2.5,
        minZoom: 2,
        maxZoom: 12,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
      });

      // CartoDB Dark Matter tiles — cyberpunk aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Zoom controls (bottom right)
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution (bottom left, small)
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

      mapInstanceRef.current = map;

      // Force a resize after mount
      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Update markers and connections when geo data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isOpen) return;

    const updateMap = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      // Clear previous layers
      layersRef.current.forEach(layer => map.removeLayer(layer));
      layersRef.current = [];

      let threatCount = 0, assetCount = 0, ipCount = 0;

      // Add markers
      geoData.markers.forEach(marker => {
        const color = TYPE_COLORS[marker.type] || '#64748b';
        const radius = marker.type === 'threat' ? 8 : marker.type === 'asset' ? 6 : 5;

        if (marker.type === 'threat') threatCount++;
        else if (marker.type === 'asset') assetCount++;
        else ipCount++;

        // Outer glow circle
        const glow = L.circleMarker([marker.lat, marker.lng], {
          radius: radius + 8,
          fillColor: color,
          fillOpacity: 0.15,
          stroke: false,
          className: marker.type === 'threat' ? 'threat-pulse' : '',
        }).addTo(map);
        layersRef.current.push(glow);

        // Main marker
        const circle = L.circleMarker([marker.lat, marker.lng], {
          radius: radius,
          fillColor: color,
          fillOpacity: 0.9,
          color: color,
          weight: 2,
          opacity: 0.8,
        }).addTo(map);

        // Tooltip
        const tooltipContent = `
          <div style="
            background: rgba(10,15,25,0.95);
            border: 1px solid ${color}40;
            border-radius: 8px;
            padding: 8px 12px;
            font-family: 'JetBrains Mono', monospace;
            color: #f1f5f9;
            font-size: 10px;
            min-width: 140px;
            backdrop-filter: blur(8px);
          ">
            <div style="color: ${color}; font-weight: 700; font-size: 11px; margin-bottom: 4px; letter-spacing: 0.5px;">
              ${marker.type === 'threat' ? '🎭' : marker.type === 'asset' ? '🖥️' : '🌐'} ${marker.name}
            </div>
            <div style="color: #94a3b8; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;">
              ${marker.label} · ${marker.city || 'Unknown'}
            </div>
            <div style="color: #64748b; font-size: 8px; margin-top: 2px;">
              ${marker.country} · ${marker.lat.toFixed(2)}°, ${marker.lng.toFixed(2)}°
            </div>
          </div>
        `;

        circle.bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'top',
          offset: [0, -12],
          className: 'geo-tooltip',
        });

        layersRef.current.push(circle);
      });

      // Add connection arcs
      if (showConnections) {
        geoData.connections.forEach(conn => {
          const linkColor = LINK_COLORS[conn.type] || LINK_COLORS.DEFAULT;
          
          // Calculate curved path (great circle approximation)
          const midLat = (conn.from.lat + conn.to.lat) / 2;
          const midLng = (conn.from.lng + conn.to.lng) / 2;
          const dist = Math.sqrt(
            Math.pow(conn.to.lat - conn.from.lat, 2) + 
            Math.pow(conn.to.lng - conn.from.lng, 2)
          );
          const curveLat = midLat + dist * 0.15;
          const curveLng = midLng;

          // Draw curved polyline using multiple segments
          const points = [];
          const segments = 30;
          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const lat = (1-t)*(1-t)*conn.from.lat + 2*(1-t)*t*curveLat + t*t*conn.to.lat;
            const lng = (1-t)*(1-t)*conn.from.lng + 2*(1-t)*t*curveLng + t*t*conn.to.lng;
            points.push([lat, lng]);
          }

          const line = L.polyline(points, {
            color: linkColor,
            weight: 1.5,
            opacity: 0.5,
            dashArray: conn.type === 'ATTACKED' ? null : '5 8',
            className: 'attack-arc',
          }).addTo(map);

          line.bindTooltip(
            `<div style="
              background: rgba(10,15,25,0.9);
              border: 1px solid ${linkColor}60;
              border-radius: 6px;
              padding: 4px 8px;
              font-family: 'JetBrains Mono', monospace;
              color: ${linkColor};
              font-size: 9px;
              letter-spacing: 0.5px;
            ">
              ${conn.from.name} → ${conn.to.name}<br/>
              <span style="color: #64748b;">${conn.type.replace(/_/g, ' ')}</span>
            </div>`,
            { className: 'geo-tooltip' }
          );

          layersRef.current.push(line);
        });
      }

      setStats({
        threats: threatCount,
        assets: assetCount,
        ips: ipCount,
        connections: geoData.connections.length,
      });
    };

    updateMap();
  }, [geoData, isOpen, showConnections]);

  // Handle resize on fullscreen toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 300);
    }
  }, [isFullscreen]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([20, 0], 2.5, { animate: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-500 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-[92vw] h-[88vh]'
        }`}
        style={{ 
          background: 'rgba(10, 15, 25, 0.95)',
          borderColor: 'var(--glass-border)',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--glass-border)', background: 'rgba(10, 15, 25, 0.8)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌍</span>
            <div>
              <h2 className="font-display text-sm tracking-[0.15em] uppercase" style={{ color: 'var(--accent-cyan)' }}>
                GEO-THREAT MAP
              </h2>
              <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                Global threat intelligence visualization
              </p>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {[
                { label: 'THREATS', value: stats.threats, color: '#ef4444' },
                { label: 'ASSETS', value: stats.assets, color: '#3b82f6' },
                { label: 'IPs', value: stats.ips, color: '#f59e0b' },
                { label: 'ARCS', value: stats.connections, color: '#8b5cf6' },
              ].map(s => (
                <div 
                  key={s.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                  style={{ borderColor: `${s.color}30`, background: `${s.color}10` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-[9px] font-mono tracking-wider" style={{ color: s.color }}>
                    {s.value}
                  </span>
                  <span className="text-[8px] font-mono tracking-widest uppercase" style={{ color: '#64748b' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setShowConnections(prev => !prev)}
                className="p-1.5 rounded-lg transition-colors border"
                style={{ 
                  borderColor: showConnections ? 'rgba(139, 92, 246, 0.3)' : 'var(--glass-border)',
                  background: showConnections ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                  color: showConnections ? '#8b5cf6' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="Toggle connection arcs"
              >
                <Layers size={14} />
              </button>
              <button
                onClick={handleRecenter}
                className="p-1.5 rounded-lg transition-colors border"
                style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Reset view"
              >
                <Crosshair size={14} />
              </button>
              <button
                onClick={() => setIsFullscreen(prev => !prev)}
                className="p-1.5 rounded-lg transition-colors border"
                style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors border ml-1"
                style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer' }}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* Legend */}
          <div 
            className="absolute bottom-4 left-4 z-[1000] rounded-xl border p-3"
            style={{ 
              background: 'rgba(10, 15, 25, 0.9)', 
              borderColor: 'var(--glass-border)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p className="text-[8px] font-mono tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
              Legend
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { color: '#ef4444', label: 'Threat Actors', icon: '🎭' },
                { color: '#3b82f6', label: 'Protected Assets', icon: '🖥️' },
                { color: '#f59e0b', label: 'IP Addresses', icon: '🌐' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}60` }} />
                  <span className="text-[9px] font-mono" style={{ color: '#94a3b8' }}>
                    {item.icon} {item.label}
                  </span>
                </div>
              ))}
              <div className="h-px my-1" style={{ background: 'var(--glass-border)' }} />
              {[
                { color: '#ef4444', label: 'Attack Path', style: 'solid' },
                { color: '#06b6d4', label: 'Log Connection', style: 'dashed' },
                { color: '#8b5cf6', label: 'Network Link', style: 'dashed' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-4 h-0 border-t" style={{ 
                    borderColor: item.color, 
                    borderStyle: item.style,
                    borderWidth: '1.5px',
                  }} />
                  <span className="text-[9px] font-mono" style={{ color: '#94a3b8' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {geoData.markers.length === 0 && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-4xl mb-3 opacity-30">🌍</div>
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  No geo-data available
                </p>
                <p className="text-[9px] font-mono mt-1" style={{ color: '#475569' }}>
                  Ingest data or simulate an attack to populate the map
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Custom styles */}
        <style jsx global>{`
          .geo-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .geo-tooltip .leaflet-tooltip-content {
            margin: 0;
          }
          .threat-pulse {
            animation: geoThreatPulse 2s ease-in-out infinite;
          }
          @keyframes geoThreatPulse {
            0%, 100% { opacity: 0.15; r: 16; }
            50% { opacity: 0.35; r: 22; }
          }
          .attack-arc {
            animation: arcFlow 3s linear infinite;
          }
          @keyframes arcFlow {
            to { stroke-dashoffset: -26; }
          }
          .leaflet-control-zoom a {
            background: rgba(10, 15, 25, 0.9) !important;
            color: #94a3b8 !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            font-size: 14px !important;
            width: 30px !important;
            height: 30px !important;
            line-height: 30px !important;
          }
          .leaflet-control-zoom a:hover {
            background: rgba(59, 130, 246, 0.2) !important;
            color: #3b82f6 !important;
          }
          .leaflet-control-attribution {
            background: rgba(10, 15, 25, 0.7) !important;
            color: #475569 !important;
            font-size: 8px !important;
            font-family: 'JetBrains Mono', monospace !important;
          }
          .leaflet-control-attribution a {
            color: #64748b !important;
          }
        `}</style>
      </div>
    </div>
  );
}
