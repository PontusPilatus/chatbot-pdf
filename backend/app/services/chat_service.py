from typing import AsyncGenerator, List, Dict, Any
from .vector_store import vector_store
import logging
from datetime import datetime
import openai
from openai import AsyncOpenAI
import os
import json
import tiktoken
import re
from langdetect import detect, LangDetectException
import traceback

logger = logging.getLogger(__name__)

class Message:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content
        self.timestamp = datetime.now()
        try:
            self.language = detect(content) if content.strip() else 'en'
        except LangDetectException:
            self.language = 'en'

class Conversation:
    def __init__(self, max_messages: int = 10):
        self.messages: List[Message] = []
        self.max_messages = max_messages
        self.current_language = 'en'
        self.language_locked = False  # Track if language has been set

    def add_message(self, role: str, content: str):
        message = Message(role, content)
        self.messages.append(message)
        
        # Only update language based on user messages
        if role == 'user':
            try:
                detected_lang = detect(content) if content.strip() else self.current_language
                # Only update language if it's different and not locked
                if not self.language_locked or detected_lang != self.current_language:
                    self.current_language = detected_lang
                    self.language_locked = True  # Lock language after first detection
            except LangDetectException:
                # Keep current language if detection fails
                pass

        # Maintain conversation history
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

class UsageControl:
    def __init__(self):
        # Load configuration from environment
        self.max_daily_cost = float(os.getenv("MAX_DAILY_COST", "1.0"))
        self.max_tokens_per_request = int(os.getenv("MAX_TOKENS_PER_REQUEST", "2000"))
        self.rate_limit_per_min = int(os.getenv("RATE_LIMIT_PER_MIN", "10"))
        
        # Initialize counters
        self.current_daily_cost = 0.0
        self.last_reset = datetime.now()
        self.rate_limit_count = 0
        self.rate_limit_time = datetime.now()
        
        # Token usage tracking
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.total_embedding_tokens = 0
        
        # GPT-3.5 Turbo pricing (per 1K tokens)
        self.input_price_per_1k = 0.0005
        self.output_price_per_1k = 0.0015
        self.embedding_price_per_1k = 0.0001
        
        # Initialize tokenizer
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken."""
        return len(self.tokenizer.encode(text))
        
    def calculate_cost(self, input_tokens: int, output_tokens: int, embedding_tokens: int = 0) -> float:
        """Calculate cost in USD for token usage."""
        input_cost = (input_tokens / 1000) * self.input_price_per_1k
        output_cost = (output_tokens / 1000) * self.output_price_per_1k
        embedding_cost = (embedding_tokens / 1000) * self.embedding_price_per_1k
        return input_cost + output_cost + embedding_cost
        
    def log_usage(self, prompt_tokens: int = 0, completion_tokens: int = 0, embedding_tokens: int = 0):
        """Log token usage."""
        self.total_prompt_tokens += prompt_tokens
        self.total_completion_tokens += completion_tokens
        self.total_embedding_tokens += embedding_tokens
        
        # Calculate costs
        cost = self.calculate_cost(prompt_tokens, completion_tokens, embedding_tokens)
        self.current_daily_cost += cost
        
        # Log usage
        logger.info("token_usage", {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "embedding_tokens": embedding_tokens,
            "total_tokens": prompt_tokens + completion_tokens + embedding_tokens,
            "cost_usd": cost,
            "total_cost_usd": self.current_daily_cost,
            "total_prompt_tokens": self.total_prompt_tokens,
            "total_completion_tokens": self.total_completion_tokens,
            "total_embedding_tokens": self.total_embedding_tokens
        })

    def check_rate_limit(self) -> bool:
        """Check if we're within rate limits."""
        now = datetime.now()
        # Reset counter every minute
        if (now - self.rate_limit_time).seconds >= 60:
            self.rate_limit_count = 0
            self.rate_limit_time = now
        
        if self.rate_limit_count >= self.rate_limit_per_min:
            return False
            
        self.rate_limit_count += 1
        return True
        
    def check_cost_limit(self, estimated_cost: float) -> bool:
        """Check if we're within cost limits."""
        now = datetime.now()
        # Reset daily counter
        if (now - self.last_reset).days >= 1:
            self.current_daily_cost = 0
            self.last_reset = now
            
        if self.current_daily_cost + estimated_cost > self.max_daily_cost:
            return False
            
        self.current_daily_cost += estimated_cost
        return True

