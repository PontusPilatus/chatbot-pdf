from fastapi import APIRouter, UploadFile, HTTPException
from pydantic import BaseModel
from pathlib import Path
from services.pdf_processor import pdf_processor
from services.vector_store import vector_store

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_pdf(file: UploadFile):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Save the file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process the PDF and get text chunks
        chunks = await pdf_processor.get_text_chunks(file.filename)
        
        # Store chunks in vector store
        await vector_store.add_texts(
            collection_name=file.filename,
            texts=chunks,
            metadata=[{"page": i} for i in range(len(chunks))]
        )
        
        return {
            "filename": file.filename,
            "status": "success",
            "message": "File uploaded and processed successfully",
            "chunks": len(chunks)
        }
    except Exception as e:
        # Clean up the file if it was saved
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=str(e)) 