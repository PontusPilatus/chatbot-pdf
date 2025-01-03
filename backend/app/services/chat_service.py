from typing import AsyncGenerator, List, Dict
from .vector_store import vector_store
import logging
from datetime import datetime
from sentence_transformers import SentenceTransformer, util
import torch
import re

logger = logging.getLogger(__name__)

class Message:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content
        self.timestamp = datetime.now()

class Conversation:
    def __init__(self, max_messages: int = 10):
        self.messages: List[Message] = []
        self.max_messages = max_messages

    def add_message(self, role: str, content: str):
        self.messages.append(Message(role, content))
        if len(self.messages) > self.max_messages:
            self.messages.pop(0)

    def get_context(self, max_chars: int = 2000) -> str:
        context = []
        total_chars = 0
        for msg in reversed(self.messages):
            msg_text = f"{msg.role}: {msg.content}"
            if total_chars + len(msg_text) > max_chars:
                break
            context.insert(0, msg_text)
            total_chars += len(msg_text)
        return "\n".join(context)

class ChatService:
    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.system_prompt = """You are a helpful AI assistant that answers questions about PDF documents.
        You should:
        1. Answer questions based on the provided context
        2. If you don't know the answer or the context doesn't contain relevant information, say so
        3. Be concise and clear in your responses
        4. If the context is not relevant to the question, say so
        5. Maintain conversation continuity by referring to previous context when relevant
        """

    def _get_or_create_conversation(self, filename: str | None) -> Conversation:
        if not filename:
            return Conversation()
        if filename not in self.conversations:
            self.conversations[filename] = Conversation()
        return self.conversations[filename]

    async def get_relevant_context(self, query: str, filename: str | None, conversation: Conversation) -> str:
        if not filename:
            return ""
        try:
            # Get document metadata first
            pdf_processor = PDFProcessor()
            try:
                result = await pdf_processor.process_pdf(filename)
                metadata = result["metadata"]
                print(f"Got metadata: {metadata}")  # Debug log
            except Exception as e:
                print(f"Error getting metadata: {e}")
                metadata = None

            # Handle metadata-specific questions
            query_lower = query.lower()
            if metadata:
                # Add direct metadata response for common questions
                if any(word in query_lower for word in ["how many pages", "page count", "number of pages"]):
                    return f"Document context:\nThe document has {metadata['pages']} pages."
                elif "title" in query_lower:
                    return f"Document context:\nThe document title is: {metadata['title']}"
                elif any(word in query_lower for word in ["author", "who wrote", "written by"]):
                    return f"Document context:\nThe document author is: {metadata['author']}"
                elif any(word in query_lower for word in ["when", "date", "created"]):
                    return f"Document context:\nThe document was created on: {metadata['creation_date']}"

            # Get more context for better accuracy
            results = await vector_store.similarity_search(query, filename, n_results=12)
            
            if not results:
                print("No results from vector store")
                # If it's a metadata question but we didn't find results, use metadata
                if metadata and "pages" in query_lower:
                    return f"Document context:\nThe document has {metadata['pages']} pages."
                return ""
                
            # Clean the results and extract page numbers
            cleaned_results = []
            for result in results:
                # Skip empty or invalid results
                if not result or len(result.strip()) < 10:
                    continue
                    
                # Extract page number if present
                page_match = re.search(r'\[Page (\d+)\]', result)
                page_num = f" (Page {page_match.group(1)})" if page_match else ""
                
                # Clean the text and add page reference
                cleaned_text = result.replace(page_match.group(0), '').strip() if page_match else result.strip()
                if cleaned_text and len(cleaned_text) > 20:  # Only keep substantial content
                    cleaned_results.append(cleaned_text + page_num)
            
            if not cleaned_results:
                print("No valid results after cleaning")
                # Fallback to metadata for specific questions
                if metadata and "pages" in query_lower:
                    return f"Document context:\nThe document has {metadata['pages']} pages."
                return ""
                
            doc_context = "\n".join(cleaned_results)
            conv_context = conversation.get_context()

            if doc_context and conv_context:
                return f"Previous conversation:\n{conv_context}\n\nDocument context:\n{doc_context}"
            elif doc_context:
                return f"Document context:\n{doc_context}"
            return ""

        except Exception as e:
            logger.error(f"Error getting context: {str(e)}")
            return ""

    async def get_general_response(self, query: str) -> AsyncGenerator[str, None]:
        general_info = """I am a PDF chatbot that can help you understand PDF documents. You can:
        1. Upload a PDF file (max 10MB)
        2. Ask questions about its contents
        3. Get summaries and explanations
        
        I process PDFs locally and don't store any information permanently."""

        # Simple keyword-based responses for common questions
        responses = {
            "help": "I can help you understand PDF documents. Upload a PDF and ask me questions about it!",
            "upload": "Click the upload area or drag and drop a PDF file (max 10MB) to get started.",
            "size": "The maximum file size for PDFs is 10MB.",
            "format": "I only accept PDF files.",
            "privacy": "Your PDFs are processed locally and not stored permanently. Avoid uploading sensitive information.",
            "how": "1. Upload a PDF\n2. Wait for processing\n3. Ask questions about the content",
        }

        # Check for keyword matches
        for keyword, response in responses.items():
            if keyword.lower() in query.lower():
                yield response
                return

        # Default response for general questions
        yield "I'm a PDF chatbot. Upload a PDF file and I'll help you understand its contents. What would you like to know?"

    async def stream_chat(self, query: str, filename: str | None) -> AsyncGenerator[str, None]:
        try:
            conversation = self._get_or_create_conversation(filename)

            # Handle general questions when no PDF is uploaded
            if not filename:
                async for chunk in self.get_general_response(query):
                    yield chunk
                return

            # Get context from the PDF
            context = await self.get_relevant_context(query, filename, conversation)
            
            if not context:
                yield "I couldn't find any relevant information in the document. Please try rephrasing your question or ask about a different topic."
                return

            # Add the user's question to conversation history
            conversation.add_message("user", query)

            try:
                # Extract document context
                if "Document context:" not in context:
                    yield "I couldn't find relevant information in the document to answer your question."
                    return
                    
                doc_context = context.split("Document context:")[1].strip()
                
                # Split into meaningful chunks
                chunks = [c.strip() for c in doc_context.split('\n') if c.strip()]
                if not chunks:
                    yield "I couldn't find relevant information in the document to answer your question."
                    return

                # Get embeddings for query and chunks
                query_embedding = self.model.encode(query, convert_to_tensor=True)
                chunk_embeddings = self.model.encode(chunks, convert_to_tensor=True)
                
                # Calculate similarity scores
                similarities = util.pytorch_cos_sim(query_embedding, chunk_embeddings)[0]
                
                # Get most relevant chunks
                relevant_chunks = []
                for idx, score in enumerate(similarities):
                    if score > 0.3:  # Lower threshold to get more context
                        relevant_chunks.append((chunks[idx], score.item()))
                
                # Sort by similarity score
                relevant_chunks.sort(key=lambda x: x[1], reverse=True)
                
                if not relevant_chunks:
                    yield "I couldn't find a relevant answer to your question in the document."
                    return
                
                # Take top most relevant chunks
                top_chunks = [c[0] for c in relevant_chunks[:3]]
                
                # Extract page numbers if present
                page_info = ""
                for chunk in top_chunks:
                    page_match = re.search(r'\(Page (\d+)\)', chunk)
                    if page_match:
                        if page_info:
                            page_info += f" and {page_match.group(1)}"
                        else:
                            page_info = f"On page {page_match.group(1)}"

                # Clean chunks by removing page numbers and other artifacts
                cleaned_chunks = [re.sub(r'\(Page \d+\)', '', chunk).strip() for chunk in top_chunks]
                cleaned_chunks = [re.sub(r'\[.*?\]', '', chunk).strip() for chunk in cleaned_chunks]
                
                # Combine chunks into a coherent response
                if page_info:
                    response = f"{page_info}, the document states: {' '.join(cleaned_chunks)}"
                else:
                    response = f"According to the document: {' '.join(cleaned_chunks)}"

                # Stream the response word by word
                for word in response.split():
                    yield word + " "

                # Add assistant response to conversation history
                conversation.add_message("assistant", response)

            except Exception as e:
                logger.error(f"Error generating response: {str(e)}")
                yield "I encountered an error while processing your question. Please try asking in a different way."
                
        except Exception as e:
            logger.error(f"Error in stream_chat: {str(e)}")
            yield "Sorry, I encountered an error. Please try again."

chat_service = ChatService() 