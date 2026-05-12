"""
Vanguard Sentinel — Data Loader
Loads parsed entities into Neo4j and embeds log text into ChromaDB.
"""

from backend.graph.neo4j_client import neo4j_client
from backend.graph import queries
from backend.vectorstore.chroma_client import chroma_client


def load_to_neo4j(parsed_data: dict) -> dict:
    """
    Load all entities and relationships into Neo4j.
    Returns counts of nodes and edges created.
    """
    nodes_created = 0
    edges_created = 0
    client = neo4j_client

    # ── Create Nodes ──────────────────────────────────────

    for actor in parsed_data["threat_actors"]:
        client.run_cypher(queries.MERGE_THREAT_ACTOR, actor)
        nodes_created += 1

    for ip in parsed_data["ip_addresses"]:
        client.run_cypher(queries.MERGE_IP_ADDRESS, ip)
        nodes_created += 1

    for asset in parsed_data["assets"]:
        client.run_cypher(queries.MERGE_ASSET, asset)
        nodes_created += 1

    for vuln in parsed_data["vulnerabilities"]:
        client.run_cypher(queries.MERGE_VULNERABILITY, vuln)
        nodes_created += 1

    for log in parsed_data["log_entries"]:
        client.run_cypher(queries.CREATE_LOG_ENTRY, log)
        nodes_created += 1

    # ── Create Relationships ──────────────────────────────

    for rel in parsed_data["relationships"]:
        rel_type = rel["type"]
        try:
            if rel_type == "USES_IP":
                client.run_cypher(queries.CREATE_USES_IP, rel)
            elif rel_type == "TARGETS":
                client.run_cypher(queries.CREATE_TARGETS, rel)
            elif rel_type == "EXPLOITS":
                client.run_cypher(queries.CREATE_EXPLOITS, rel)
            elif rel_type == "AFFECTS":
                client.run_cypher(queries.CREATE_AFFECTS, rel)
            elif rel_type == "HAS_LOG":
                client.run_cypher(queries.CREATE_HAS_LOG, rel)
            elif rel_type == "LOGGED_FROM":
                client.run_cypher(queries.CREATE_LOGGED_FROM, rel)
            edges_created += 1
        except Exception as e:
            print(f"[WARN] Skipping relationship {rel_type}: {e}")

    return {"nodes_created": nodes_created, "edges_created": edges_created}


def load_to_chroma(log_entries: list[dict]) -> int:
    """
    Embed raw log text into ChromaDB for semantic search.
    Returns count of documents embedded.
    """
    texts = [entry["raw_text"] for entry in log_entries]
    metadatas = [
        {
            "log_id": entry["id"],
            "event_type": entry["event_type"],
            "severity": entry["severity"],
            "timestamp": entry["timestamp"],
        }
        for entry in log_entries
    ]
    ids = [entry["id"] for entry in log_entries]

    chroma_client.add_documents(texts=texts, metadatas=metadatas, ids=ids)
    return len(texts)
