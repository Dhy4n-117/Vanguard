'use client';

/**
 * SearchPanel — Semantic search over log entries using ChromaDB.
 * Appears as a modal overlay triggered from the navbar.
 */

import { useState } from 'react';
import GlassCard from './GlassCard';
import { semanticSearch } from '../lib/api';

export default function SearchPanel({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const data = await semanticSearch(query.trim(), 8);
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '720px', maxHeight: '80vh' }}>
        <GlassCard variant="emerald" className="flex flex-col" style={{ maxHeight: '80vh' }}>
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <div>
              <h2 className="font-display text-sm font-semibold tracking-widest" style={{ color: 'var(--accent-emerald)' }}>
                SEMANTIC LOG SEARCH
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Search log entries by meaning using vector embeddings
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
            >
              ✕
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="px-6 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <div className="flex gap-3">
              <input
                id="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. brute force login attempts from external IPs..."
                disabled={isSearching}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-mono border-glow"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              />
              <button
                id="search-btn"
                type="submit"
                disabled={isSearching || !query.trim()}
                className="btn-primary px-6"
                style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }}
              >
                {isSearching ? '...' : '🔍'}
              </button>
            </div>
          </form>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '50vh' }}>
            {results.length === 0 && !isSearching && (
              <p className="text-center py-8 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                {query ? 'No results found' : 'Enter a query to search log entries'}
              </p>
            )}

            {results.map((result, i) => (
              <div
                key={i}
                className="p-4 rounded-xl animate-fade-in-up"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--glass-border)',
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--accent-emerald)' }}>
                    MATCH #{i + 1}
                  </span>
                  {result.score !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
                      background: 'var(--accent-emerald-dim)',
                      color: 'var(--accent-emerald)',
                    }}>
                      {(result.score * 100).toFixed(1)}% match
                    </span>
                  )}
                </div>
                <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                  {result.text || result.document}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
