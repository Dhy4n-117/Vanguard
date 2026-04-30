"""
Vanguard Sentinel — Cypher Query Templates
Predefined queries for common graph operations.
"""

# ─── Full Graph ───────────────────────────────────────────

FULL_GRAPH_NODES = """
MATCH (n)
WHERE n:ThreatActor OR n:IPAddress OR n:Asset OR n:Vulnerability OR n:LogEntry
RETURN elementId(n) AS id, labels(n)[0] AS label, properties(n) AS props
"""

FULL_GRAPH_LINKS = """
MATCH (a)-[r]->(b)
RETURN elementId(a) AS source, elementId(b) AS target, type(r) AS type, properties(r) AS props
"""

# ─── Ingestion (MERGE patterns) ──────────────────────────

MERGE_THREAT_ACTOR = """
MERGE (ta:ThreatActor {name: $name})
ON CREATE SET ta.id = $id, ta.alias = $alias, ta.threat_level = $threat_level, ta.first_seen = $first_seen
RETURN ta
"""

MERGE_IP_ADDRESS = """
MERGE (ip:IPAddress {address: $address})
ON CREATE SET ip.id = $id, ip.geo_location = $geo_location, ip.is_malicious = $is_malicious, ip.asn = $asn
RETURN ip
"""

MERGE_ASSET = """
MERGE (a:Asset {hostname: $hostname})
ON CREATE SET a.id = $id, a.os = $os, a.criticality = $criticality, a.department = $department
RETURN a
"""

MERGE_VULNERABILITY = """
MERGE (v:Vulnerability {cve_id: $cve_id})
ON CREATE SET v.id = $id, v.cvss_score = $cvss_score, v.description = $description, v.severity = $severity
RETURN v
"""

CREATE_LOG_ENTRY = """
CREATE (l:LogEntry {
    id: $id,
    timestamp: $timestamp,
    raw_text: $raw_text,
    event_type: $event_type,
    severity: $severity
})
RETURN l
"""

# ─── Relationship Creation ───────────────────────────────

CREATE_USES_IP = """
MATCH (ta:ThreatActor {name: $actor_name})
MATCH (ip:IPAddress {address: $ip_address})
MERGE (ta)-[r:USES_IP]->(ip)
ON CREATE SET r.first_seen = $first_seen, r.count = 1
ON MATCH SET r.count = r.count + 1
"""

CREATE_TARGETS = """
MATCH (ip:IPAddress {address: $ip_address})
MATCH (a:Asset {hostname: $hostname})
MERGE (ip)-[r:TARGETS]->(a)
ON CREATE SET r.attack_type = $attack_type, r.count = 1
ON MATCH SET r.count = r.count + 1
"""

CREATE_EXPLOITS = """
MATCH (ta:ThreatActor {name: $actor_name})
MATCH (v:Vulnerability {cve_id: $cve_id})
MERGE (ta)-[r:EXPLOITS]->(v)
ON CREATE SET r.success = $success
"""

CREATE_AFFECTS = """
MATCH (v:Vulnerability {cve_id: $cve_id})
MATCH (a:Asset {hostname: $hostname})
MERGE (v)-[r:AFFECTS]->(a)
ON CREATE SET r.patched = $patched
"""

CREATE_HAS_LOG = """
MATCH (a:Asset {hostname: $hostname})
MATCH (l:LogEntry {id: $log_id})
MERGE (a)-[r:HAS_LOG]->(l)
ON CREATE SET r.correlation_id = $correlation_id
"""

CREATE_LOGGED_FROM = """
MATCH (l:LogEntry {id: $log_id})
MATCH (ip:IPAddress {address: $ip_address})
MERGE (l)-[r:LOGGED_FROM]->(ip)
ON CREATE SET r.correlation_id = $correlation_id
"""

# ─── Analytics Queries ────────────────────────────────────

COUNT_BY_LABEL = """
MATCH (n)
WITH labels(n)[0] AS label, count(n) AS count
RETURN label, count
ORDER BY count DESC
"""

THREAT_ACTORS_WITH_TARGETS = """
MATCH (ta:ThreatActor)-[:USES_IP]->(ip:IPAddress)-[:TARGETS]->(a:Asset)
RETURN ta.name AS actor, collect(DISTINCT a.hostname) AS targets, collect(DISTINCT ip.address) AS ips
"""
