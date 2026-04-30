"""
Vanguard Sentinel — ChromaDB Client
Manages the local vector store for semantic search over log entries.
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.config import settings


class ChromaClient:
    """Manages ChromaDB collection lifecycle and provides semantic search."""

    COLLECTION_NAME = "vanguard_logs"

    def __init__(self):
        self._client = None
        self._collection = None

    def connect(self):
        """Initialize ChromaDB with local persistence."""
        self._client = chromadb.Client(ChromaSettings(
            persist_directory=settings.chroma_persist_dir,
            anonymized_telemetry=False,
        ))
        self._collection = self._client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        print(f"✅ ChromaDB connected — collection '{self.COLLECTION_NAME}' ({self._collection.count()} docs)")

    @property
    def collection(self):
        return self._collection

    def add_documents(self, texts: list[str], metadatas: list[dict], ids: list[str]):
        """Add documents to the collection."""
        # ChromaDB handles embedding internally with its default model
        self._collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids,
        )

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Perform semantic search and return results."""
        results = self._collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        output = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                output.append({
                    "text": doc,
                    "score": round(1 - results["distances"][0][i], 4),  # cosine similarity
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                })

        return output

    def is_connected(self) -> bool:
        """Check if ChromaDB is reachable."""
        try:
            return self._collection is not None and self._client is not None
        except Exception:
            return False

    def clear(self):
        """Delete and recreate the collection."""
        if self._client:
            self._client.delete_collection(self.COLLECTION_NAME)
            self._collection = self._client.get_or_create_collection(
                name=self.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )


# Singleton instance
chroma_client = ChromaClient()
