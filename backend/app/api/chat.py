from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.chat_service import chat_service

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    filename: str | None = None

class ChatResponse(BaseModel):
    answer: str
    sources: str | None = None

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = await chat_service.chat(request.message, request.filename)
        return ChatResponse(**response)
    except Exception as e:
        print(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 