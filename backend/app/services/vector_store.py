from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import os
from pathlib import Path
import re
from sentence_transformers import SentenceTransformer

class VectorStore:
    def __init__(self, persist_dir: Path = Path("chroma_db")):
        self.persist_dir = persist_dir
        self.persist_dir.mkdir(exist_ok=True)
        self.client = chromadb.Client(Settings(
            persist_directory=str(persist_dir),
            anonymized_telemetry=False
        ))
        # Use SentenceTransformers instead of OpenAI
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name='all-MiniLM-L6-v2'
        )

    def _sanitize_collection_name(self, name: str) -> str:
        """Sanitize collection name to meet ChromaDB requirements."""
        # Remove file extension
        name = os.path.splitext(name)[0]
        
        # Replace spaces and invalid characters with underscores
        name = re.sub(r'[^a-zA-Z0-9-]', '_', name)
        
        # Remove consecutive underscores
        name = re.sub(r'_+', '_', name)
        
        # Ensure it starts and ends with alphanumeric character
        name = re.sub(r'^[^a-zA-Z0-9]+', '', name)
        name = re.sub(r'[^a-zA-Z0-9]+$', '', name)
        
        # If name is too short, pad it
        if len(name) < 3:
            name = f"doc_{name}"
        
        # If name is too long, truncate it
        if len(name) > 63:
            name = name[:63]
            # Ensure it still ends with alphanumeric
            name = re.sub(r'[^a-zA-Z0-9]+$', '', name)
        
        return name
    
    def create_collection(self, name: str) -> Any:
        """Create or get a collection."""
        sanitized_name = self._sanitize_collection_name(name)
        return self.client.create_collection(
            name=sanitized_name,
            embedding_function=self.embedding_function,
            get_or_create=True
        )
    
    async def add_texts(self, collection_name: str, texts: List[str], metadata: List[Dict] = None) -> None:
        """Add texts to the vector store."""
        collection = self.create_collection(collection_name)
        
        if metadata is None:
            metadata = [{"index": i} for i in range(len(texts))]
        
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
        sanitized_name = self._sanitize_collection_name(collection_name)
        collection = self.create_collection(sanitized_name)
        
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        return results

# Initialize the vector store
vector_store = VectorStore() 