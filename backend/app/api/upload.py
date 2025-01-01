from fastapi import APIRouter, UploadFile, HTTPException
from pydantic import BaseModel
from pathlib import Path
import logging
from services.pdf_processor import pdf_processor
from services.vector_store import vector_store

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_pdf(file: UploadFile):
    logger.info(f"Received upload request for file: {file.filename}")
    
    if not file.filename.endswith('.pdf'):
        logger.warning(f"Invalid file type attempted: {file.filename}")
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_path = UPLOAD_DIR / file.filename
    try:
        # Save the file
        logger.info(f"Saving file to: {file_path}")
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Process the PDF and get text chunks
        logger.info("Processing PDF and extracting text chunks")
        chunks = await pdf_processor.get_text_chunks(file.filename)
        logger.info(f"Successfully extracted {len(chunks)} text chunks")
        
        # Store chunks in vector store
        logger.info("Storing chunks in vector database")
        await vector_store.add_texts(
            collection_name=file.filename,
            texts=chunks,
            metadata=[{"page": i} for i in range(len(chunks))]
        )
        logger.info("Successfully stored chunks in vector database")
        
        return {
            "filename": file.filename,
            "status": "success",
            "message": "File uploaded and processed successfully",
            "chunks": len(chunks)
        }
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {str(e)}", exc_info=True)
        # Clean up the file if it was saved
        if file_path.exists():
            logger.info(f"Cleaning up file: {file_path}")
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}") 