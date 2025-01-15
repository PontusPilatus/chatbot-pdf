from typing import List, Dict, Any, Tuple
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
import traceback

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
        # Use OpenAI embeddings - multilingual model
        self.openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-3-large",  # 1536 dimensions
            organization_id=os.getenv("OPENAI_ORG_ID")  # Optional
        )
        # Initialize tokenizer for counting tokens
        self.tokenizer = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken."""
        return len(self.tokenizer.encode(text))

    def get_collection_name(self, base_name: str, language: str = 'en') -> str:
        """Get language-specific collection name."""
        # First sanitize the base name
        sanitized_base = self._sanitize_collection_name(base_name)
        # Then append the language code
        return f"{sanitized_base}_{language}"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def add_texts(self, collection_name: str, texts: List[str], metadata: List[Dict[str, Any]] | None = None) -> None:
        """Add texts to the vector store."""
        try:
            # Count total tokens for embeddings
            total_tokens = sum(self.count_tokens(text) for text in texts)
            
            # Log embedding token usage
            logger.info(f"Adding {len(texts)} texts to collection {collection_name} ({total_tokens} tokens)")
            
            # Get language from metadata if available
            language = metadata[0].get('language', 'en') if metadata and metadata[0] else 'en'
            logger.info(f"Using language: {language} for collection")
            
            # Get language-specific collection name
            collection_name = self.get_collection_name(collection_name, language)
            logger.info(f"Using collection: {collection_name} for language: {language}")
            
            # Get or create collection
            collection = self.client.get_or_create_collection(
                name=collection_name,
                embedding_function=self.embedding_function
            )
            
            # Filter out empty texts but with a very low threshold
            valid_texts = [(i, text) for i, text in enumerate(texts) if text and len(text.strip()) > 10]
            if not valid_texts:
                logger.warning("No valid texts to add")
                return
            
            logger.info(f"Found {len(valid_texts)} valid chunks out of {len(texts)} total chunks")
            
            # Prepare the data
            indices, filtered_texts = zip(*valid_texts)
            
            # Log some sample text
            if filtered_texts:
                sample_text = filtered_texts[0][:200] + "..." if len(filtered_texts[0]) > 200 else filtered_texts[0]
                logger.info(f"Sample text from first chunk: {sample_text}")
            
            # Prepare metadata
            if metadata is None:
                metadata = [{"index": i, "language": language} for i in indices]
            else:
                metadata = [dict(m, language=language) for m in [metadata[i] for i in indices]]
            
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
    async def similarity_search(self, collection_name: str, query: str, k: int = 5, language: str = None) -> List[Dict[str, Any]]:
        """Search for similar texts in the vector store."""
        try:
            # Count query tokens for embeddings
            query_tokens = self.count_tokens(query)
            
            # Log search
            logger.info(f"Searching collection {collection_name} for: {query[:50]}...")
            
            # Get base collection name without language suffix
            base_name = self._sanitize_collection_name(collection_name)
            logger.info(f"Base collection name: {base_name}")
            
            # List all collections
            all_collections = self.client.list_collections()
            logger.info(f"Available collections: {[c.name for c in all_collections]}")
            
            # If language is specified, search only that collection
            if language:
                collection_names = [self.get_collection_name(collection_name, language)]
                logger.info(f"Searching language-specific collection: {collection_names}")
            else:
                # Try to get all language variants of the collection
                collection_names = [
                    c.name for c in all_collections
                    if c.name.startswith(base_name)
                ]
                logger.info(f"Searching all language variants: {collection_names}")
            
            if not collection_names:
                logger.error(f"No matching collections found for {base_name}")
                return []
            
            all_results = []
            for coll_name in collection_names:
                try:
                    # Get collection
                    collection = self.client.get_collection(
                        name=coll_name,
                        embedding_function=self.embedding_function
                    )
                    logger.info(f"Retrieved collection: {coll_name}")
                    
                    # Query the collection
                    results = collection.query(
                        query_texts=[query],
                        n_results=k
                    )
                    
                    # Format results
                    if results and 'documents' in results and results['documents']:
                        documents = results['documents'][0]
                        metadatas = results['metadatas'][0] if results['metadatas'] else [{}] * len(documents)
                        distances = results['distances'][0] if results['distances'] else [0.0] * len(documents)
                        
                        logger.info(f"Found {len(documents)} results in collection {coll_name}")
                        
                        for doc, meta, dist in zip(documents, metadatas, distances):
                            if doc and len(doc.strip()) > 0:  # Only include non-empty results
                                all_results.append({
                                    "text": doc,
                                    "metadata": meta,
                                    "score": float(dist)
                                })
                                # Log a sample of each result
                                sample = doc[:100] + "..." if len(doc) > 100 else doc
                                logger.info(f"Result sample (score {dist}): {sample}")
                    else:
                        logger.warning(f"No results found in collection {coll_name}")
                        
                except Exception as e:
                    logger.error(f"Error searching collection {coll_name}: {str(e)}")
                    continue
            
            # Sort all results by score
            all_results.sort(key=lambda x: x["score"])
            
            # Return top k results
            results = all_results[:k]
            logger.info(f"Returning {len(results)} total results across {len(collection_names)} collections")
            return results
            
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return []

    def _sanitize_collection_name(self, name: str) -> str:
        """Sanitize collection name to meet ChromaDB requirements."""
        # Remove file extension and path
        name = os.path.splitext(os.path.basename(name))[0]
        
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
        
        return name.lower()  # Ensure consistent case

    async def delete_collection(self, collection_name: str) -> None:
        """Delete a collection from the vector store."""
        try:
            # Get all language variants of the collection
            collection_names = [
                name for name in self.client.list_collections()
                if name.startswith(self._sanitize_collection_name(collection_name))
            ]
            
            # Delete all language variants
            for name in collection_names:
                self.client.delete_collection(name)
                logger.info(f"Collection deleted: {name}")
            
        except Exception as e:
            logger.error(f"Error deleting collections for {collection_name}: {str(e)}")
            raise

    def similarity_search_with_score(self, query: str, collection_name: str, k: int = 3, score_threshold: float = 0.7) -> List[Tuple[Any, float]]:
        """Search for similar documents with relevance scores."""
        try:
            # Get collection
            collection = self.client.get_collection(collection_name)
            
            # Query the collection
            results = collection.query(
                query_texts=[query],
                n_results=k,
                include=["documents", "metadatas", "distances"]
            )

            # Process results
            documents = []
            if results["documents"] and results["documents"][0]:  # Check if we have results
                for doc, metadata, distance in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0]
                ):
                    # Convert distance to similarity score (ChromaDB returns L2 distance)
                    # Lower distance means higher similarity
                    similarity_score = 1.0 / (1.0 + distance)
                    
                    # Only include results above threshold
                    if similarity_score >= score_threshold:
                        doc_with_metadata = type('Document', (), {
                            'page_content': doc,
                            'metadata': metadata
                        })
                        documents.append((doc_with_metadata, similarity_score))

            return documents

        except Exception as e:
            logger.error(f"Error in similarity search: {str(e)}")
            raise

# Create a singleton instance
vector_store = VectorStore() 