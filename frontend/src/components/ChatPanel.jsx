'use client';

/**
 * ChatPanel — Left-side chat interface for natural language queries.
 * Sends queries to /api/query and displays AI responses.
 */

import { useState, useRef, useEffect } from 'react';
import GlassCard from './GlassCard';
import MessageBubble from './MessageBubble';
import SuggestedQueries from './SuggestedQueries';
import { queryGraph } from '../lib/api';

import { PanelLeftClose } from 'lucide-react';

export default function ChatPanel({ onGraphUpdate, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to Vanguard Sentinel. I can analyze your cybersecurity knowledge graph using natural language. Try asking:\n\n• "Show me all servers targeted by APT28"\n• "Find malicious IPs and their attack targets"\n• "What vulnerabilities affect the database server?"',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await queryGraph(input.trim());

      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        cypher: response.cypher || null,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update the graph with the returned subgraph
      if (response.subgraph && (response.subgraph.nodes?.length > 0 || response.subgraph.links?.length > 0)) {
        onGraphUpdate(response.subgraph);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${error.message}. Make sure the backend is running on port 8000 and data has been ingested.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard variant="cyan" className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-5 py-4 flex justify-between items-start" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div>
          <h2 className="font-display text-sm font-semibold tracking-widest" style={{ color: 'var(--accent-cyan)' }}>
            💬 THREAT INTELLIGENCE CHAT
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Ask questions about your security data in natural language
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-[rgba(59,130,246,0.1)] transition-colors text-[#3b82f6] opacity-70 hover:opacity-100 ml-2"
            title="Hide Chat"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Suggested Queries */}
      <SuggestedQueries onSelect={(q) => setInput(q)} disabled={isLoading} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
              <div className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--accent-magenta)' }}>
                🛡️ SENTINEL
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="flex gap-3">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about threats, IPs, vulnerabilities..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-mono border-glow"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn-primary px-6"
          >
            ▶
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
