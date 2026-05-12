'use client';

/**
 * Vanguard Sentinel — Main Dashboard Page
 * Split-screen layout: Chat (left) + Force Graph (right)
 */

import { useState, useEffect, useCallback } from 'react';
import SpotlightProvider from '../components/SpotlightProvider';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import ChatPanel from '../components/ChatPanel';
import GraphPanel from '../components/GraphPanel';
import SearchPanel from '../components/SearchPanel';
import { checkHealth, ingestData, fetchFullGraph } from '../lib/api';

export default function Dashboard() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [backendStatus, setBackendStatus] = useState('disconnected');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Health check on mount + polling
  useEffect(() => {
    const check = async () => {
      try {
        const health = await checkHealth();
        setBackendStatus(health.neo4j === 'connected' ? 'connected' : 'disconnected');
      } catch {
        setBackendStatus('disconnected');
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch full graph when backend comes online
  useEffect(() => {
    if (backendStatus === 'connected') {
      loadFullGraph();
    }
  }, [backendStatus]);

  const loadFullGraph = async () => {
    try {
      const data = await fetchFullGraph();
      if (data.nodes?.length > 0) {
        setGraphData(data);
      }
    } catch (err) {
      console.error('Failed to load graph:', err);
    }
  };

  const handleIngest = async () => {
    setIsIngesting(true);
    try {
      await ingestData();
      // Reload graph after ingestion
      await loadFullGraph();
    } catch (err) {
      console.error('Ingestion failed:', err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleGraphUpdate = useCallback((subgraph) => {
    if (subgraph.nodes?.length > 0) {
      setGraphData(subgraph);
    }
  }, []);

  return (
    <SpotlightProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onIngest={handleIngest}
          isIngesting={isIngesting}
          backendStatus={backendStatus}
          onSearch={() => setIsSearchOpen(true)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
          {/* Stats Bar */}
          <StatsBar graphData={graphData} />

          {/* Split Screen: Chat + Graph */}
          <div className="flex-1 grid grid-cols-[420px_1fr] gap-3 min-h-0">
            {/* Left: Chat Panel */}
            <ChatPanel onGraphUpdate={handleGraphUpdate} />

            {/* Right: Graph Panel */}
            <GraphPanel graphData={graphData} />
          </div>
        </div>
      </div>

      {/* Semantic Search Modal */}
      <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </SpotlightProvider>
  );
}
