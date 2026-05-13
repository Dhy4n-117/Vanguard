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
import LiveFeed from '../components/LiveFeed';
import { checkHealth, ingestData, fetchFullGraph } from '../lib/api';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ChevronUp, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react';

export default function Dashboard() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [backendStatus, setBackendStatus] = useState('disconnected');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isChatExpanded, setIsChatExpanded] = useState(true);

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

  // Refresh graph periodically during live streaming
  const handleLiveEvent = useCallback(() => {
    // Reload full graph every 5 events to keep visualization in sync
    loadFullGraph();
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
        <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden relative">
          
          {/* Stats Bar Header with Collapse Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-display tracking-widest text-[#6b7280]">
              SYSTEM STATISTICS
            </h2>
            <button
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              title={isStatsExpanded ? "Collapse Stats" : "Expand Stats"}
            >
              {isStatsExpanded ? <ChevronUp size={16} className="text-[#3b82f6]" /> : <ChevronDown size={16} className="text-[#3b82f6]" />}
            </button>
          </div>

          {/* Collapsible Stats Bar */}
          {isStatsExpanded && (
            <div className="animate-fade-in-up">
              <StatsBar graphData={graphData} />
            </div>
          )}

          {/* Resizable Split Screen: Chat + Graph */}
          <div className="flex-1 min-h-0 relative flex gap-3">
            {/* Overlay button to toggle chat (only visible when collapsed) */}
            {!isChatExpanded && (
              <button
                onClick={() => setIsChatExpanded(true)}
                className="absolute top-4 left-4 z-50 p-2 rounded-lg bg-[rgba(10,15,25,0.8)] border border-[rgba(255,255,255,0.1)] backdrop-blur shadow-lg hover:bg-[rgba(59,130,246,0.2)] hover:border-[#3b82f6] transition-all animate-fade-in-up"
                title="Show Chat"
              >
                <PanelLeft size={18} className="text-[#3b82f6]" />
              </button>
            )}

            <PanelGroup direction="horizontal">
              {/* Left: Chat Panel */}
              {isChatExpanded && (
                <>
                  <Panel defaultSize={30} minSize={20} maxSize={50}>
                    <div className="h-full">
                      <ChatPanel onGraphUpdate={handleGraphUpdate} onClose={() => setIsChatExpanded(false)} />
                    </div>
                  </Panel>

                  {/* Drag Handle */}
                  <PanelResizeHandle className="w-3 relative group flex items-center justify-center cursor-col-resize outline-none">
                    <div className="w-1 h-full bg-[rgba(255,255,255,0.05)] group-hover:bg-[#3b82f6] group-active:bg-[#3b82f6] transition-colors rounded-full" />
                    <div className="absolute h-8 w-1 bg-[#3b82f6] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </PanelResizeHandle>
                </>
              )}

              {/* Right: Graph Panel */}
              <Panel defaultSize={isChatExpanded ? 70 : 100} minSize={30}>
                <div className="h-full relative overflow-hidden min-w-0 min-h-0">
                  <GraphPanel graphData={graphData} onGraphUpdate={setGraphData} />
                </div>
              </Panel>
            </PanelGroup>
          </div>

          {/* Live Event Feed */}
          <LiveFeed onNewEvent={handleLiveEvent} />
        </div>
      </div>

      {/* Semantic Search Modal */}
      <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </SpotlightProvider>
  );
}
