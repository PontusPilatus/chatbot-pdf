# PDF Pal

An AI-powered companion that can answer questions about PDF documents. Built with Next.js, TypeScript, Python, and FastAPI.

## Features

- 📄 PDF Processing
  - Automatic text extraction and preprocessing
  - Smart text chunking for large documents
  - Vector embeddings for semantic search
  - ChromaDB for efficient document storage
  - Multi-language support with automatic language detection
  - Intelligent response in user's preferred language

- 💬 Chat Interface
  - Interactive real-time chat with streaming responses
  - Context-aware responses based on PDF content
  - Smart context window management
  - Conversation history tracking
  - Token usage optimization
  - Cross-document analysis capabilities

- 📊 Resource Management
  - Rate limiting and usage controls
  - Token counting and cost estimation
  - Daily cost limits
  - Efficient context window utilization
  - Multi-document processing optimization

- 🔄 Real-time Updates
  - Progress bar for file uploads
  - Loading states and animations
  - Error handling and user feedback
  - Streaming chat responses
  - Real-time annotation updates

- 📝 Document Interaction
  - PDF annotations and highlights
  - Bookmarking system
  - Advanced search capabilities
  - Citation extraction
  - Table and figure detection

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

### Enhanced PDF Processing
- [x] Create PDF text extraction service
- [x] Implement text chunking for large documents
- [x] Set up vector database (ChromaDB) for document storage
- [x] Create embeddings generation service
- [x] Add document cleanup and preprocessing
- [x] Implement multi-language support
- [ ] Add table and figure detection
- [ ] Enhance document summarization
- [ ] Add citation extraction capabilities
- [ ] Implement cross-document analysis

### Current Focus: PDF Preview & Highlighting
We are currently implementing an interactive PDF preview system with the following features:
- Split-view layout (PDF + Chat)
- Real-time text highlighting
- Zoom and page navigation controls
- Response-to-document linking
- Page thumbnails and quick navigation

Implementation Plan:
1. Frontend Components
   - PDF viewer integration using react-pdf/PDF.js
   - Responsive split-view layout
   - Highlight overlay system
   - Navigation and zoom controls

2. Backend Enhancements
   - Page number tracking in vector store
   - Highlight coordinates storage
   - Metadata management for highlights
   - Efficient page serving

3. User Experience
   - Smooth scrolling and navigation
   - Synchronized chat-document view
   - Highlight color coding
   - Quick jump to referenced sections

### Advanced Chat Features
- [x] Create chat message interface/types
- [x] Implement chat history state management
- [x] Add chat message components
- [x] Create chat API endpoint in backend
- [x] Integrate with OpenAI/LLM API
- [x] Add streaming response support
- [x] Implement context window management
- [ ] Add document comparison features
- [ ] Implement cross-referencing
- [ ] Add domain-specific model support

### Document Interaction
- [x] Add file list/history view
- [x] Implement file deletion
- [x] Add file size limits and validation
- [x] Create file metadata storage
- [x] Add progress bar for uploads
- [x] Handle duplicate file names
- [ ] Implement annotation system
- [ ] Add bookmarking functionality
- [ ] Create advanced search features
- [ ] Add PDF editing capabilities

### UI/UX Improvements
- [x] Add loading states and animations
- [x] Implement error handling and user feedback
- [x] Add mobile responsiveness
- [x] Create dark mode support
- [x] Add font size controls
- [x] Implement session management
- [ ] Add interactive visualization tools
- [ ] Implement PDF preview
- [ ] Add annotation interface
- [ ] Create bookmark management UI

### Security & Performance
- [x] Add API rate limiting
- [x] Implement proper error handling
- [x] Add input sanitization
- [x] Optimize PDF processing for large files
- [x] Add caching layer for file list
- [x] Implement proper environment variable management
- [ ] Add multi-document processing optimization
- [ ] Implement annotation security
- [ ] Add document version control

### Planned Features
- Multi-language Support
  - Enhanced non-Latin script handling
  - Language-specific text processing
  - Translation capabilities
  
- Document Analysis
  - Advanced summarization
  - Table and figure extraction
  - Citation management
  - Cross-document analysis
  
- Interactive Features
  - PDF annotations and highlights
  - Bookmarking system
  - Advanced search capabilities
  - Interactive visualizations
  
- PDF Management
  - Basic editing capabilities
  - Document merging and splitting
  - Version control
  - Batch processing

Looking at the remaining features, the most impactful next steps would be:
1. PDF preview - helps users verify they're working with the right document
2. Multi-file support - enables more complex document interactions
3. Highlight relevant PDF sections - provides better context in responses

Which feature would you like to implement next?

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