class ChatService:
    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.usage_control = UsageControl()
        self.max_context_tokens = 4000  # Maximum tokens for context (leaving room for response)
        self.vector_store = vector_store  # Import the singleton instance
        self.system_prompt = """You are a helpful multilingual PDF assistant. You will:
        1. Answer questions based on the provided PDF context
        2. Always respond in the same language as the user's question
        3. If you can't access the document or find relevant information, explain this clearly
        4. Never switch languages unless the user does
        5. Be consistent in your responses
        6. If you see [Error: ...] or [Document: ...] messages, explain the issue clearly in the user's language
        
        Remember: Stay in the user's chosen language throughout the entire conversation."""

    async def get_relevant_context(self, query: str, filename: str | None = None) -> str:
        """Get relevant context for the query from vector store."""
        try:
            if not filename:
                return ""

            logger.info(f"Getting context for query: {query[:50]}... from file: {filename}")

            # Get base collection name
            base_name = vector_store._sanitize_collection_name(filename)
            logger.info(f"Base collection name: {base_name}")
            
            # List all collections
            collections = vector_store.client.list_collections()
            logger.info(f"Available collections: {[c.name for c in collections]}")
            
            # Find matching collections
            matching_collections = [c for c in collections if c.name.startswith(base_name)]
            logger.info(f"Found matching collections: {[c.name for c in matching_collections]}")
            
            if not matching_collections:
                logger.error(f"No collections found matching {base_name}")
                return f"[Document '{filename}' not found in the database]"
            
            try:
                # Try to detect query language
                try:
                    query_lang = detect(query)
                    logger.info(f"Detected query language: {query_lang}")
                except:
                    query_lang = None
                    logger.info("Could not detect query language, will search all collections")
                
                # Search with language if detected
                results = await vector_store.similarity_search(
                    collection_name=filename,
                    query=query,
                    k=5,
                    language=query_lang
                )
                
                if results:
                    # Join the content of relevant chunks
                    context = "\n\n".join([r["text"] for r in results])
                    logger.info(f"Found {len(results)} relevant chunks, total length: {len(context)}")
                    return context
                else:
                    logger.warning(f"No relevant content found in collections")
                    return f"[No relevant content found in document '{filename}']"
                    
            except Exception as e:
                if "Embedding dimension" in str(e):
                    # Delete the collection if there's a dimension mismatch
                    logger.info(f"Deleting collection due to dimension mismatch: {base_name}")
                    await vector_store.delete_collection(filename)
                    return f"[Please re-upload the document '{filename}' to update its embeddings]"
                raise
                
        except Exception as e:
            logger.error(f"Error getting context: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return f"[Error accessing document: {str(e)}]"

    async def stream_chat(self, message: str, filename: str | None) -> AsyncGenerator[str, None]:
        """Stream chat responses with proper language and context handling."""
        try:
            # Check rate limits first
            if not self.usage_control.check_rate_limit():
                yield "Rate limit exceeded. Please wait before making more requests."
                return

            # Get or create conversation for this file
            self.conversation = self._get_or_create_conversation(filename)

            # Get relevant context first - await the coroutine
            context = await self.get_relevant_context(message, filename)
            
            # Add user message and update conversation language
            self.conversation.add_message("user", message)
            
            # Prepare messages for OpenAI
            messages = []
            
            # Add system prompt in conversation language
            messages.append({"role": "system", "content": self.system_prompt})
            
            # Add context if available
            if context and not context.startswith("["):  # Only add if it's not an error message
                messages.append({
                    "role": "system", 
                    "content": f"Here is relevant information from the document:\n\n{context}"
                })
            elif context.startswith("["):  # If it's an error message, yield it and return
                yield context
                return
            
            # Add conversation history
            messages.extend([
                {"role": msg.role, "content": msg.content} 
                for msg in self.conversation.messages[-5:]  # Last 5 messages
            ])

            # Stream response from OpenAI
            stream = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                stream=True,
                temperature=0.7,
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

            # Update usage after successful completion
            self.usage_control.log_usage()
            
        except Exception as e:
            error_msg = f"An error occurred: {str(e)}"
            yield error_msg
            logger.error(f"Error in stream_chat: {error_msg}")

    def _get_or_create_conversation(self, filename: str | None) -> Conversation:
        """Get or create a conversation for a file."""
        if not filename:
            return Conversation()
        if filename not in self.conversations:
            self.conversations[filename] = Conversation()
        return self.conversations[filename]

    async def get_general_response(self, query: str) -> AsyncGenerator[str, None]:
        """Handle general questions about the chatbot."""
        try:
            messages = [
                {"role": "system", "content": """Welcome! I'm your multilingual PDF assistant. I can help you understand any PDF document, 
                and you can chat with me in any language you prefer - whether it's English, Swedish, Spanish, German, Chinese, Arabic, or any other language. 
                I'll automatically detect your language and respond accordingly. How can I assist you today?"""},
                {"role": "user", "content": query}
            ]

            stream = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=200,
                temperature=0.7,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(f"Error in general response: {str(e)}")
            yield "I'm a multilingual PDF chatbot. You can chat with me in any language! Upload a PDF file and I'll help you understand its contents."

# Create a singleton instance
chat_service = ChatService() 