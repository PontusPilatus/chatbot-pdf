from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.chat_service import chat_service
import json

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    filename: str | None
    language: str | None = None
    shouldAllowGeneralChat: bool = False
    context: dict | None = None

async def generate_stream_response(message: str, filename: str | None, language: str | None = None, context: dict | None = None):
    try:
        async for chunk in chat_service.stream_chat(message, filename, language, context):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
    yield "data: [DONE]\n\n"

@router.post("/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        generate_stream_response(
            request.message,
            request.filename,
            request.language,
            request.context
        ),
        media_type="text/event-stream"
    ) 