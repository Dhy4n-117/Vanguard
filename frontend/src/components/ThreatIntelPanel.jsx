'use client';

import React, { useMemo } from 'react';

// Simple deterministic hash for a string
function stringHash(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateThreatIntel(node) {
  if (!node) return null;
  const hash = stringHash(node.id || node.name || 'default');
  
  if (node.type === 'IPAddress') {
    const isps = ['Rostelecom', 'China Telecom', 'OVH SAS', 'DigitalOcean', 'Hetzner'];
    const countries = ['Russia', 'China', 'North Korea', 'Iran', 'Brazil', 'Vietnam', 'India', 'Romania'];
    const malwares = ['Cobalt Strike', 'Emotet', 'TrickBot', 'Mimikatz', 'Sliver C2'];
    const allTags = ['Scanner', 'Botnet', 'C2 Server', 'Tor Exit Node', 'VPN Endpoint', 'Malware Host'];
    
    const reputationScore = 100 - (hash % 101); // 0-100
    const country = countries[hash % countries.length];
    const isp = isps[(hash >> 1) % isps.length];
    const abuseReports = (hash % 500) + 12;
    
    // Pick 2 malwares deterministically
    const m1 = malwares[hash % malwares.length];
    const m2 = malwares[(hash + 1) % malwares.length];
    const associatedMalware = m1 === m2 ? [m1] : [m1, m2];
    
    // Pick 2-3 tags
    const numTags = (hash % 2) + 2;
    const tags = [];
    for (let i = 0; i < numTags; i++) {
      tags.push(allTags[(hash + i * 3) % allTags.length]);
    }
    
    return {
      type: 'IPAddress',
      reputationScore,
      country,
      isp,
      abuseReports,
      firstSeen: new Date(Date.now() - (hash % 365) * 86400000).toISOString().split('T')[0],
      lastSeen: new Date(Date.now() - (hash % 5) * 86400000).toISOString().split('T')[0],
      associatedMalware,
      tags
    };
  }
  
  if (node.type === 'ThreatActor') {
    const motivations = ['Espionage', 'Financial', 'Hacktivism', 'Destruction'];
    const countries = ['Russia', 'China', 'North Korea', 'Iran', 'Unknown'];
    const sectors = ['Government', 'Finance', 'Healthcare', 'Energy', 'Technology', 'Defense', 'Education'];
    const ttps = ['T1566', 'T1059', 'T1105', 'T1003', 'T1055', 'T1078', 'T1068', 'T1573'];
    
    const country = countries[hash % countries.length];
    const motivation = motivations[(hash >> 1) % motivations.length];
    const activeSince = 2010 + (hash % 14);
    
    const numTTPs = (hash % 4) + 3; // 3 to 6 TTPs
    const knownTTPs = [];
    for(let i = 0; i < numTTPs; i++) {
      knownTTPs.push(ttps[(hash + i * 2) % ttps.length]);
    }
    
    const numSectors = (hash % 3) + 2; // 2 to 4 sectors
    const targetSectors = [];
    for(let i = 0; i < numSectors; i++) {
      targetSectors.push(sectors[(hash + i) % sectors.length]);
    }
    
    const aliases = [
      `APT-${(hash % 99) + 1}`,
      `${country === 'Russia' ? 'Bear' : country === 'China' ? 'Panda' : country === 'Iran' ? 'Kitten' : 'Spider'}-${hash % 50}`
    ];
    
    return {
      type: 'ThreatActor',
      aliases,
      attribution: country,
      motivation,
      knownTTPs,
      activeSince,
      targetSectors
    };
  }
  
  return null;
}

export default function ThreatIntelPanel({ node, isOpen, onClose }) {
  const intel = useMemo(() => generateThreatIntel(node), [node]);

  if (!isOpen || !node || !intel) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[360px] z-50 flex flex-col animate-fade-in-up"
         style={{ background: 'rgba(10, 15, 30, 0.95)', backdropFilter: 'blur(20px)', borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.1))' }}>
      
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--glass-border, rgba(255,255,255,0.1))' }}>
        <div>
          <h2 className="font-display tracking-widest uppercase text-[14px]" style={{ color: 'var(--text-primary, #f1f5f9)' }}>
            Threat Intelligence
          </h2>
          <div className="text-[10px] font-mono" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
            OSINT Analysis
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-xs p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-secondary, #94a3b8)' }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Entity Title & Type */}
        <div>
          <div className="text-[20px] font-mono font-bold break-all" style={{ color: node.type === 'ThreatActor' ? 'var(--accent-red, #ef4444)' : 'var(--accent-amber, #f59e0b)' }}>
            {node.name || node.id}
          </div>
          <div className="text-[10px] font-mono tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted, #64748b)' }}>
            {node.type}
          </div>
        </div>

        {intel.type === 'IPAddress' && (
          <>
            {/* Reputation Score */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-elevated, rgba(30, 41, 59, 0.5))' }}>
              <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center font-mono text-lg"
                   style={{ 
                     borderColor: intel.reputationScore < 40 ? 'var(--accent-red, #ef4444)' : intel.reputationScore < 70 ? 'var(--accent-amber, #f59e0b)' : 'var(--accent-emerald, #10b981)',
                     color: intel.reputationScore < 40 ? 'var(--accent-red, #ef4444)' : intel.reputationScore < 70 ? 'var(--accent-amber, #f59e0b)' : 'var(--accent-emerald, #10b981)'
                   }}>
                {intel.reputationScore}
              </div>
              <div>
                <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted, #64748b)' }}>Reputation Score</div>
                <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-primary, #f1f5f9)' }}>
                  {intel.reputationScore < 40 ? 'MALICIOUS' : intel.reputationScore < 70 ? 'SUSPICIOUS' : 'BENIGN'}
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="space-y-3">
              <div className="text-[9px] font-mono tracking-widest uppercase border-b pb-1" style={{ color: 'var(--accent-cyan, #06b6d4)', borderColor: 'var(--glass-border, rgba(255,255,255,0.1))' }}>
                Infrastructure Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Country:</div>
                <div style={{ color: 'var(--text-primary, #f1f5f9)' }}>{intel.country}</div>
                <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>ISP:</div>
                <div style={{ color: 'var(--text-primary, #f1f5f9)' }}>{intel.isp}</div>
                <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>First Seen:</div>
                <div style={{ color: 'var(--text-primary, #f1f5f9)' }}>{intel.firstSeen}</div>
                <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Last Seen:</div>
                <div style={{ color: 'var(--text-primary, #f1f5f9)' }}>{intel.lastSeen}</div>
                <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Abuse Reports:</div>
                <div style={{ color: 'var(--accent-red, #ef4444)' }}>{intel.abuseReports}</div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <div className="text-[9px] font-mono tracking-widest uppercase border-b pb-1" style={{ color: 'var(--accent-cyan, #06b6d4)', borderColor: 'var(--glass-border, rgba(255,255,255,0.1))' }}>
                Associated Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {intel.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-md text-[10px] font-mono border" 
                        style={{ color: 'var(--accent-amber, #f59e0b)', borderColor: 'rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.1)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Malware */}
            <div className="space-y-3">
              <div className="text-[9px] font-mono tracking-widest uppercase border-b pb-1" style={{ color: 'var(--accent-cyan, #06b6d4)', borderColor: 'var(--glass-border, rgba(255,255,255,0.1))' }}>
                Observed Malware
              </div>
              <div className="flex flex-wrap gap-2">
                {intel.associatedMalware.map(malware => (
                  <span key={malware} className="px-2 py-1 rounded-md text-[10px] font-mono border" 
                        style={{ color: 'var(--accent-red, #ef4444)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.1)' }}>
                    {malware}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {intel.type === 'ThreatActor' && (
          <>
            {/* General Info */}
            <div className="space-y-3">
              <div className="text-[9px] font-mono tracking-widest uppercase border-b pb-1" style={{ color: 'var(--accent-cyan, #06b6d4)', borderColor: 'var(--glass-border, rgba(255,255,255,0.1))' }}>
                Profile
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Attribution:</div>
                <div style={{ color: 'var(--text-primary, #f1f5f9)' }}>{intel.attribution}</div>
                <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Motivation:</div>
                <div style={{ color: 'var(--text-primary, #f1f5f9)' }}>{intel.motivation}</div>
                <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Active Since:</div>
                <div style={{ color: 'var(--text-primary, #f1f5f9)' }}>{intel.activeSince}</div>
              </div>
            </div>

            {/* Aliases */}
            <div className="space-y-3">
              <div className="text-[9px] font-mono tracking-widest uppercase border-b pb-1" style={{ color: 'var(--accent-cyan, #06b6d4)', borderColor: 'var(--glass-border, rgba(255,255,255,0.1))' }}>
                Known Aliases
              </div>
              <div className="flex flex-wrap gap-2">
                {intel.aliases.map(alias => (
                  <span key={alias} className="px-2 py-1 rounded-md text-[10px] font-mono border" 
                        style={{ color: 'var(--accent-purple, #a855f7)', borderColor: 'rgba(168, 85, 247, 0.2)', background: 'rgba(168, 85, 247, 0.1)' }}>
                    {alias}
                  </span>
                ))}
              </div>
            </div>

            {/* Sectors */}
            <div className="space-y-3">
              <div className="text-[9px] font-mono tracking-widest uppercase border-b pb-1" style={{ color: 'var(--accent-cyan, #06b6d4)', borderColor: 'var(--glass-border, rgba(255,255,255,0.1))' }}>
                Target Sectors
              </div>
              <div className="flex flex-wrap gap-2">
                {intel.targetSectors.map(sector => (
                  <span key={sector} className="px-2 py-1 rounded-md text-[10px] font-mono border" 
                        style={{ color: 'var(--accent-magenta, #d946ef)', borderColor: 'rgba(217, 70, 239, 0.2)', background: 'rgba(217, 70, 239, 0.1)' }}>
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            {/* TTPs */}
            <div className="space-y-3">
              <div className="text-[9px] font-mono tracking-widest uppercase border-b pb-1" style={{ color: 'var(--accent-cyan, #06b6d4)', borderColor: 'var(--glass-border, rgba(255,255,255,0.1))' }}>
                Known TTPs (MITRE ATT&CK)
              </div>
              <div className="flex flex-wrap gap-2">
                {intel.knownTTPs.map(ttp => (
                  <span key={ttp} className="px-2 py-1 rounded-md text-[10px] font-mono border" 
                        style={{ color: 'var(--accent-amber, #f59e0b)', borderColor: 'rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.1)' }}>
                    {ttp}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
