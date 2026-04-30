"""
Vanguard Sentinel — Neo4j Client
Wraps the Neo4j Python driver for graph operations.
"""

from neo4j import GraphDatabase
from backend.config import settings
from backend.models.ontology import NODE_LABELS


class Neo4jClient:
    """Manages the Neo4j driver lifecycle and provides query execution."""

    def __init__(self):
        self._driver = None

    def connect(self):
        """Establish connection to Neo4j."""
        self._driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
        # Verify connectivity
        self._driver.verify_connectivity()
        print("✅ Neo4j connected")

    def close(self):
        """Close the Neo4j driver."""
        if self._driver:
            self._driver.close()
            print("🔌 Neo4j disconnected")

    @property
    def driver(self):
        return self._driver

    def run_cypher(self, query: str, params: dict = None) -> list[dict]:
        """Execute a Cypher query and return results as list of dicts."""
        with self._driver.session() as session:
            result = session.run(query, params or {})
            return [record.data() for record in result]

    def get_full_graph(self) -> dict:
        """
        Fetch all nodes and relationships from the graph.
        Returns { nodes: [...], links: [...] } for force graph rendering.
        """
        nodes_query = """
        MATCH (n)
        WHERE n:ThreatActor OR n:IPAddress OR n:Asset OR n:Vulnerability OR n:LogEntry
        RETURN
            elementId(n) AS id,
            labels(n)[0] AS label,
            properties(n) AS props
        """

        links_query = """
        MATCH (a)-[r]->(b)
        RETURN
            elementId(a) AS source,
            elementId(b) AS target,
            type(r) AS type,
            properties(r) AS props
        """

        nodes = []
        for record in self.run_cypher(nodes_query):
            label = record["label"]
            props = record["props"]
            name = props.get("name") or props.get("hostname") or props.get("address") or props.get("cve_id") or props.get("event_type") or str(props.get("id", ""))
            nodes.append({
                "id": record["id"],
                "label": label,
                "name": name,
                "properties": props,
            })

        links = []
        for record in self.run_cypher(links_query):
            links.append({
                "source": record["source"],
                "target": record["target"],
                "type": record["type"],
                "properties": record.get("props", {}),
            })

        return {"nodes": nodes, "links": links}

    def is_connected(self) -> bool:
        """Check if Neo4j is reachable."""
        try:
            self._driver.verify_connectivity()
            return True
        except Exception:
            return False

    def clear_database(self):
        """Remove all nodes and relationships (for re-ingestion)."""
        self.run_cypher("MATCH (n) DETACH DELETE n")


# Singleton instance
neo4j_client = Neo4jClient()
