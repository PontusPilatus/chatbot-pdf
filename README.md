# PDF Pal

An AI-powered companion that can answer questions about PDF documents. Built with Next.js, TypeScript, Python, and FastAPI.

## Features

- 📄 PDF Processing
  - Automatic text extraction and preprocessing
  - Smart text chunking for large documents
  - Vector embeddings for semantic search
  - ChromaDB for efficient document storage

- 💬 Chat Interface
  - Interactive real-time chat with streaming responses
  - Context-aware responses based on PDF content
  - Smart context window management
  - Conversation history tracking
  - Token usage optimization

- 📊 Resource Management
  - Rate limiting and usage controls
  - Token counting and cost estimation
  - Daily cost limits
  - Efficient context window utilization

- 🔄 Real-time Updates
  - Progress bar for file uploads
  - Loading states and animations
  - Error handling and user feedback
  - Streaming chat responses

## Project Structure

```
.
├── frontend/          # Next.js frontend application
└── backend/          # FastAPI backend application
    └── app/
        ├── api/      # API routes
        ├── models/   # Data models
        ├── services/ # Business logic
        └── utils/    # Utility functions
```

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Unix/MacOS:
     ```bash
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI server:
   ```bash
   cd app
   uvicorn main:app --reload
   ```

The backend API will be available at `http://localhost:8000`

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
Create a `.env` file in the backend directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key
MAX_DAILY_COST=1.0
MAX_MONTHLY_COST=20.0
MAX_TOKENS_PER_REQUEST=2000
RATE_LIMIT_PER_MIN=10
```

> **Important**: Never commit your actual API keys to version control. The values above are just examples.

## Security Notes

1. Environment Variables:
   - Create a `.env` file in the backend directory
   - Add your OpenAI API key and other configuration
   - The `.env` file is automatically ignored by git for security
   - Use `.env.example` as a template

2. API Keys:
   - Get your OpenAI API key from: https://platform.openai.com/account/api-keys
   - Keep your API keys secure and never commit them to version control
   - Consider using environment variables in production

## Project Roadmap

### PDF Processing Backend
- [x] Create PDF text extraction service
- [x] Implement text chunking for large documents
- [x] Set up vector database (ChromaDB) for document storage
- [x] Create embeddings generation service
- [x] Add document cleanup and preprocessing

### Chat Functionality
- [x] Create chat message interface/types
- [x] Implement chat history state management
- [x] Add chat message components
- [x] Create chat API endpoint in backend
- [x] Integrate with OpenAI/LLM API
- [x] Add streaming response support
- [x] Implement context window management

### File Management
- [ ] Add file list/history view
- [ ] Implement file deletion
- [ ] Add file size limits and validation
- [ ] Create file metadata storage
- [x] Add progress bar for uploads
- [ ] Handle duplicate file names

### UI/UX Improvements
- [x] Add loading states and animations
- [x] Implement error handling and user feedback
- [ ] Add mobile responsiveness
- [x] Create dark mode support
- [ ] Add keyboard shortcuts
- [ ] Implement session management

### Security & Performance
- [x] Add API rate limiting
- [x] Implement proper error handling
- [x] Add input sanitization
- [x] Optimize PDF processing for large files
- [ ] Add caching layer
- [x] Implement proper environment variable management

### Nice to Have Features
- [ ] Multi-file support (chat with multiple PDFs)
- [ ] Export chat history
- [ ] PDF preview
- [ ] Highlight relevant PDF sections in responses
- [ ] Save favorite/frequent questions
- [ ] User authentication

## Implementation Details

### Context Window Management
- Smart token counting for system prompts, conversation history, and PDF chunks
- Dynamic context selection based on relevance scores
- Token limit management to prevent API limits
- Efficient conversation history tracking

### Resource Management
- Token usage tracking and cost estimation
- Rate limiting per minute
- Daily cost limits
- Input/output token optimization

### Error Handling
- Graceful error recovery
- User-friendly error messages
- Logging for debugging
- Rate limit notifications
