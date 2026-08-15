'use client';

import React, { useMemo } from 'react';

const MITRE_ATTACK_MATRIX = [
  {
    tactic: 'Reconnaissance',
    techniques: [
      { id: 'T1592', name: 'Gather Victim Host Information' },
      { id: 'T1590', name: 'Gather Victim Network Information' },
      { id: 'T1595', name: 'Active Scanning' },
    ]
  },
  {
    tactic: 'Resource Development',
    techniques: [
      { id: 'T1583', name: 'Acquire Infrastructure' },
      { id: 'T1584', name: 'Compromise Infrastructure' },
      { id: 'T1588', name: 'Obtain Capabilities' },
    ]
  },
  {
    tactic: 'Initial Access',
    techniques: [
      { id: 'T1566', name: 'Phishing' },
      { id: 'T1190', name: 'Exploit Public-Facing App' },
      { id: 'T1133', name: 'External Remote Services' },
      { id: 'T1078', name: 'Valid Accounts' }
    ]
  },
  {
    tactic: 'Execution',
    techniques: [
      { id: 'T1059', name: 'Command and Scripting Interpreter' },
      { id: 'T1203', name: 'Exploitation for Client Execution' },
      { id: 'T1053', name: 'Scheduled Task/Job' }
    ]
  },
  {
    tactic: 'Persistence',
    techniques: [
      { id: 'T1098', name: 'Account Manipulation' },
      { id: 'T1543', name: 'Create or Modify System Process' },
      { id: 'T1136', name: 'Create Account' }
    ]
  },
  {
    tactic: 'Privilege Escalation',
    techniques: [
      { id: 'T1548', name: 'Abuse Elevation Control Mechanism' },
      { id: 'T1134', name: 'Access Token Manipulation' },
      { id: 'T1068', name: 'Exploitation for Privilege Escalation' }
    ]
  },
  {
    tactic: 'Defense Evasion',
    techniques: [
      { id: 'T1140', name: 'Deobfuscate/Decode Files' },
      { id: 'T1070', name: 'Indicator Removal' },
      { id: 'T1027', name: 'Obfuscated Files' }
    ]
  },
  {
    tactic: 'Credential Access',
    techniques: [
      { id: 'T1110', name: 'Brute Force' },
      { id: 'T1003', name: 'OS Credential Dumping' },
      { id: 'T1555', name: 'Credentials from Stores' }
    ]
  },
  {
    tactic: 'Discovery',
    techniques: [
      { id: 'T1087', name: 'Account Discovery' },
      { id: 'T1046', name: 'Network Service Discovery' },
      { id: 'T1082', name: 'System Info Discovery' }
    ]
  },
  {
    tactic: 'Lateral Movement',
    techniques: [
      { id: 'T1021', name: 'Remote Services' },
      { id: 'T1570', name: 'Lateral Tool Transfer' },
      { id: 'T1091', name: 'Replication via Media' }
    ]
  },
  {
    tactic: 'Collection',
    techniques: [
      { id: 'T1560', name: 'Archive Collected Data' },
      { id: 'T1119', name: 'Automated Collection' },
      { id: 'T1005', name: 'Data from Local System' }
    ]
  },
  {
    tactic: 'Command & Control',
    techniques: [
      { id: 'T1071', name: 'Application Layer Protocol' },
      { id: 'T1105', name: 'Ingress Tool Transfer' },
      { id: 'T1573', name: 'Encrypted Channel' }
    ]
  },
  {
    tactic: 'Exfiltration',
    techniques: [
      { id: 'T1041', name: 'Exfiltration Over C2' },
      { id: 'T1048', name: 'Exfiltration Over Alt Protocol' },
      { id: 'T1567', name: 'Exfiltration Over Web Service' }
    ]
  },
  {
    tactic: 'Impact',
    techniques: [
      { id: 'T1486', name: 'Data Encrypted for Impact' },
      { id: 'T1489', name: 'Service Stop' },
      { id: 'T1490', name: 'Inhibit System Recovery' }
    ]
  }
];

