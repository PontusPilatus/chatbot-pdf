from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import os
from pathlib import Path
import re
import openai
from openai import AsyncOpenAI
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential
import tiktoken
import logging

# Set up basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, persist_dir: Path = Path("app/chroma_db")):
        self.persist_dir = persist_dir
        self.persist_dir.mkdir(exist_ok=True)
        self.client = chromadb.Client(Settings(
            persist_directory=str(persist_dir),
            anonymized_telemetry=False
        ))
        # Use OpenAI embeddings
        self.openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-ada-002",
            organization_id=os.getenv("OPENAI_ORG_ID")  # Optional
        )
        # Initialize tokenizer for counting tokens
        self.tokenizer = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken."""
        return len(self.tokenizer.encode(text))

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def add_texts(self, collection_name: str, texts: List[str], metadata: List[Dict[str, Any]] | None = None) -> None:
        """Add texts to the vector store."""
        try:
            # Count total tokens for embeddings
            total_tokens = sum(self.count_tokens(text) for text in texts)
            
            # Log embedding token usage
            logger.info(f"Adding {len(texts)} texts to collection {collection_name} ({total_tokens} tokens)")
            
            # Sanitize collection name
            collection_name = self._sanitize_collection_name(collection_name)
            
            # Get or create collection
            collection = self.client.get_or_create_collection(
                name=collection_name,
                embedding_function=self.embedding_function
            )
            
            # Filter out empty texts
            valid_texts = [(i, text) for i, text in enumerate(texts) if text and len(text.strip()) > 0]
            if not valid_texts:
                logger.warning("No valid texts to add")
                return
                
            # Prepare the data
            indices, filtered_texts = zip(*valid_texts)
            
            # Prepare metadata
            if metadata is None:
                metadata = [{"index": i} for i in indices]
            else:
                metadata = [metadata[i] for i in indices]
            
            # Add documents in batches to avoid rate limits
            batch_size = 100
            for i in range(0, len(filtered_texts), batch_size):
                batch_texts = filtered_texts[i:i + batch_size]
                batch_metadata = metadata[i:i + batch_size]
                batch_ids = [f"doc_{j}" for j in range(i, i + len(batch_texts))]
                
                # Add batch to collection
                collection.add(
                    documents=list(batch_texts),
                    metadatas=batch_metadata,
                    ids=batch_ids
                )
                
                logger.info(f"Added batch {i//batch_size + 1} to collection {collection_name}")
                
                # Sleep briefly between batches
                if i + batch_size < len(filtered_texts):
                    await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"Error adding texts to vector store: {str(e)}")
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def similarity_search(self, collection_name: str, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar texts in the vector store."""
        try:
            # Count query tokens for embeddings
            query_tokens = self.count_tokens(query)
            
            # Log search
            logger.info(f"Searching collection {collection_name} for: {query[:50]}...")
            
            # Sanitize collection name
            collection_name = self._sanitize_collection_name(collection_name)
            
            # Get collection
            collection = self.client.get_collection(
                name=collection_name,
                embedding_function=self.embedding_function
            )
            
            # Query the collection
            results = collection.query(
                query_texts=[query],
                n_results=k
            )
            
            # Format results
            formatted_results = []
            if results and 'documents' in results and results['documents']:
                documents = results['documents'][0]
                metadatas = results['metadatas'][0] if results['metadatas'] else [{}] * len(documents)
                distances = results['distances'][0] if results['distances'] else [0.0] * len(documents)
                
                for doc, meta, dist in zip(documents, metadatas, distances):
                    if doc and len(doc.strip()) > 0:  # Only include non-empty results
                        formatted_results.append({
                            "text": doc,
                            "metadata": meta,
                            "score": float(dist)
                        })
            
            logger.info(f"Found {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            return []

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

    async def delete_collection(self, collection_name: str) -> None:
        """Delete a collection from the vector store."""
        try:
            # Sanitize collection name
            collection_name = self._sanitize_collection_name(collection_name)
            
            # Delete the collection
            self.client.delete_collection(collection_name)
            logger.info(f"Collection deleted: {collection_name}")
            
        except Exception as e:
            logger.error(f"Error deleting collection {collection_name}: {str(e)}")
            raise

# Create a singleton instance
vector_store = VectorStore() 