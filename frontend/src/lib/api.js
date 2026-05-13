/**
 * Vanguard Sentinel — API Client
 * Fetch wrappers for all backend endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Check backend health.
 */
export async function checkHealth() {
  return apiFetch('/api/health');
}

/**
 * Trigger data ingestion.
 */
export async function ingestData() {
  return apiFetch('/api/ingest', { method: 'POST' });
}

/**
 * Send a natural language query through the GraphRAG pipeline.
 */
export async function queryGraph(query) {
  return apiFetch('/api/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

/**
 * Fetch the full graph data for visualization.
 */
export async function fetchFullGraph() {
  return apiFetch('/api/graph');
}

/**
 * Perform semantic search over log entries.
 */
export async function semanticSearch(query, topK = 5) {
  return apiFetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query, top_k: topK }),
  });
}

/**
 * Fetch a specific node and its 1-hop neighbors.
 */
export async function expandNode(nodeId) {
  // node_id often contains # or / from neo4j elementIds, so we must encode it
  return apiFetch(`/api/graph/expand/${encodeURIComponent(nodeId)}`);
}

/**
 * Start the live event simulator.
 */
export async function startStream(interval = 5) {
  return apiFetch(`/api/stream/start?interval=${interval}`, { method: 'POST' });
}

/**
 * Stop the live event simulator.
 */
export async function stopStream() {
  return apiFetch('/api/stream/stop', { method: 'POST' });
}

/**
 * Get live stream status.
 */
export async function getStreamStatus() {
  return apiFetch('/api/stream/status');
}
