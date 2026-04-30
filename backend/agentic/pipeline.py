"""
Vanguard Sentinel — GraphRAG Pipeline
Full query pipeline: NL → Cypher → Neo4j → AI Summary + Subgraph JSON.
"""

import re
import traceback
from backend.agentic.chain import get_chain, get_llm
from backend.vectorstore.chroma_client import chroma_client
from backend.graph.neo4j_client import neo4j_client
from backend.models.schemas import QueryResponse, GraphData, GraphNode, GraphLink


async def run_query_pipeline(query: str) -> QueryResponse:
    """
    Execute the full GraphRAG pipeline:
    1. Optionally retrieve semantic context from ChromaDB
    2. Use GraphCypherQAChain to translate NL → Cypher → Neo4j results
    3. Extract the generated Cypher and raw results
    4. Transform results into subgraph format for the force graph
    5. Return AI summary + Cypher + subgraph
    """
    try:
        # Step 1: Get semantic context from ChromaDB
        context_results = chroma_client.search(query, top_k=3)
        context_text = "\n".join([r["text"] for r in context_results]) if context_results else ""

        # Step 2: Augment query with context
        augmented_query = query
        if context_text:
            augmented_query = f"Context from recent logs:\n{context_text}\n\nQuestion: {query}"

        # Step 3: Run through GraphCypherQAChain
        chain = get_chain()
        result = chain.invoke({"query": augmented_query})

        # Step 4: Extract components
        answer = result.get("result", "No answer generated.")
        intermediate = result.get("intermediate_steps", [])

        # Extract generated Cypher from intermediate steps
        generated_cypher = ""
        cypher_results = []
        if intermediate:
            for step in intermediate:
                if isinstance(step, dict):
                    if "query" in step:
                        generated_cypher = step["query"]
                    elif "context" in step:
                        cypher_results = step["context"]
                elif isinstance(step, str):
                    # Sometimes the cypher is returned as a plain string
                    if step.strip().upper().startswith("MATCH") or step.strip().upper().startswith("OPTIONAL"):
                        generated_cypher = step

        # Step 5: Build subgraph from Cypher results
        subgraph = _build_subgraph_from_cypher(generated_cypher)

        return QueryResponse(
            answer=answer,
            cypher=generated_cypher,
            subgraph=subgraph,
        )

    except Exception as e:
        traceback.print_exc()
        # Fallback: try a simpler approach
        return await _fallback_query(query, str(e))


async def _fallback_query(query: str, error: str) -> QueryResponse:
    """
    Fallback when the full chain fails.
    Uses the LLM directly to generate Cypher, then runs it manually.
    """
    try:
        llm = get_llm()
        from backend.agentic.prompts import get_cypher_prompt

        prompt = f"""{get_cypher_prompt()}

Generate ONLY the Cypher query for this question (no explanation, no markdown):
{query}"""

        response = llm.invoke(prompt)
        cypher = response.content.strip()

        # Clean up the cypher (remove markdown code blocks if present)
        cypher = re.sub(r'```(?:cypher)?\n?', '', cypher).strip()

        # Execute the Cypher
        results = neo4j_client.run_cypher(cypher)

        # Generate summary
        summary_prompt = f"""Based on these Neo4j query results, provide a concise cybersecurity analysis:

Query: {query}
Results: {str(results)[:2000]}

Provide a 2-3 sentence analysis."""

        summary_response = llm.invoke(summary_prompt)
        answer = summary_response.content

        subgraph = _build_subgraph_from_cypher(cypher)

        return QueryResponse(
            answer=answer,
            cypher=cypher,
            subgraph=subgraph,
        )
    except Exception as e2:
        traceback.print_exc()
        return QueryResponse(
            answer=f"I encountered an error processing your query. Original error: {error}. Fallback error: {str(e2)}",
            cypher="",
            subgraph=GraphData(),
        )


def _build_subgraph_from_cypher(cypher: str) -> GraphData:
    """
    Execute the Cypher query and transform results into a subgraph.
    Handles various return formats from Neo4j.
    """
    if not cypher:
        return GraphData()

    try:
        # Re-run the cypher to get node/relationship data
        with neo4j_client.driver.session() as session:
            result = session.run(cypher)
            nodes_map = {}
            links = []

            for record in result:
                for value in record.values():
                    _extract_graph_elements(value, nodes_map, links)

            return GraphData(
                nodes=list(nodes_map.values()),
                links=links,
            )
    except Exception as e:
        print(f"⚠️  Subgraph extraction failed: {e}")
        return GraphData()


def _extract_graph_elements(value, nodes_map: dict, links: list):
    """Recursively extract nodes and relationships from Neo4j result values."""
    from neo4j.graph import Node, Relationship, Path

    if isinstance(value, Node):
        node_id = str(value.element_id)
        if node_id not in nodes_map:
            labels = list(value.labels)
            label = labels[0] if labels else "Unknown"
            props = dict(value)
            name = props.get("name") or props.get("hostname") or props.get("address") or props.get("cve_id") or props.get("event_type") or str(props.get("id", ""))
            nodes_map[node_id] = GraphNode(
                id=node_id,
                label=label,
                name=name,
                properties=props,
            )

    elif isinstance(value, Relationship):
        link = GraphLink(
            source=str(value.start_node.element_id),
            target=str(value.end_node.element_id),
            type=value.type,
            properties=dict(value),
        )
        links.append(link)
        # Also extract the connected nodes
        _extract_graph_elements(value.start_node, nodes_map, links)
        _extract_graph_elements(value.end_node, nodes_map, links)

    elif isinstance(value, Path):
        for node in value.nodes:
            _extract_graph_elements(node, nodes_map, links)
        for rel in value.relationships:
            _extract_graph_elements(rel, nodes_map, links)

    elif isinstance(value, list):
        for item in value:
            _extract_graph_elements(item, nodes_map, links)
