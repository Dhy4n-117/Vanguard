"""
Vanguard Sentinel — LangChain Chain Setup
Supports both cloud (Gemini) and local (Ollama) LLM providers.
Set LLM_PROVIDER=ollama in .env for zero-trust, air-gapped operation.
"""

from langchain_neo4j import Neo4jGraph, GraphCypherQAChain
from langchain_core.prompts import ChatPromptTemplate
from backend.config import settings
from backend.agentic.prompts import get_cypher_prompt


_chain = None
_neo4j_graph = None


def get_llm():
    """
    Initialize the LLM based on the configured provider.
    - "gemini": Uses Google Gemini API (cloud, requires API key)
    - "ollama": Uses Ollama (local, zero-trust, air-gapped)
    """
    if settings.llm_provider == "ollama":
        try:
            from langchain_ollama import ChatOllama
            print(f"[AI] Using Ollama (local) — model: {settings.ollama_model}")
            return ChatOllama(
                model=settings.ollama_model,
                base_url=settings.ollama_base_url,
                temperature=0.1,
                num_predict=2048,
            )
        except ImportError:
            print("[WARN] langchain-ollama not installed. Run: pip install langchain-ollama")
            print("[WARN] Falling back to Gemini...")

    # Default: Gemini (cloud)
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("[AI] Using Google Gemini (cloud)")
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.gemini_api_key,
        temperature=0.1,
        max_output_tokens=2048,
    )


def get_neo4j_graph():
    """Get or create the Neo4j graph connection for LangChain."""
    global _neo4j_graph
    if _neo4j_graph is None:
        _neo4j_graph = Neo4jGraph(
            url=settings.neo4j_uri,
            username=settings.neo4j_user,
            password=settings.neo4j_password,
        )
    return _neo4j_graph


def get_chain():
    """Get or create the GraphCypherQAChain."""
    global _chain
    if _chain is None:
        llm = get_llm()
        graph = get_neo4j_graph()

        cypher_prompt = ChatPromptTemplate.from_messages([
            ("system", get_cypher_prompt()),
            ("human", "{query}"),
        ])

        _chain = GraphCypherQAChain.from_llm(
            llm=llm,
            graph=graph,
            cypher_prompt=cypher_prompt,
            verbose=True,
            return_intermediate_steps=True,
            top_k=25,
            allow_dangerous_requests=True,
        )
    return _chain


def reset_chain():
    """Reset the chain (useful after schema changes or provider switch)."""
    global _chain, _neo4j_graph
    _chain = None
    _neo4j_graph = None
