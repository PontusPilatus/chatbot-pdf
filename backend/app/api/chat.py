from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    filename: str

class ChatResponse(BaseModel):
    answer: str

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # TODO: Implement actual PDF processing and LLM integration
        # For now, return a mock response
        return ChatResponse(
            answer=f"This is a mock response to your question about {request.filename}: {request.message}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 