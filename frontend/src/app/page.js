'use client';

/**
 * Vanguard Sentinel — Main Dashboard Page
 * Split-screen layout: Chat (left) + Force Graph (right)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import SpotlightProvider from '../components/SpotlightProvider';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import ChatPanel from '../components/ChatPanel';
import GraphPanel from '../components/GraphPanel';
import SearchPanel from '../components/SearchPanel';
import LiveFeed from '../components/LiveFeed';
import { checkHealth, ingestData, fetchFullGraph, simulateAttack, downloadReport } from '../lib/api';
import { ChevronUp, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react';
import { ToastProvider, useToast } from '../components/ToastNotification';
import ThreatTimeline from '../components/ThreatTimeline';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import AttackPlaybooks from '../components/AttackPlaybooks';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import NetworkTopology from '../components/NetworkTopology';
import SidebarNav from '../components/SidebarNav';
import { PanelErrorBoundary } from '../components/ErrorBoundary';

// Wrap the dashboard content so it can use the toast hook
function DashboardContent() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [backendStatus, setBackendStatus] = useState('disconnected');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isLiveFeedExpanded, setIsLiveFeedExpanded] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // New Modals State
  const [isPlaybooksOpen, setIsPlaybooksOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isTopologyOpen, setIsTopologyOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const { addToast } = useToast();

  // Custom Split Pane State
  const [chatWidth, setChatWidth] = useState(30); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const splitPaneRef = useRef(null);

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
    if (backendStatus === 'connected' && graphData.nodes.length === 0) {
      fetchFullGraph().then(setGraphData).catch(console.error);
    }
  }, [backendStatus]);

  const handleIngest = async () => {
    setIsIngesting(true);
    try {
      await ingestData();
      const newData = await fetchFullGraph();
      setGraphData(newData);
    } catch (err) {
      console.error('Failed to ingest:', err);
      alert('Ingestion failed: ' + err.message);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSimulateAttack = async (playbook = null) => {
    setIsSimulating(true);
    if (playbook) {
      addToast(`Initiating playbook: ${playbook.name}`, playbook.severity, 4000);
    }
    try {
      await simulateAttack(); // Send simulation request
    } catch (err) {
      console.error('Failed to simulate attack:', err);
      alert('Attack simulation failed: ' + err.message);
    } finally {
      // Small delay to let the animation show for at least a second
      setTimeout(() => setIsSimulating(false), 1000);
    }
  };

  const handleCloseAll = useCallback(() => {
    setIsSearchOpen(false);
    setIsPlaybooksOpen(false);
    setIsAnalyticsOpen(false);
    setIsTopologyOpen(false);
  }, []);

  const handleSidebarNavigate = useCallback((viewId) => {
    setActiveView(viewId);
    switch (viewId) {
      case 'analytics': setIsAnalyticsOpen(true); break;
      case 'topology': setIsTopologyOpen(true); break;
      case 'playbooks': setIsPlaybooksOpen(true); break;
      case 'report':
        downloadReport()
          .then(() => addToast('Incident report downloaded successfully', 'medium', 4000))
          .catch(() => addToast('Failed to generate report — is backend running?', 'high', 5000));
        break;
      case 'shortcuts':
        // The KeyboardShortcuts component handles the '?' overlay
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
        break;
      default: break;
    }
  }, [addToast]);

  const handleLiveEvent = useCallback((type, data) => {
    if (type === 'NEW_EVENT' && data.subgraph) {
      // Trigger toast for critical/high events
      if (['critical', 'high'].includes(data.event.severity)) {
        addToast(
          `Detected ${data.event.event_type.replace(/_/g, ' ')} on ${data.event.target_asset}`,
          data.event.severity,
          6000
        );
      }

      setGraphData(prev => {
        const nodeMap = new Map(prev.nodes.map(n => [n.id, n]));
        const linkSet = new Set(prev.links.map(l => `${l.source}-${l.target}`));

        data.subgraph.nodes?.forEach(n => nodeMap.set(n.id, n));
        const newLinks = (data.subgraph.links || []).filter(l => {
          const key = `${l.source}-${l.target}`;
          if (linkSet.has(key)) return false;
          linkSet.add(key);
          return true;
        });

        return {
          nodes: Array.from(nodeMap.values()),
          links: [...prev.links, ...newLinks],
        };
      });
    }
  }, [addToast]);

  const handleGraphUpdate = useCallback((subgraph) => {
    setGraphData(prev => {
      const nodeMap = new Map(prev.nodes.map(n => [n.id, n]));
      const linkSet = new Set(prev.links.map(l => 
        `${l.source?.id || l.source}-${l.target?.id || l.target}`
      ));

      subgraph.nodes?.forEach(n => nodeMap.set(n.id, n));
      const newLinks = (subgraph.links || []).filter(l => {
        const key = `${l.source}-${l.target}`;
        if (linkSet.has(key)) return false;
        linkSet.add(key);
        return true;
      });

      return {
        nodes: Array.from(nodeMap.values()),
        links: [...prev.links, ...newLinks],
      };
    });
  }, []);

  // Custom Split Pane Drag Handlers
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!splitPaneRef.current) return;
      const rect = splitPaneRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Constraints
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 50) newWidth = 50;
      
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Add a class to body to prevent text selection and cursor changes during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  return (
    <SpotlightProvider>
      <div className="flex h-screen w-screen overflow-hidden text-[#f1f5f9] font-body relative" style={{ backgroundColor: 'var(--bg-base)' }}>
        {/* Transparent Overlay to capture mouse events during drag (prevents canvas from eating them) */}
        {isDragging && <div className="absolute inset-0 z-[100]" />}

        {/* Left Sidebar Navigation */}
        <SidebarNav
          isExpanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded(prev => !prev)}
          onNavigate={handleSidebarNavigate}
          activeView={activeView}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <Navbar 
            status={backendStatus} 
            onSearch={() => setIsSearchOpen(true)} 
            onIngest={handleIngest} 
            isIngesting={isIngesting}
            onSimulateAttack={() => setIsPlaybooksOpen(true)}
            isSimulating={isSimulating}
            onOpenAnalytics={() => setIsAnalyticsOpen(true)}
            onOpenTopology={() => setIsTopologyOpen(true)}
          />

          {/* Main Dashboard Layout */}
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden relative z-10">
            {/* Collapsible Stats Bar Toggle */}
            <div className="flex justify-end -mb-2 z-20">
              <button 
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase py-1 px-3 rounded-full hover:bg-[rgba(59,130,246,0.1)] transition-colors border"
                style={{ color: 'var(--accent-cyan)', borderColor: 'var(--glass-border)', background: 'var(--bg-surface)' }}
              >
                {isStatsExpanded ? <><ChevronUp size={12} /> Hide Stats</> : <><ChevronDown size={12} /> Show Stats</>}
              </button>
            </div>

            {/* Collapsible Stats Bar */}
            {isStatsExpanded && (
              <div className="animate-fade-in-up">
                <StatsBar graphData={graphData} />
              </div>
            )}

            {/* Custom Resizable Split Screen: Chat + Graph */}
            <div ref={splitPaneRef} className="flex-1 min-h-0 relative flex w-full overflow-hidden">
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

              {/* Left: Chat Panel (Always mounted to retain state, but hidden when collapsed) */}
              <div 
                style={{ 
                  width: isChatExpanded ? `${chatWidth}%` : '0',
                  opacity: isChatExpanded ? 1 : 0,
                  pointerEvents: isChatExpanded ? 'auto' : 'none',
                  marginRight: isChatExpanded ? '0' : '-12px' // offset the margin to prevent gap
                }} 
                className="h-full flex-shrink-0 min-w-0 relative transition-all duration-500 ease-in-out"
              >
                <div className="absolute inset-0 min-w-[300px]">
                  <PanelErrorBoundary panelName="Chat">
                    <ChatPanel onGraphUpdate={handleGraphUpdate} onClose={() => setIsChatExpanded(false)} />
                  </PanelErrorBoundary>
                </div>
              </div>

              {/* Custom Drag Handle */}
              {isChatExpanded && (
                <div 
                  className="w-5 -mx-1 relative group flex items-center justify-center cursor-col-resize flex-shrink-0 z-30"
                  onMouseDown={handleMouseDown}
                >
                  <div className="absolute inset-0 w-full h-full" />
                  <div className={`w-0.5 h-full transition-colors ${isDragging ? 'bg-[#3b82f6]' : 'bg-[rgba(255,255,255,0.05)] group-hover:bg-[#3b82f6]'}`} />
                  <div className={`absolute h-12 w-1.5 rounded-full blur-[1px] transition-all duration-300 ${isDragging ? 'opacity-100 bg-[#3b82f6] scale-y-125' : 'opacity-0 group-hover:opacity-100 bg-[#3b82f6]'}`} />
                </div>
              )}

              {/* Right: Graph Panel */}
              <div className={`flex-1 h-full min-w-0 relative overflow-hidden ${isChatExpanded ? 'ml-2' : 'ml-0'}`}>
                <div className="absolute inset-0">
                  <PanelErrorBoundary panelName="Graph">
                    <GraphPanel graphData={graphData} onGraphUpdate={setGraphData} />
                  </PanelErrorBoundary>
                </div>
              </div>
            </div>

            {/* Bottom: Timeline and Live Feed */}
            <div className="flex flex-col gap-2 relative z-20">
              <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-mono tracking-[0.2em] text-[#3b82f6] opacity-40 uppercase">
                  Telemetry Stream
                </p>
                <button 
                  onClick={() => setIsLiveFeedExpanded(!isLiveFeedExpanded)}
                  className="text-[9px] font-mono px-2 py-0.5 rounded border border-[rgba(59,130,246,0.2)] hover:bg-[rgba(59,130,246,0.1)] transition-colors"
                  style={{ color: 'var(--accent-cyan)' }}
                >
                  {isLiveFeedExpanded ? 'Collapse Feed' : 'Expand Feed'}
                </button>
              </div>
              
              <div className={`transition-all duration-500 ease-in-out flex flex-col gap-3 overflow-hidden ${isLiveFeedExpanded ? 'opacity-100 max-h-96' : 'max-h-0 opacity-0'}`}>
                {/* Timeline view of log entries */}
                <ThreatTimeline 
                  events={graphData.nodes.filter(n => n.label === 'LogEntry').map(n => n.properties)} 
                  isVisible={isLiveFeedExpanded}
                />
                <LiveFeed onNewEvent={handleLiveEvent} />
              </div>
            </div>
          </div>
        </div>

        {/* Semantic Search Modal */}
        <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        
        {/* Playbooks Modal */}
        <AttackPlaybooks 
          isOpen={isPlaybooksOpen} 
          onClose={() => setIsPlaybooksOpen(false)} 
          onSelectPlaybook={handleSimulateAttack} 
        />
        
        {/* Analytics Dashboard */}
        <AnalyticsDashboard 
          isOpen={isAnalyticsOpen} 
          onClose={() => setIsAnalyticsOpen(false)} 
          graphData={graphData} 
        />

        {/* Network Topology */}
        <NetworkTopology 
          isOpen={isTopologyOpen} 
          onClose={() => setIsTopologyOpen(false)} 
          graphData={graphData} 
        />
      </div>

      {/* Global Keyboard Shortcuts */}
      <KeyboardShortcuts 
        onSearch={() => setIsSearchOpen(true)}
        onSimulateAttack={() => setIsPlaybooksOpen(true)}
        onIngest={handleIngest}
        onToggleChat={() => setIsChatExpanded(prev => !prev)}
        onToggleStats={() => setIsStatsExpanded(prev => !prev)}
        onCloseAll={handleCloseAll}
      />
    </SpotlightProvider>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
