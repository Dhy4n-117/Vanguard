// e:\Vanguard\frontend\src\lib\riskEngine.js

export function calculateRiskScores(graphData) {
  const { nodes = [], links = [] } = graphData;
  const riskMap = new Map();

  // Pre-compute node types and links for faster lookups
  const nodeTypeMap = new Map();
  nodes.forEach(node => {
    nodeTypeMap.set(node.id, node.type);
  });

  const adjacencyList = new Map();
  nodes.forEach(node => adjacencyList.set(node.id, []));

  links.forEach(link => {
    // link source/target could be string IDs or object references
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    if (adjacencyList.has(sourceId)) {
      adjacencyList.get(sourceId).push(targetId);
    }
    if (adjacencyList.has(targetId)) {
      adjacencyList.get(targetId).push(sourceId);
    }
  });

  nodes.forEach(node => {
    let score = 0;
    const factors = [];

    // Base score by node type
    switch (node.type) {
      case 'ThreatActor':
        score += 70;
        factors.push('Base risk for ThreatActor: +70');
        break;
      case 'Vulnerability':
        score += 50;
        factors.push('Base risk for Vulnerability: +50');
        break;
      case 'IPAddress':
        score += 30;
        factors.push('Base risk for IPAddress: +30');
        break;
      case 'Asset':
        score += 20;
        factors.push('Base risk for Asset: +20');
        break;
      case 'LogEntry':
        score += 10;
        factors.push('Base risk for LogEntry: +10');
        break;
      default:
        score += 10;
        break;
    }

    const connectedNodes = adjacencyList.get(node.id) || [];
    let threatActorCount = 0;
    let vulnCount = 0;

    connectedNodes.forEach(neighborId => {
      const type = nodeTypeMap.get(neighborId);
      if (type === 'ThreatActor') threatActorCount++;
      if (type === 'Vulnerability') vulnCount++;
    });

    if (threatActorCount > 0) {
      score += threatActorCount * 10;
      factors.push(`Connected to ${threatActorCount} ThreatActor(s): +${threatActorCount * 10}`);
    }

    if (vulnCount > 0) {
      score += vulnCount * 8;
      factors.push(`Connected to ${vulnCount} Vulnerability(ies): +${vulnCount * 8}`);
    }

    const degree = connectedNodes.length;
    if (degree > 0) {
      score += degree * 5;
      factors.push(`Direct connections (${degree}): +${degree * 5}`);
    }

    const name = (node.name || '').toLowerCase();
    if (name.includes('apt') || name.includes('lazarus') || name.includes('bear') || name.includes('spider')) {
      score += 15;
      factors.push('Contains known threat group keywords: +15');
    }

    const severity = (node.properties?.severity || node.severity || '').toLowerCase();
    if (severity === 'critical' || severity === 'high') {
      score += 10;
      factors.push(`Severity is ${severity}: +10`);
    }

    // Cap at 100
    score = Math.min(100, Math.max(0, score));

    let level = 'low';
    if (score >= 80) level = 'critical';
    else if (score >= 60) level = 'high';
    else if (score >= 40) level = 'medium';

    riskMap.set(node.id, {
      score,
      level,
      factors
    });
  });

  return riskMap;
}

export function getScoreColor(score) {
  if (score >= 80) return '#ef4444'; // red
  if (score >= 60) return '#f97316'; // orange
  if (score >= 40) return '#eab308'; // yellow
  return '#22c55e'; // green
}

export function getScoreLabel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
