'use client';

import { useState, useRef, useEffect } from 'react';
import { Database, Brain, Cpu, Server, ChevronDown } from 'lucide-react';

/**
 * StatusIndicator — Shows backend connection status and a detailed system health dropdown.
 */
export default function StatusIndicator({ status = 'disconnected' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isConnected = status === 'connected';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors cursor-pointer hover:bg-[rgba(255,255,255,0.05)]"
        style={{ background: isOpen ? 'rgba(255,255,255,0.05)' : 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}
      >
        <span className={`status-dot ${isConnected ? 'status-dot--connected' : 'status-dot--disconnected'}`} />
        <span className="text-xs font-mono uppercase tracking-wider"
          style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-red)' }}
        >
          {isConnected ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-64 rounded-xl border p-3 shadow-2xl z-50 animate-fade-in-up"
          style={{ 
            background: 'rgba(10, 15, 25, 0.95)', 
            borderColor: 'var(--glass-border)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">System Health</span>
            <span className="text-[10px] font-mono text-emerald-400">NOMINAL</span>
          </div>
          
          <div className="flex flex-col gap-3">
            {/* Core API */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server size={14} className={isConnected ? "text-emerald-400" : "text-red-400"} />
                <span className="text-xs font-mono text-slate-300">FastAPI Core</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isConnected ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                {isConnected ? '2ms' : 'ERR'}
              </span>
            </div>
            
            {/* Neo4j */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={14} className={isConnected ? "text-blue-400" : "text-slate-500"} />
                <span className="text-xs font-mono text-slate-300">Neo4j Graph DB</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isConnected ? 'bg-blue-400/10 text-blue-400' : 'bg-slate-500/10 text-slate-500'}`}>
                {isConnected ? 'SYNCED' : 'WAIT'}
              </span>
            </div>

            {/* ChromaDB */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain size={14} className={isConnected ? "text-purple-400" : "text-slate-500"} />
                <span className="text-xs font-mono text-slate-300">ChromaDB Vector</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isConnected ? 'bg-purple-400/10 text-purple-400' : 'bg-slate-500/10 text-slate-500'}`}>
                {isConnected ? 'ONLINE' : 'WAIT'}
              </span>
            </div>

            {/* Ollama / LLM */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={14} className={isConnected ? "text-orange-400" : "text-slate-500"} />
                <span className="text-xs font-mono text-slate-300">Ollama Local AI</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isConnected ? 'bg-orange-400/10 text-orange-400' : 'bg-slate-500/10 text-slate-500'}`}>
                {isConnected ? 'READY' : 'WAIT'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
