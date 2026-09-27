'use client';

/**
 * MessageBubble — Individual chat message with user/assistant styling.
 * Shows timestamp and provides copy-to-clipboard on hover.
 */

import { useState } from 'react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const timestamp = message.timestamp || new Date().toLocaleTimeString('en-US', { hour12: false });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up group`}>
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3 relative"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))'
            : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'rgba(6, 182, 212, 0.2)' : 'var(--glass-border)'}`,
        }}
      >
        {/* Role label + timestamp */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="text-[10px] font-mono tracking-widest uppercase"
            style={{ color: isUser ? 'var(--accent-cyan)' : 'var(--accent-magenta)' }}
          >
            {isUser ? '> YOU' : '🛡️ SENTINEL'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {timestamp}
            </span>
            <button
              onClick={handleCopy}
              className="text-[8px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-transparent hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)]"
              style={{ color: copied ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
              title="Copy message"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Message content */}
        <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {message.content}
        </div>

        {/* Show generated Cypher if available */}
        {message.cypher && (
          <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}>
            <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--accent-amber)' }}>
              CYPHER QUERY
            </div>
            <code className="text-xs font-mono block whitespace-pre-wrap" style={{ color: 'var(--accent-emerald)' }}>
              {message.cypher}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
