from fastapi import HTTPException
from typing import Type, Dict, Any
from .logger import log_error

class PDFError(Exception):
    """Base class for PDF-related errors."""
    def __init__(self, message: str, details: Dict[str, Any] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

class PDFProcessingError(PDFError):
    """Raised when there's an error processing a PDF file."""
    pass

class PDFNotFoundError(PDFError):
    """Raised when a PDF file is not found."""
    pass

class PDFSizeError(PDFError):
    """Raised when a PDF file exceeds size limits."""
    pass

class PDFFormatError(PDFError):
    """Raised when a file is not a valid PDF."""
    pass

class PDFSecurityError(PDFError):
    """Raised when there are security concerns with a PDF."""
    pass

# Error mapping to HTTP status codes
ERROR_STATUS_CODES = {
    PDFProcessingError: 500,
    PDFNotFoundError: 404,
    PDFSizeError: 413,
    PDFFormatError: 400,
    PDFSecurityError: 403,
}

def handle_pdf_error(error: PDFError) -> HTTPException:
    """Convert PDF errors to HTTPException with appropriate status codes."""
    error_type = type(error)
    status_code = ERROR_STATUS_CODES.get(error_type, 500)
    
    # Log the error with context
    log_error(error, {
        "error_type": error_type.__name__,
        "status_code": status_code,
        **error.details
    })
    
    return HTTPException(
        status_code=status_code,
        detail={
            "message": error.message,
            "error_type": error_type.__name__,
            "details": error.details
        }
    )

def is_valid_pdf(file_content: bytes) -> bool:
    """Check if file content is a valid PDF."""
    # PDF files start with %PDF-
    return file_content.startswith(b'%PDF-')

def check_file_size(size: int, max_size: int = 10 * 1024 * 1024) -> bool:
    """Check if file size is within limits."""
    return size <= max_size 