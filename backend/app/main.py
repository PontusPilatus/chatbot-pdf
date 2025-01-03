# Set up environment before any other imports
from services.env_setup import setup_environment
setup_environment()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Verify OpenAI API key is present
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

from api.upload import router as upload_router
from api.chat import router as chat_router

app = FastAPI(title="PDF Chatbot API")

# Configure CORS with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(chat_router, prefix="/api", tags=["chat"])

@app.get("/")
async def root():
    return {"status": "ok", "message": "PDF Chatbot API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
