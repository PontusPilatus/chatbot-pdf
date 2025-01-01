# PDF Chatbot

An AI-powered chatbot that can answer questions about PDF documents. Built with Next.js, TypeScript, Python, and FastAPI.

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

You'll need to set up the following environment variables:

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key
```

## Features

- PDF file upload and processing
- Interactive chat interface
- Context-aware responses based on PDF content
- Real-time communication between frontend and backend