export default function MitreAttackPanel({ isOpen, onClose, graphData }) {
  const techniqueHits = useMemo(() => {
    const hits = {};
    const addHit = (id, count = 1) => {
      hits[id] = (hits[id] || 0) + count;
    };
    
    if (!graphData?.nodes) return hits;

    graphData.nodes.forEach(node => {
      const label = node.label;
      const name = (node.name || '').toLowerCase();
      const props = node.properties || {};
      const eventType = (props.event_type || '').toLowerCase();
      
      if (label === 'ThreatActor') {
        if (name.includes('apt') || name.includes('bear') || name.includes('spider')) {
          addHit('T1566', 2);
          addHit('T1078', 2);
          addHit('T1021', 1);
          addHit('T1105', 1);
        } else {
          addHit('T1588', 1);
        }
      }
      
      if (label === 'Vulnerability') {
        if (name.includes('cve') || props.cve) {
          addHit('T1190', 2);
          addHit('T1068', 1);
        }
      }
      
      if (label === 'LogEntry') {
        if (eventType.includes('brute') || eventType.includes('login') || name.includes('brute') || name.includes('auth')) {
          addHit('T1110', 1);
          addHit('T1078', 1);
        }
        if (eventType.includes('scan') || name.includes('scan') || name.includes('recon')) {
          addHit('T1595', 1);
          addHit('T1046', 1);
        }
        if (eventType.includes('exfil') || name.includes('exfil') || name.includes('transfer')) {
          addHit('T1041', 2);
        }
        if (eventType.includes('exec') || name.includes('exec') || name.includes('shell')) {
          addHit('T1059', 2);
        }
        if (eventType.includes('malware') || name.includes('malware') || name.includes('ransom')) {
          addHit('T1203', 1);
          addHit('T1486', 3);
        }
        if (eventType.includes('c2') || name.includes('beacon')) {
          addHit('T1071', 2);
        }
      }
    });
    
    return hits;
  }, [graphData]);

  const stats = useMemo(() => {
    let totalTechniques = 0;
    let activeTechniques = 0;
    MITRE_ATTACK_MATRIX.forEach(tactic => {
      tactic.techniques.forEach(tech => {
        totalTechniques++;
        if (techniqueHits[tech.id] > 0) {
          activeTechniques++;
        }
      });
    });
    return { totalTechniques, activeTechniques };
  }, [techniqueHits]);

  if (!isOpen) return null;

  const getHeatColor = (hits) => {
    if (!hits || hits === 0) return 'rgba(30, 41, 59, 0.4)'; // dark/transparent
    if (hits <= 2) return 'rgba(245, 158, 11, 0.3)'; // low amber
    if (hits <= 5) return 'rgba(249, 115, 22, 0.5)'; // medium orange
    return 'rgba(239, 68, 68, 0.7)'; // hot red
  };

  const getBorderColor = (hits) => {
    if (!hits || hits === 0) return 'rgba(71, 85, 105, 0.3)';
    if (hits <= 2) return 'rgba(245, 158, 11, 0.8)';
    if (hits <= 5) return 'rgba(249, 115, 22, 0.9)';
    return 'rgba(239, 68, 68, 1)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-up" 
         style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-[95vw] h-[90vh] rounded-2xl flex flex-col border shadow-2xl relative overflow-hidden"
           style={{ background: 'rgba(10, 15, 30, 0.95)', borderColor: 'var(--glass-border, rgba(148, 163, 184, 0.2))' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--glass-border, rgba(148, 163, 184, 0.2))', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h2 className="text-[14px] font-display text-white tracking-widest uppercase m-0 leading-none">MITRE ATT&CK COVERAGE</h2>
              <div className="text-[10px] font-mono text-[#94a3b8] mt-1">
                {stats.activeTechniques} / {stats.totalTechniques} TECHNIQUES DETECTED
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ✕
          </button>
        </div>

        {/* Matrix Grid */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <div className="flex gap-4 min-w-max pb-8">
            {MITRE_ATTACK_MATRIX.map((tactic, idx) => (
              <div key={idx} className="flex flex-col w-[200px] flex-shrink-0 gap-3">
                {/* Tactic Header */}
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <div className="text-[10px] font-display text-[#06b6d4] tracking-widest uppercase break-words">
                    {tactic.tactic}
                  </div>
                </div>

                {/* Techniques */}
                <div className="flex flex-col gap-2">
                  {tactic.techniques.map(tech => {
                    const hits = techniqueHits[tech.id] || 0;
                    const bg = getHeatColor(hits);
                    const border = getBorderColor(hits);
                    const isActive = hits > 0;
                    
                    return (
                      <div 
                        key={tech.id} 
                        className={`p-3 rounded-lg border transition-all duration-300 relative overflow-hidden
                          ${isActive ? 'pulse-subtle' : 'opacity-80 hover:opacity-100'}`}
                        style={{ background: bg, borderColor: border }}
                      >
                        {isActive && (
                          <div className="absolute top-0 right-0 px-1.5 py-0.5 rounded-bl text-[9px] font-mono font-bold" 
                               style={{ background: border, color: '#fff' }}>
                            {hits}
                          </div>
                        )}
                        <div className="text-[11px] font-mono font-bold mb-1" style={{ color: isActive ? '#fff' : '#94a3b8' }}>
                          {tech.id}
                        </div>
                        <div className="text-[11px] font-mono leading-tight" style={{ color: isActive ? 'rgba(255,255,255,0.9)' : '#64748b' }}>
                          {tech.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Legend */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--glass-border, rgba(148, 163, 184, 0.2))', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="text-[9px] font-mono text-[#94a3b8] tracking-widest uppercase">
            HEATMAP INTENSITY
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(71, 85, 105, 0.3)' }}></div>
              <span className="text-[10px] font-mono text-[#64748b]">0 HITS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.3)', border: '1px solid rgba(245, 158, 11, 0.8)' }}></div>
              <span className="text-[10px] font-mono text-[#f59e0b]">1-2 HITS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(249, 115, 22, 0.5)', border: '1px solid rgba(249, 115, 22, 0.9)' }}></div>
              <span className="text-[10px] font-mono text-[#f97316]">3-5 HITS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(239, 68, 68, 0.7)', border: '1px solid rgba(239, 68, 68, 1)' }}></div>
              <span className="text-[10px] font-mono text-[#ef4444]">6+ HITS</span>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .pulse-subtle {
          animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }
      `}} />
    </div>
  );
}
