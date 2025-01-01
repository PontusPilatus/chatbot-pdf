from typing import List, Dict, Optional
from .vector_store import vector_store
import re

class ChatService:
    def __init__(self):
        self.system_prompt = """You are a helpful AI assistant that answers questions about PDF documents.
        You should:
        1. Answer questions based on the provided context
        2. If you don't know the answer or the context doesn't contain relevant information, say so
        3. Be concise and clear in your responses
        4. If the context is not relevant to the question, say so
        5. If the content is in Swedish, respond in Swedish
        6. Preserve any page number references in your response
        """
        
    def get_general_response(self, query: str) -> str:
        """Handle general questions about the chatbot's functionality."""
        # Common questions and their responses
        general_responses = {
            "help": "I can help you with:\n• Reading and analyzing PDF documents\n• Answering questions about PDF content\n• Processing documents up to 10MB in size\n• Handling both English and Swedish text",
            "process": "I process PDFs by:\n1. Extracting text from the document\n2. Breaking it into manageable chunks\n3. Using AI to understand and answer questions about the content",
            "features": "My main features include:\n• PDF text extraction\n• Question answering\n• Multi-language support (English/Swedish)\n• Context-aware responses",
            "limitations": "My limitations include:\n• 10MB maximum file size\n• Text-only processing (no images)\n• Responses based on available context",
            "upload": "To upload a PDF:\n1. Drag and drop a file into the upload box\n2. Or click 'choose a file'\n3. Maximum file size is 10MB\n4. Only PDF format is supported",
        }

        # Convert query to lowercase for matching
        query_lower = query.lower()
        
        # Check for keywords in the query
        if any(word in query_lower for word in ["what can you do", "help", "capabilities"]):
            return general_responses["help"]
        elif any(word in query_lower for word in ["process", "how do you work", "how does it work"]):
            return general_responses["process"]
        elif any(word in query_lower for word in ["feature", "ability", "abilities"]):
            return general_responses["features"]
        elif any(word in query_lower for word in ["limit", "restriction", "cannot", "can't"]):
            return general_responses["limitations"]
        elif any(word in query_lower for word in ["upload", "file", "pdf", "document"]):
            return general_responses["upload"]
        else:
            return "I'm here to help you with PDF documents. You can ask me about:\n• How I process PDFs\n• My features and capabilities\n• How to upload documents\n• My limitations\n\nOr you can upload a PDF to start asking questions about its content."

    async def get_relevant_context(self, query: str, filename: str, n_results: int = 2) -> str:
        """Get relevant context from the vector store."""
        try:
            results = await vector_store.similarity_search(filename, query, n_results)
            if not results or not results['documents']:
                return ""
            
            # Get all relevant chunks with their page numbers
            contexts = []
            for chunk in results['documents'][0]:
                # Extract page number if present
                page_match = re.search(r'\[Page (\d+)\]', chunk)
                page_num = page_match.group(1) if page_match else "unknown"
                # Clean the chunk text
                clean_chunk = re.sub(r'\[Page \d+\]', '', chunk).strip()
                if clean_chunk:  # Only add non-empty chunks
                    contexts.append((clean_chunk, page_num))
            
            # Join contexts with page references, limit to most relevant parts
            context = "\n\n".join([f"{text} (Page {page})" for text, page in contexts[:2]])
            return context
        except Exception as e:
            print(f"Error getting context: {str(e)}")
            return ""

    def detect_language(self, text: str) -> str:
        """Simple language detection for Swedish/English."""
        swedish_chars = set('åäöÅÄÖ')
        has_swedish = any(char in swedish_chars for char in text)
        # Count Swedish-specific words
        swedish_words = {'och', 'att', 'det', 'är', 'på', 'för', 'med', 'av'}
        word_count = sum(1 for word in text.lower().split() if word in swedish_words)
        
        return 'swedish' if has_swedish or word_count > 2 else 'english'

    async def generate_response(self, query: str, context: str) -> str:
        """Generate a response based on the query and context."""
        if not context:
            return "I don't have enough context from the PDF to answer that question. Could you try uploading the PDF again or asking a different question?"

        try:
            # Detect language
            language = self.detect_language(context)
            
            # Format response based on language
            if language == 'swedish':
                return f"Baserat på dokumentet:\n\n{context}"
            else:
                return f"Based on the document:\n\n{context}"
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return "I encountered an error while trying to generate a response. Please try again."

    async def chat(self, message: str, filename: str | None) -> Dict[str, str]:
        """Process a chat message and return a response."""
        try:
            # If no PDF is uploaded, handle general questions
            if not filename:
                response = self.get_general_response(message)
                return {
                    "answer": response,
                    "sources": None
                }

            # Get relevant context from the vector store
            context = await self.get_relevant_context(message, filename)
            
            # Generate response
            response = await self.generate_response(message, context)
            
            return {
                "answer": response,
                "sources": context if context else None
            }
        except Exception as e:
            print(f"Error in chat: {str(e)}")
            return {
                "answer": "I encountered an error while processing your question. Please try again.",
                "sources": None
            }

# Initialize the chat service
chat_service = ChatService() 