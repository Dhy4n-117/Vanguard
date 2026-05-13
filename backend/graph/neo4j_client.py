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
        print("[OK] Neo4j connected")

    def close(self):
        """Close the Neo4j driver."""
        if self._driver:
            self._driver.close()
            print("[OK] Neo4j disconnected")

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

    def expand_node(self, node_id: str) -> dict:
        """
        Fetch a specific node and its immediate (1-hop) neighbors.
        """
        # Query to get the central node, its neighbors, and the relationships between them
        query = """
        MATCH (n)-[r]-(m)
        WHERE elementId(n) = $node_id
        RETURN 
            elementId(n) AS source_id, labels(n)[0] AS source_label, properties(n) AS source_props,
            elementId(m) AS target_id, labels(m)[0] AS target_label, properties(m) AS target_props,
            type(r) AS rel_type, properties(r) AS rel_props,
            startNode(r) = n AS is_outgoing
        """
        
        nodes_map = {}
        links = []
        
        for record in self.run_cypher(query, {"node_id": node_id}):
            # Process source node (the one we clicked)
            s_id = record["source_id"]
            if s_id not in nodes_map:
                s_props = record["source_props"]
                s_name = s_props.get("name") or s_props.get("hostname") or s_props.get("address") or s_props.get("cve_id") or s_props.get("event_type") or str(s_props.get("id", ""))
                nodes_map[s_id] = {
                    "id": s_id,
                    "label": record["source_label"],
                    "name": s_name,
                    "properties": s_props,
                }
            
            # Process target node (the neighbor)
            t_id = record["target_id"]
            if t_id not in nodes_map:
                t_props = record["target_props"]
                t_name = t_props.get("name") or t_props.get("hostname") or t_props.get("address") or t_props.get("cve_id") or t_props.get("event_type") or str(t_props.get("id", ""))
                nodes_map[t_id] = {
                    "id": t_id,
                    "label": record["target_label"],
                    "name": t_name,
                    "properties": t_props,
                }
            
            # Process relationship
            is_outgoing = record["is_outgoing"]
            links.append({
                "source": s_id if is_outgoing else t_id,
                "target": t_id if is_outgoing else s_id,
                "type": record["rel_type"],
                "properties": record.get("rel_props", {}),
            })
            
        return {"nodes": list(nodes_map.values()), "links": links}


    def is_connected(self) -> bool:
        """Check if Neo4j is reachable."""
        try:
            if self._driver is None:
                return False
            self._driver.verify_connectivity()
            return True
        except Exception:
            return False

    def clear_database(self):
        """Remove all nodes and relationships (for re-ingestion)."""
        self.run_cypher("MATCH (n) DETACH DELETE n")


# Singleton instance
neo4j_client = Neo4jClient()
