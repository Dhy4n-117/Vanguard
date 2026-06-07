/**
 * Geo-location mapping for known IP addresses and threat actors.
 * Maps IPs/entities to approximate lat/lng coordinates for the Geo-Threat Map.
 * 
 * In production, this would call ip-api.com or MaxMind GeoIP.
 * For demo purposes, we use a curated set of realistic coordinates.
 */

// Known threat actor origins (nation-state & criminal group locations)
const THREAT_ACTOR_LOCATIONS = {
  'apt28':        { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia' },
  'apt29':        { lat: 59.9343, lng: 30.3351, city: 'St. Petersburg', country: 'Russia' },
  'lazarus':      { lat: 39.0392, lng: 125.7625, city: 'Pyongyang', country: 'North Korea' },
  'apt41':        { lat: 31.2304, lng: 121.4737, city: 'Shanghai', country: 'China' },
  'darkside':     { lat: 50.4501, lng: 30.5234, city: 'Kyiv', country: 'Ukraine' },
  'conti':        { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia' },
  'revil':        { lat: 50.4501, lng: 30.5234, city: 'Kyiv', country: 'Ukraine' },
  'fin7':         { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia' },
  'charming_kitten': { lat: 35.6892, lng: 51.3890, city: 'Tehran', country: 'Iran' },
  'sandworm':     { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia' },
};

// Known IP address geolocation mapping
const IP_LOCATIONS = {
  '203.0.113.42':  { lat: 39.9042, lng: 116.4074, city: 'Beijing', country: 'China' },
  '198.51.100.7':  { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia' },
  '192.0.2.99':    { lat: 37.5665, lng: 126.9780, city: 'Seoul', country: 'South Korea' },
  '10.0.0.1':      { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
  '10.0.0.5':      { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
  '172.16.0.1':    { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
  '172.16.0.10':   { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK' },
  '192.168.1.1':   { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' },
  '192.168.1.100': { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany' },
  '8.8.8.8':       { lat: 37.4220, lng: -122.0841, city: 'Mountain View', country: 'USA' },
};

// Asset locations (internal infrastructure — typically your org's data centers)
const ASSET_LOCATIONS = {
  'web-server':      { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
  'web-server-prod': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
  'db-server':       { lat: 39.0438, lng: -77.4874, city: 'Ashburn', country: 'USA' },
  'db-server-prod':  { lat: 39.0438, lng: -77.4874, city: 'Ashburn', country: 'USA' },
  'file-server':     { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'USA' },
  'mail-server':     { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK' },
  'vpn-gateway':     { lat: 50.1109, lng: 8.6821, city: 'Frankfurt', country: 'Germany' },
  'auth-proxy':      { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan' },
  'dns-server':      { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore' },
  'backup-server':   { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia' },
};
// Fallback cities for unknown entities — ensures markers always land on real locations
const FALLBACK_CITIES = [
  { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia' },
  { lat: 39.9042, lng: 116.4074, city: 'Beijing', country: 'China' },
  { lat: 28.6139, lng: 77.2090, city: 'New Delhi', country: 'India' },
  { lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil' },
  { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan' },
  { lat: 41.0082, lng: 28.9784, city: 'Istanbul', country: 'Turkey' },
  { lat: 30.0444, lng: 31.2357, city: 'Cairo', country: 'Egypt' },
  { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany' },
  { lat: 37.5665, lng: 126.9780, city: 'Seoul', country: 'South Korea' },
  { lat: 19.4326, lng: -99.1332, city: 'Mexico City', country: 'Mexico' },
  { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' },
  { lat: -1.2921, lng: 36.8219, city: 'Nairobi', country: 'Kenya' },
  { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore' },
  { lat: 14.5995, lng: 120.9842, city: 'Manila', country: 'Philippines' },
  { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK' },
  { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia' },
  { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'USA' },
  { lat: 55.6761, lng: 12.5683, city: 'Copenhagen', country: 'Denmark' },
  { lat: 22.3193, lng: 114.1694, city: 'Hong Kong', country: 'China' },
  { lat: 59.3293, lng: 18.0686, city: 'Stockholm', country: 'Sweden' },
];

/**
 * Simple string hash that produces a consistent index into FALLBACK_CITIES.
 */
function hashToCity(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return FALLBACK_CITIES[Math.abs(hash) % FALLBACK_CITIES.length];
}

/**
 * Resolve a graph node to a geographic coordinate.
 * @param {Object} node - Graph node with label, name, and properties
 * @returns {{ lat: number, lng: number, city: string, country: string } | null}
 */
export function resolveNodeLocation(node) {
  const name = (node.name || node.properties?.name || node.id || '').toLowerCase();
  const hostname = (node.properties?.hostname || '').toLowerCase();

  // Threat Actors — match by name
  if (node.label === 'ThreatActor') {
    const key = Object.keys(THREAT_ACTOR_LOCATIONS).find(k => name.includes(k));
    if (key) return { ...THREAT_ACTOR_LOCATIONS[key], type: 'threat' };
    // Fallback: deterministic real city based on name hash
    const fallback = hashToCity(name);
    return { ...fallback, type: 'threat' };
  }

  // IP Addresses — match by IP
  if (node.label === 'IPAddress') {
    const ip = node.properties?.address || name;
    if (IP_LOCATIONS[ip]) return { ...IP_LOCATIONS[ip], type: 'ip' };
    // Fallback: deterministic real city based on IP hash
    const fallback = hashToCity(ip);
    return { lat: fallback.lat + (Math.abs(ip.charCodeAt(0) % 5) * 0.3), lng: fallback.lng + (Math.abs(ip.charCodeAt(ip.length-1) % 5) * 0.3), city: ip, country: fallback.country, type: 'ip' };
  }

  // Assets — match by hostname
  if (node.label === 'Asset') {
    const key = Object.keys(ASSET_LOCATIONS).find(k => hostname.includes(k) || name.includes(k));
    if (key) return { ...ASSET_LOCATIONS[key], type: 'asset' };
    // Default to US data center
    return { lat: 39.0438, lng: -77.4874, city: hostname || name, country: 'USA', type: 'asset' };
  }

  return null;
}

/**
 * Build geo-mapped data from graph nodes and links.
 * @param {{ nodes: Array, links: Array }} graphData
 * @returns {{ markers: Array, connections: Array }}
 */
export function buildGeoData(graphData) {
  const markers = [];
  const nodeLocationMap = new Map();

  // Resolve locations for all mappable nodes
  for (const node of graphData.nodes) {
    const loc = resolveNodeLocation(node);
    if (loc) {
      const marker = {
        id: node.id,
        name: node.name || node.properties?.name || node.properties?.hostname || node.id,
        label: node.label,
        ...loc,
      };
      markers.push(marker);
      nodeLocationMap.set(node.id, marker);
    }
  }

  // Build connections from links
  const connections = [];
  for (const link of graphData.links) {
    const sourceId = link.source?.id || link.source;
    const targetId = link.target?.id || link.target;
    const src = nodeLocationMap.get(sourceId);
    const tgt = nodeLocationMap.get(targetId);

    if (src && tgt && (src.lat !== tgt.lat || src.lng !== tgt.lng)) {
      connections.push({
        from: { lat: src.lat, lng: src.lng, name: src.name },
        to: { lat: tgt.lat, lng: tgt.lng, name: tgt.name },
        type: link.type || 'CONNECTED_TO',
        fromLabel: src.label,
        toLabel: tgt.label,
      });
    }
  }

  return { markers, connections };
}
