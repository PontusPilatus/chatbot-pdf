# EVA

EVA (Efficient Virtual Assistant) is an AI-powered companion that can answer questions about PDF documents. Built with Next.js, TypeScript, Python, and FastAPI.

## Current Features

- 📄 PDF Processing
  - Automatic text extraction and preprocessing
  - Smart text chunking for large documents
  - Vector embeddings for semantic search
  - ChromaDB for efficient document storage
  - Multi-language support with automatic language detection
  - OCR (Optical Character Recognition) support for:
    - Scanned documents
    - Image-based PDFs
    - PDFs with embedded images
  - Support for 26+ languages including:
    - English (eng)
    - Swedish (swe)
    - German (deu)
    - French (fra)
    - Spanish (spa)
    - Italian (ita)
    - Portuguese (por)
    - Dutch (nld)
    - Polish (pol)
    - Russian (rus)
    - Ukrainian (ukr)
    - Arabic (ara)
    - Hindi (hin)
    - Japanese (jpn)
    - Korean (kor)
    - Chinese Simplified (chi_sim)
    - And more...

- 💬 Chat Interface
  - Interactive real-time chat with streaming responses
  - Context-aware responses based on PDF content
  - Smart context window management
  - Custom bot and user avatars
  - Timestamp toggles
  - Dark mode support

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

- 📝 Document Interaction
  - PDF preview with zoom and navigation
  - File management system
  - Split-view layout
  - File selection indicators

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

2. Install Required Dependencies:
   - Install Tesseract OCR:
     - Windows: Download and install from https://github.com/UB-Mannheim/tesseract/wiki
     - Linux: `sudo apt-get install tesseract-ocr`
     - Mac: `brew install tesseract`
   
   - Install Poppler:
     - Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases/
     - Linux: `sudo apt-get install poppler-utils`
     - Mac: `brew install poppler`

3. Install Language Data (Optional):
   - Download additional language data files from https://github.com/tesseract-ocr/tessdata/
   - Place the `.traineddata` files in Tesseract's tessdata directory:
     - Windows: `C:\Program Files\Tesseract-OCR\tessdata\`
     - Linux/Mac: `/usr/share/tesseract-ocr/tessdata/`

4. Create and activate a virtual environment:
   - Windows:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - Unix/MacOS:
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```

5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

6. Run the FastAPI server:
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

## Future Enhancements

- Advanced PDF Features
  - Real-time text highlighting
  - Response-to-document linking
  - Page thumbnails and quick navigation
  - Highlight overlay system
  - Highlight coordinates storage
  - Metadata management for highlights
  - Highlight color coding
  - Quick jump to referenced sections
  - Table and figure detection
  - Document summarization
  - Citation extraction
  - Cross-document analysis

- Advanced Chat Features
  - Document comparison
  - Cross-referencing
  - Domain-specific model support
  - Multi-document conversations

- Document Management
  - Annotation system
  - Bookmarking functionality
  - Advanced search features
  - PDF editing capabilities
  - Document version control
  - Batch processing
  - Multi-document processing optimization

- UI/UX Enhancements
  - Interactive visualization tools
  - Annotation interface
  - Bookmark management UI
  - Enhanced non-Latin script handling
  - Interactive visualizations
  - Document merging and splitting

- Multi-language Support
  - Language-specific text processing
  - Translation capabilities
  - Enhanced character set support
