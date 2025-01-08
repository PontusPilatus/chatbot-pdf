from fastapi import APIRouter, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
from app.services.pdf_processor import pdf_processor
from app.services.vector_store import vector_store
import logging
import os
import traceback

# Set up basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_pdf(file: UploadFile):
    """Handle PDF file upload and processing."""
    try:
        logger.info(f"Upload started for file: {file.filename}")

        # Validate file extension
        if not file.filename.endswith('.pdf'):
            logger.warning(f"Invalid file type: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed"
            )

        # Read file content
        content = await file.read()
        
        # Validate file size (10MB limit)
        if len(content) > 10 * 1024 * 1024:
            logger.warning(f"File too large: {file.filename} ({len(content)} bytes)")
            raise HTTPException(
                status_code=400,
                detail="File size exceeds 10MB limit"
            )

        file_path = UPLOAD_DIR / file.filename
        
        # Save the file
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            logger.info(f"File saved: {file_path}")
        except Exception as e:
            logger.error(f"Failed to save file {file.filename}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )

        try:
            # Process the PDF and get text chunks
            result = await pdf_processor.process_pdf(file.filename)
            chunks = result["chunks"]
            metadata = result["metadata"]
            summary = result.get("summary", "")
            
            logger.info(f"PDF processed: {file.filename} ({len(chunks)} chunks)")

            # Store chunks in vector store
            try:
                await vector_store.add_texts(
                    collection_name=file.filename,
                    texts=chunks,
                    metadata=[{"page": i} for i in range(len(chunks))]
                )
                logger.info(f"Chunks stored for {file.filename}")
            except Exception as e:
                logger.error(f"Failed to store chunks for {file.filename}: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to store text chunks: {str(e)}"
                )

            return {
                "filename": file.filename,
                "status": "success",
                "message": "File uploaded and processed successfully",
                "chunks": len(chunks),
                "metadata": metadata,
                "summary": summary
            }

        except Exception as e:
            logger.error(f"Failed to process PDF {file.filename}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process PDF: {str(e)}"
            )
            
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error processing {file.filename if file else 'unknown'}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        ) 