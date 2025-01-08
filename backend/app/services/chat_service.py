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

    def add_message(self, role: str, content: str):
        message = Message(role, content)
        self.messages.append(message)
        if role == 'user':  # Update language only based on user messages
            self.current_language = message.language
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
        self.system_prompt = """Welcome! I'm your multilingual PDF assistant. Feel free to ask questions in any language you're comfortable with.

        When working with PDFs, I will:
        1. Answer questions based on the provided context from the PDF
        2. If I don't know the answer or the context doesn't contain relevant information, I'll say so
        3. Be concise and clear in my responses
        4. If the context is not relevant to the question, I'll let you know
        5. Maintain conversation continuity by referring to previous context when relevant
        6. When citing information, mention the page number if available
        7. Base my answers strictly on the provided context, not on general knowledge
        8. Communicate in your preferred language throughout our conversation
        """

    async def get_relevant_context(self, query: str, filename: str, conversation: Conversation) -> str:
        """Get relevant context from the vector store with smart token management."""
        try:
            # Get similar chunks from vector store
            results = await vector_store.similarity_search(
                collection_name=filename,
                query=query,
                k=8  # Get more chunks initially, we'll filter based on relevance and tokens
            )
            
            if not results:
                return ""

            # Get conversation history with token count
            conv_history = conversation.get_context()
            conv_tokens = self.usage_control.count_tokens(conv_history)
            
            # Calculate remaining tokens for PDF context
            system_tokens = self.usage_control.count_tokens(self.system_prompt)
            query_tokens = self.usage_control.count_tokens(query)
            available_tokens = self.max_context_tokens - system_tokens - query_tokens - conv_tokens
            
            # Format context with conversation history
            context = "Previous conversation:\n" + conv_history + "\n\n"
            context += "Relevant document sections:\n"
            
            # Add chunks while respecting token limit and relevance score
            current_tokens = self.usage_control.count_tokens(context)
            added_chunks = 0
            
            for result in results:
                text = result["text"]
                score = result["score"]
                metadata = result.get("metadata", {})
                page = metadata.get("page", "unknown")
                
                # Only consider chunks with good relevance
                if score <= 0.5:
                    continue
                
                # Calculate tokens for this chunk
                chunk_text = f"\nSection {added_chunks + 1} (Page {page}):\n{text}\n"
                chunk_tokens = self.usage_control.count_tokens(chunk_text)
                
                # Check if adding this chunk would exceed token limit
                if current_tokens + chunk_tokens > available_tokens:
                    break
                
                context += chunk_text
                current_tokens += chunk_tokens
                added_chunks += 1
                
                # Stop after adding enough relevant chunks
                if added_chunks >= 5:
                    break

            logger.info(f"Context window usage: {current_tokens}/{self.max_context_tokens} tokens")
            return context

        except Exception as e:
            logger.error(f"Error getting context: {str(e)}")
            return ""

    async def stream_chat(self, query: str, filename: str | None) -> AsyncGenerator[str, None]:
        try:
            conversation = self._get_or_create_conversation(filename)
            
            # Get context from vector store if filename is provided
            context = ""
            if filename:
                context = await self.get_relevant_context(query, filename, conversation)

            # Add the user's message to conversation
            conversation.add_message("user", query)

            # Prepare the messages for the API
            messages = [
                {"role": "system", "content": "You are a helpful assistant. " +
                 "If context is provided, use it to answer questions accurately."}
            ]

            if context:
                messages.append({"role": "system", "content": f"Context from the document:\n{context}"})

            # Add conversation history
            for msg in conversation.messages[:-1]:  # Exclude the last message as we'll add it separately
                messages.append({"role": msg.role, "content": msg.content})

            # Add the current query with language instruction
            messages.append({"role": "user", "content": f"[Respond in {conversation.current_language}]\n{query}"})

            # Check rate limit
            if not self.usage_control.check_rate_limit():
                yield "Rate limit exceeded. Please wait a minute and try again."
                return

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

            # Prepare messages for OpenAI
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Context from the PDF:\n\n{context}\n\nQuestion: {query}"}
            ]
            
            # Count input tokens
            input_tokens = sum(self.usage_control.count_tokens(msg["content"]) for msg in messages)
            
            # Estimate output tokens (rough estimate)
            estimated_output_tokens = 500
            
            # Calculate estimated cost
            estimated_cost = self.usage_control.calculate_cost(input_tokens, estimated_output_tokens)
            
            # Check cost limit
            if not self.usage_control.check_cost_limit(estimated_cost):
                yield "Daily cost limit reached. Please try again tomorrow."
                return

            try:
                # Stream the response from OpenAI
                stream = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    max_tokens=self.usage_control.max_tokens_per_request,
                    temperature=0.7,
                    stream=True
                )

                response_text = ""
                completion_tokens = 0
                async for chunk in stream:
                    if chunk.choices[0].delta.content:
                        text = chunk.choices[0].delta.content
                        response_text += text
                        completion_tokens += self.usage_control.count_tokens(text)
                        yield text

                # Log token usage
                self.usage_control.log_usage(
                    prompt_tokens=input_tokens,
                    completion_tokens=completion_tokens
                )

                # Add messages to conversation history
                conversation.add_message("user", query)
                conversation.add_message("assistant", response_text)

            except Exception as e:
                logger.error(f"Error generating response: {str(e)}")
                yield "I encountered an error while processing your question. Please try asking in a different way."
                
        except Exception as e:
            logger.error(f"Error in stream_chat: {str(e)}")
            yield "Sorry, I encountered an error. Please try again."

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