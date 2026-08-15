'use client';
import React, { useState, useEffect, useMemo } from 'react';

function generateIncidentSummary(graphData) {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return {
      summary: 'No threat data available. Ingest logs to generate incident analysis.',
      severity: 'low',
      stats: { actors: 0, ips: 0, assets: 0, vulns: 0, events: 0 }
    };
  }

  const nodes = graphData.nodes || [];
  const eventsData = graphData.events || [];

  const actors = nodes.filter(n => n.type === 'ThreatActor');
  const ips = nodes.filter(n => n.type === 'IPAddress');
  const assets = nodes.filter(n => n.type === 'Asset');
  const vulns = nodes.filter(n => n.type === 'Vulnerability');
  const events = nodes.filter(n => n.type === 'LogEntry').concat(eventsData); // Using events from either source

  const stats = {
    actors: actors.length,
    ips: ips.length,
    assets: assets.length,
    vulns: vulns.length,
    events: events.length
  };

  const highSeverityEvents = events.filter(e => e.severity === 'critical' || e.severity === 'high');
  const severity = highSeverityEvents.length > 5 ? 'critical' : (highSeverityEvents.length > 0 ? 'high' : 'medium');
  
  let actorInfo = '';
  if (actors.length > 0) {
    const mainActor = actors.sort((a, b) => (b.degree || 0) - (a.degree || 0))[0];
    actorInfo = ` from ${mainActor.id || mainActor.label || 'Unknown Actor'} (origin: ${mainActor.origin || 'Unknown'})`;
  }

  let vulnInfo = '';
  if (vulns.length > 0) {
    vulnInfo = ` The attack chain involves ${vulns[0].id || vulns[0].label}.`;
  }

  const summary = `🔴 INCIDENT SUMMARY: ${assets.length} critical assets are under active threat${actorInfo}.${vulnInfo} ${highSeverityEvents.length} high/critical-severity events detected in the last 24 hours.`;

  return { summary, severity, stats };
}

export default function IncidentSummaryCard({ graphData, isVisible }) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isVisible) setDismissed(false);
  }, [isVisible]);

  const { summary, severity } = useMemo(() => generateIncidentSummary(graphData), [graphData]);

  if (!isVisible || dismissed) return null;

  const severityColor = 
    severity === 'critical' ? 'var(--accent-red)' :
    severity === 'high' ? 'var(--accent-amber)' :
    severity === 'medium' ? 'var(--accent-emerald)' : 'var(--text-muted)';

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-40 w-[300px] rounded-xl overflow-hidden animate-fade-in-up flex flex-col"
      style={{ 
        background: 'rgba(10, 15, 30, 0.95)', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid var(--glass-border)' 
      }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: severityColor }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display tracking-widest text-[9px] text-[var(--text-primary)]">🧠 INCIDENT ANALYSIS</h3>
        </div>
        
        <p className="font-mono text-xs text-[var(--text-secondary)] leading-relaxed">
          {summary}
        </p>

        <div className="flex justify-end gap-2 mt-2">
          <button 
            onClick={handleCopy}
            className="px-2 py-1 rounded-lg text-[10px] font-mono transition-colors"
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.2)'
            }}
          >
            {copied ? 'COPIED!' : 'COPY TO CLIPBOARD'}
          </button>
          <button 
            onClick={() => setDismissed(true)}
            className="px-2 py-1 rounded-lg text-[10px] font-mono transition-colors"
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
