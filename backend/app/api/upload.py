from fastapi import APIRouter, UploadFile, HTTPException
from pathlib import Path
from services.pdf_processor import pdf_processor
from services.vector_store import vector_store
from services.logger import log_info, log_error, log_warning
from services.error_handler import (
    PDFError, PDFProcessingError, PDFNotFoundError, 
    PDFSizeError, PDFFormatError, handle_pdf_error,
    is_valid_pdf, check_file_size
)

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_pdf(file: UploadFile):
    """Handle PDF file upload and processing."""
    try:
        log_info("upload_started", {"filename": file.filename})

        # Validate file extension
        if not file.filename.endswith('.pdf'):
            log_warning("invalid_file_type", {"filename": file.filename})
            raise PDFFormatError(
                "Only PDF files are allowed",
                {"filename": file.filename, "content_type": file.content_type}
            )

        # Read file content
        content = await file.read()
        
        # Validate file size
        if not check_file_size(len(content)):
            log_warning("file_too_large", {
                "filename": file.filename,
                "size": len(content)
            })
            raise PDFSizeError(
                "File size exceeds 10MB limit",
                {"filename": file.filename, "size": len(content)}
            )

        # Validate PDF format
        if not is_valid_pdf(content):
            log_warning("invalid_pdf_format", {"filename": file.filename})
            raise PDFFormatError(
                "Invalid PDF file format",
                {"filename": file.filename}
            )

        file_path = UPLOAD_DIR / file.filename
        
        # Save the file
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            log_info("file_saved", {"path": str(file_path)})
        except Exception as e:
            raise PDFProcessingError(
                "Failed to save PDF file",
                {"filename": file.filename, "error": str(e)}
            )

        try:
            # Process the PDF and get text chunks
            result = await pdf_processor.process_pdf(file.filename)
            chunks = result["chunks"]
            metadata = result["metadata"]
            summary = result["summary"]
            
            log_info("pdf_processed", {
                "filename": file.filename,
                "chunks": len(chunks),
                "metadata": metadata
            })

            # Store chunks in vector store
            await vector_store.add_texts(
                collection_name=file.filename,
                texts=chunks,
                metadata=[{"page": i} for i in range(len(chunks))]
            )
            log_info("chunks_stored", {
                "filename": file.filename,
                "collection": file.filename
            })

            return {
                "filename": file.filename,
                "status": "success",
                "message": "File uploaded and processed successfully",
                "chunks": len(chunks),
                "metadata": metadata,
                "summary": summary
            }

        except Exception as e:
            # Clean up the file if processing fails
            if file_path.exists():
                file_path.unlink()
            raise PDFProcessingError(
                "Failed to process PDF file",
                {"filename": file.filename, "error": str(e)}
            )

    except PDFError as e:
        raise handle_pdf_error(e)
    except Exception as e:
        log_error(e, {"filename": file.filename})
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        ) 