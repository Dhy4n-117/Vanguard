'use client';

/**
 * MessageBubble — Individual chat message with user/assistant styling.
 */

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))'
            : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'rgba(6, 182, 212, 0.2)' : 'var(--glass-border)'}`,
        }}
      >
        {/* Role label */}
        <div className="text-[10px] font-mono tracking-widest mb-1.5 uppercase"
          style={{ color: isUser ? 'var(--accent-cyan)' : 'var(--accent-magenta)' }}
        >
          {isUser ? '> YOU' : '🛡️ SENTINEL'}
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
