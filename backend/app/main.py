# Set up environment before any other imports
from app.services.env_setup import setup_environment
setup_environment()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# OpenAI API configuration
OPENAI_CONFIG = {
    "max_daily_cost": float(os.getenv("MAX_DAILY_COST", "1.0")),  # Default $1/day
    "max_monthly_cost": float(os.getenv("MAX_MONTHLY_COST", "20.0")),  # Default $20/month
    "max_tokens_per_request": int(os.getenv("MAX_TOKENS_PER_REQUEST", "2000")),
    "rate_limit_per_min": int(os.getenv("RATE_LIMIT_PER_MIN", "10")),
}

# Verify OpenAI API key is present
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

from app.api.upload import router as upload_router
from app.api.chat import router as chat_router

app = FastAPI(title="PDF Chatbot API")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(chat_router, prefix="/api", tags=["chat"])

# Set up static file serving for uploads
UPLOAD_DIR = Path("app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "PDF Chatbot API is running",
        "config": {
            "max_daily_cost": OPENAI_CONFIG["max_daily_cost"],
            "max_monthly_cost": OPENAI_CONFIG["max_monthly_cost"],
            "rate_limit_per_min": OPENAI_CONFIG["rate_limit_per_min"]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
