"""
Vanguard Sentinel — Ontology Definitions
Defines the Neo4j node labels, relationship types, and their properties.
"""

# ─── Node Labels ──────────────────────────────────────────

NODE_LABELS = {
    "ThreatActor": {
        "properties": ["id", "name", "alias", "threat_level", "first_seen"],
        "color": "#ef4444",       # Red
        "icon": "🎭",
    },
    "IPAddress": {
        "properties": ["id", "address", "geo_location", "is_malicious", "asn"],
        "color": "#f59e0b",       # Amber
        "icon": "🌐",
    },
    "Asset": {
        "properties": ["id", "hostname", "os", "criticality", "department"],
        "color": "#3b82f6",       # Blue
        "icon": "💻",
    },
    "Vulnerability": {
        "properties": ["id", "cve_id", "cvss_score", "description", "severity"],
        "color": "#a855f7",       # Purple
        "icon": "🔓",
    },
    "LogEntry": {
        "properties": ["id", "timestamp", "raw_text", "event_type", "severity"],
        "color": "#6b7280",       # Gray
        "icon": "📋",
    },
}

# ─── Relationship Types ───────────────────────────────────

RELATIONSHIP_TYPES = {
    "USES_IP": {
        "source": "ThreatActor",
        "target": "IPAddress",
        "properties": ["first_seen", "count"],
    },
    "TARGETS": {
        "source": "IPAddress",
        "target": "Asset",
        "properties": ["attack_type", "count"],
    },
    "EXPLOITS": {
        "source": "ThreatActor",
        "target": "Vulnerability",
        "properties": ["success"],
    },
    "AFFECTS": {
        "source": "Vulnerability",
        "target": "Asset",
        "properties": ["patched"],
    },
    "HAS_LOG": {
        "source": "Asset",
        "target": "LogEntry",
        "properties": ["correlation_id"],
    },
    "LOGGED_FROM": {
        "source": "LogEntry",
        "target": "IPAddress",
        "properties": ["correlation_id"],
    },
}


# ─── Schema Description (for LLM prompts) ────────────────

def get_schema_description() -> str:
    """Returns a human-readable schema description for LLM context."""
    lines = ["=== Neo4j Graph Schema ===\n", "Node Labels:"]
    for label, info in NODE_LABELS.items():
        props = ", ".join(info["properties"])
        lines.append(f"  ({label}) — properties: {props}")

    lines.append("\nRelationship Types:")
    for rel, info in RELATIONSHIP_TYPES.items():
        props = ", ".join(info["properties"]) if info["properties"] else "none"
        lines.append(f"  (:{info['source']})-[:{rel}]->(:{info['target']}) — properties: {props}")

    return "\n".join(lines)
