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

@router.get("/files")
async def list_files():
    """List all uploaded PDF files with their metadata."""
    try:
        files = []
        for file_path in UPLOAD_DIR.glob("*.pdf"):
            # Get file stats
            stats = file_path.stat()
            files.append({
                "filename": file_path.name,
                "size": stats.st_size,
                "created_at": stats.st_ctime,
                "last_modified": stats.st_mtime
            })
        return {"files": sorted(files, key=lambda x: x["last_modified"], reverse=True)}
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list files: {str(e)}"
        )

@router.delete("/files/{filename}")
async def delete_file(filename: str):
    """Delete a PDF file and its associated vector store data."""
    try:
        file_path = UPLOAD_DIR / filename
        
        # Check if file exists
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"File {filename} not found"
            )
            
        # Delete the file
        try:
            file_path.unlink()
            logger.info(f"File deleted: {filename}")
        except Exception as e:
            logger.error(f"Failed to delete file {filename}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete file: {str(e)}"
            )
            
        # Delete from vector store
        try:
            await vector_store.delete_collection(filename)
            logger.info(f"Vector store collection deleted: {filename}")
        except Exception as e:
            logger.warning(f"Failed to delete vector store collection for {filename}: {str(e)}")
            # Don't raise exception here as the file is already deleted
            
        return {
            "status": "success",
            "message": f"File {filename} deleted successfully"
        }
        
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting {filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        ) 