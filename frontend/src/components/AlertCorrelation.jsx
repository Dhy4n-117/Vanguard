'use client';
import React, { useState, useMemo } from 'react';

function correlateAlerts(events) {
  if (!events || events.length === 0) return { chains: [], standalone: [] };
  
  // Sort events by timestamp safely
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  
  const chains = [];
  const standalone = [];
  const assigned = new Set();
  
  let chainId = 1;

  for (let i = 0; i < sortedEvents.length; i++) {
    if (assigned.has(i)) continue;
    
    const baseEvent = sortedEvents[i];
    const currentChain = [baseEvent];
    assigned.add(i);
    
    for (let j = i + 1; j < sortedEvents.length; j++) {
      if (assigned.has(j)) continue;
      const targetEvent = sortedEvents[j];
      
      const timeDiff = new Date(targetEvent.timestamp || 0).getTime() - new Date(baseEvent.timestamp || 0).getTime();
      const isWithin5Min = timeDiff <= 5 * 60 * 1000;
      const isWithin3Min = timeDiff <= 3 * 60 * 1000;
      
      let match = false;
      
      if (baseEvent.source_ip && baseEvent.source_ip === targetEvent.source_ip && isWithin5Min) {
        match = true;
      } else if (baseEvent.target_asset && baseEvent.target_asset === targetEvent.target_asset && isWithin3Min) {
        match = true;
      } else if (baseEvent.event_type === 'port_scan' && targetEvent.event_type === 'brute_force' && baseEvent.source_ip === targetEvent.source_ip && isWithin5Min) {
        match = true; // Heuristic sequential pattern example
      }
      
      if (match) {
        currentChain.push(targetEvent);
        assigned.add(j);
      }
    }
    
    if (currentChain.length > 1) {
      chains.push({
        id: `chain-${chainId++}`,
        name: `Attack Chain #${chainId - 1}: ${currentChain[0].event_type || 'Recon'} → ${currentChain[currentChain.length - 1].event_type || 'Activity'}`,
        events: currentChain,
        maxSeverity: currentChain.reduce((max, e) => {
          if (max === 'critical' || e.severity === 'critical') return 'critical';
          if (max === 'high' || e.severity === 'high') return 'high';
          if (max === 'medium' || e.severity === 'medium') return 'medium';
          return max;
        }, 'low')
      });
    } else {
      standalone.push(baseEvent);
    }
  }
  
  chains.sort((a, b) => {
    if (a.maxSeverity === 'critical' && b.maxSeverity !== 'critical') return -1;
    if (b.maxSeverity === 'critical' && a.maxSeverity !== 'critical') return 1;
    if (a.maxSeverity === 'high' && b.maxSeverity !== 'high') return -1;
    if (b.maxSeverity === 'high' && a.maxSeverity !== 'high') return 1;
    return new Date(b.events[b.events.length - 1].timestamp || 0).getTime() - new Date(a.events[a.events.length - 1].timestamp || 0).getTime();
  });
  
  return { chains, standalone };
}

export default function AlertCorrelation({ events, isVisible }) {
  const [expandedChains, setExpandedChains] = useState(new Set());
  
  const { chains, standalone } = useMemo(() => correlateAlerts(events), [events]);
  
  if (!isVisible) return null;

  const toggleChain = (id) => {
    const newExpanded = new Set(expandedChains);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedChains(newExpanded);
  };
  
  const getSeverityColor = (sev) => {
    if (sev === 'critical') return 'var(--accent-red)';
    if (sev === 'high') return 'var(--accent-amber)';
    if (sev === 'medium') return 'var(--accent-emerald)';
    return 'var(--accent-cyan)';
  };

  const formatTime = (ts) => {
    if (!ts) return 'Unknown Time';
    return new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
  };

  return (
    <div 
      className="flex flex-col rounded-xl overflow-hidden w-full h-full max-h-[300px]"
      style={{ 
        background: 'rgba(10, 15, 30, 0.95)', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid var(--glass-border)' 
      }}
    >
      <div className="p-3 border-b border-[var(--glass-border)] bg-[rgba(15,23,42,0.6)] flex items-center justify-between sticky top-0 z-10">
        <h3 className="font-display tracking-widest text-[9px] text-[var(--text-primary)] uppercase">🔗 ALERT CORRELATION</h3>
        <span className="font-mono text-[9px] text-[var(--accent-cyan)]">{chains.length} CHAINS DETECTED</span>
      </div>
      
      <div className="overflow-y-auto p-3 flex flex-col gap-4 font-mono">
        {chains.length === 0 && standalone.length === 0 && (
          <div className="text-[10px] text-[var(--text-muted)] text-center py-4">
            No events to correlate.
          </div>
        )}
        
        {chains.map(chain => {
          const isExpanded = expandedChains.has(chain.id);
          const lineColor = getSeverityColor(chain.maxSeverity);
          
          return (
            <div key={chain.id} className="flex flex-col gap-2">
              <div 
                className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                style={{ border: `1px solid ${lineColor}40`, background: `${lineColor}10` }}
                onClick={() => toggleChain(chain.id)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--text-primary)] font-bold">{chain.name}</span>
                  <span className="text-[9px] text-[var(--text-secondary)]">
                    {chain.events.length} events • {formatTime(chain.events[0].timestamp)} - {formatTime(chain.events[chain.events.length - 1].timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[9px] px-1.5 py-0.5 rounded uppercase"
                    style={{ background: `${lineColor}20`, color: lineColor }}
                  >
                    {chain.maxSeverity}
                  </span>
                  <span className="text-[var(--text-muted)] text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>
              
              {isExpanded && (
                <div className="pl-4 relative flex flex-col gap-3 py-2 border-l-2 ml-4" style={{ borderColor: `${lineColor}40` }}>
                  {chain.events.map((evt, idx) => (
                    <div key={idx} className="relative flex items-center gap-3">
                      <div 
                        className="absolute -left-[21px] w-3 h-3 rounded-full border-[2px]"
                        style={{ background: 'var(--bg-base)', borderColor: lineColor }}
                      />
                      <span className="text-[10px] text-[var(--text-muted)] w-16 shrink-0">
                        {formatTime(evt.timestamp)}
                      </span>
                      <span className="text-[10px] text-[var(--text-primary)] bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded">
                        {evt.event_type || 'Unknown'}
                      </span>
                      {evt.source_ip && <span className="text-[9px] text-[var(--accent-amber)]">{evt.source_ip}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {standalone.length > 0 && (
          <div className="mt-2">
            <h4 className="font-display tracking-widest text-[9px] text-[var(--text-muted)] mb-2 uppercase">STANDALONE ALERTS</h4>
            <div className="flex flex-col gap-2">
              {standalone.map((evt, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px]">
                  <span className="text-[var(--text-muted)] w-16 shrink-0">
                    {formatTime(evt.timestamp)}
                  </span>
                  <span className="text-[var(--text-secondary)]">{evt.event_type || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
