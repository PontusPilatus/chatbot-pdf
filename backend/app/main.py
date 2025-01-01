from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.upload import router as upload_router
from api.chat import router as chat_router

app = FastAPI(title="PDF Chatbot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(chat_router, prefix="/api", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "PDF Chatbot API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
