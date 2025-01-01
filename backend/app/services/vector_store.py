from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import os
from pathlib import Path

class VectorStore:
    def __init__(self, persist_dir: Path = Path("chroma_db")):
        self.persist_dir = persist_dir
        # Create persist directory if it doesn't exist
        self.persist_dir.mkdir(exist_ok=True)
        
        # Initialize ChromaDB client
        self.client = chromadb.Client(Settings(
            persist_directory=str(persist_dir),
            anonymized_telemetry=False
        ))
        
        # Use OpenAI's embedding function
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-ada-002"
        )
    
    def create_collection(self, name: str) -> Any:
        """Create or get a collection."""
        return self.client.create_collection(
            name=name,
            embedding_function=self.embedding_function,
            get_or_create=True
        )
    
    async def add_texts(self, collection_name: str, texts: List[str], metadata: List[Dict] = None) -> None:
        """Add texts to the vector store."""
        collection = self.create_collection(collection_name)
        
        # If no metadata is provided, create empty metadata for each text
        if metadata is None:
            metadata = [{"index": i} for i in range(len(texts))]
        
        # Add texts with their IDs and metadata
        collection.add(
            documents=texts,
            ids=[f"text_{i}" for i in range(len(texts))],
            metadatas=metadata
        )
    
    async def similarity_search(
        self,
        collection_name: str,
        query: str,
        n_results: int = 4
    ) -> List[Dict[str, Any]]:
        """Search for similar texts in the vector store."""
        collection = self.create_collection(collection_name)
        
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        return results

# Initialize the vector store
vector_store = VectorStore() 