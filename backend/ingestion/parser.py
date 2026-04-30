"""
Vanguard Sentinel — Log Parser
Extracts structured entities and relationships from mock log entries.
"""

import uuid


def parse_log_entries(raw_logs: list[dict]) -> dict:
    """
    Parse a list of raw log entries and extract unique entities + relationships.

    Returns:
        {
            "threat_actors": [...],
            "ip_addresses": [...],
            "assets": [...],
            "vulnerabilities": [...],
            "log_entries": [...],
            "relationships": [...]
        }
    """
    # Track unique entities by their natural key
    actors = {}
    ips = {}
    assets = {}
    vulns = {}
    log_entries = []
    relationships = []

    for log in raw_logs:
        log_id = log["id"]

        # ── Extract Threat Actor ──
        actor = log["threat_actor"]
        actor_name = actor["name"]
        if actor_name not in actors:
            actors[actor_name] = {
                "id": str(uuid.uuid4()),
                "name": actor_name,
                "alias": actor["alias"],
                "threat_level": actor["threat_level"],
                "first_seen": log["timestamp"],
            }

        # ── Extract Source IP ──
        ip_data = log["source_ip"]
        ip_addr = ip_data["address"]
        if ip_addr not in ips:
            ips[ip_addr] = {
                "id": str(uuid.uuid4()),
                "address": ip_addr,
                "geo_location": ip_data["geo_location"],
                "is_malicious": ip_data["is_malicious"],
                "asn": ip_data["asn"],
            }

        # ── Extract Target Asset ──
        asset = log["target_asset"]
        hostname = asset["hostname"]
        if hostname not in assets:
            assets[hostname] = {
                "id": str(uuid.uuid4()),
                "hostname": hostname,
                "os": asset["os"],
                "criticality": asset["criticality"],
                "department": asset["department"],
            }

        # ── Extract Vulnerability (if applicable) ──
        vuln = log.get("vulnerability")
        if vuln:
            cve_id = vuln["cve_id"]
            if cve_id not in vulns:
                vulns[cve_id] = {
                    "id": str(uuid.uuid4()),
                    "cve_id": cve_id,
                    "cvss_score": vuln["cvss"],
                    "description": vuln["desc"],
                    "severity": vuln["severity"],
                }

        # ── Create Log Entry ──
        log_entries.append({
            "id": log_id,
            "timestamp": log["timestamp"],
            "raw_text": log["raw_text"],
            "event_type": log["event_type"],
            "severity": log["severity"],
        })

        # ── Build Relationships ──
        correlation_id = str(uuid.uuid4())[:8]

        # ThreatActor -[USES_IP]-> IPAddress
        relationships.append({
            "type": "USES_IP",
            "actor_name": actor_name,
            "ip_address": ip_addr,
            "first_seen": log["timestamp"],
        })

        # IPAddress -[TARGETS]-> Asset
        relationships.append({
            "type": "TARGETS",
            "ip_address": ip_addr,
            "hostname": hostname,
            "attack_type": log["event_type"],
        })

        # Asset -[HAS_LOG]-> LogEntry
        relationships.append({
            "type": "HAS_LOG",
            "hostname": hostname,
            "log_id": log_id,
            "correlation_id": correlation_id,
        })

        # LogEntry -[LOGGED_FROM]-> IPAddress
        relationships.append({
            "type": "LOGGED_FROM",
            "log_id": log_id,
            "ip_address": ip_addr,
            "correlation_id": correlation_id,
        })

        # Vulnerability relationships (if applicable)
        if vuln:
            cve_id = vuln["cve_id"]

            # ThreatActor -[EXPLOITS]-> Vulnerability
            relationships.append({
                "type": "EXPLOITS",
                "actor_name": actor_name,
                "cve_id": cve_id,
                "success": log["event_type"] == "EXPLOIT_ATTEMPT",
            })

            # Vulnerability -[AFFECTS]-> Asset
            relationships.append({
                "type": "AFFECTS",
                "cve_id": cve_id,
                "hostname": hostname,
                "patched": False,
            })

    return {
        "threat_actors": list(actors.values()),
        "ip_addresses": list(ips.values()),
        "assets": list(assets.values()),
        "vulnerabilities": list(vulns.values()),
        "log_entries": log_entries,
        "relationships": relationships,
    }
