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
        try:
            collection = self.create_collection(collection_name)
            
            # Filter out empty texts
            valid_texts = [(i, text) for i, text in enumerate(texts) if text and len(text.strip()) > 0]
            
            if not valid_texts:
                print("No valid texts to add")
                return
                
            # Prepare the data
            indices, filtered_texts = zip(*valid_texts)
            
            # Prepare metadata
            if metadata is None:
                metadata = [{"index": i} for i in indices]
            else:
                metadata = [metadata[i] for i in indices]
            
            # Add documents
            collection.add(
                documents=list(filtered_texts),
                ids=[f"text_{i}" for i in indices],
                metadatas=metadata
            )
            
            print(f"Added {len(filtered_texts)} texts to collection {collection_name}")
            
        except Exception as e:
            print(f"Error adding texts: {str(e)}")
            raise
    
    async def similarity_search(
        self,
        query: str,
        collection_name: str,
        n_results: int = 4
    ) -> List[str]:
        """Search for similar texts in the vector store."""
        try:
            sanitized_name = self._sanitize_collection_name(collection_name)
            collection = self.create_collection(sanitized_name)
            
            # Add logging to debug
            print(f"Searching collection: {sanitized_name}")
            print(f"Original query: {query}")
            
            # Clean and enhance query
            cleaned_query = query.strip().lower()
            # Add common variations for better matching
            enhanced_queries = [cleaned_query]
            if "what" in cleaned_query:
                enhanced_queries.append(cleaned_query.replace("what", "").strip())
            if "how" in cleaned_query:
                enhanced_queries.append(cleaned_query.replace("how", "").strip())
            if "can you" in cleaned_query:
                enhanced_queries.append(cleaned_query.replace("can you", "").strip())
            
            print(f"Enhanced queries: {enhanced_queries}")  # Debug log
            
            all_results = []
            for q in enhanced_queries:
                # Get results for each query variation
                results = collection.query(
                    query_texts=[q],
                    n_results=n_results * 2  # Get more results to filter
                )
                
                if results and 'documents' in results and results['documents']:
                    documents = results['documents'][0]  # First list contains matches
                    distances = results['distances'][0] if 'distances' in results else None
                    
                    if documents and distances:
                        # Pair documents with their distances
                        all_results.extend(list(zip(documents, distances)))
            
            if not all_results:
                print("No results found")
                return []
            
            # Sort all results by distance
            all_results.sort(key=lambda x: x[1])
            
            # Remove duplicates while preserving order
            seen = set()
            unique_results = []
            for doc, dist in all_results:
                if doc not in seen and len(doc.strip()) > 50:
                    seen.add(doc)
                    unique_results.append((doc, dist))
            
            # Take top n_results
            final_results = [doc for doc, _ in unique_results[:n_results]]
            
            print(f"Final results count: {len(final_results)}")  # Debug log
            return final_results
            
        except Exception as e:
            print(f"Error in similarity search: {str(e)}")
            return []

# Initialize the vector store
vector_store = VectorStore() 