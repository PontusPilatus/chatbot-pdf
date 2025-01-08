from pathlib import Path
from typing import Dict, List, Tuple, Any
import os
import re
from datetime import datetime
from pypdf import PdfReader
from app.services.vector_store import vector_store
import logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
import traceback

# Set up basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self, upload_dir: Path = Path("app/uploads")):
        self.upload_dir = upload_dir
        self.upload_dir.mkdir(exist_ok=True)
        # Adjust chunk size and overlap for better context
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # Larger chunks for more context
            chunk_overlap=200,  # More overlap to avoid breaking context
            length_function=len,
            separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ": ", ", ", " ", ""]
        )

    def extract_metadata(self, pdf: PdfReader) -> Dict[str, Any]:
        """Extract metadata from PDF."""
        try:
            metadata = {
                "title": "Unknown",
                "author": "Unknown",
                "creation_date": "Unknown",
                "pages": len(pdf.pages)
            }
            
            if pdf.metadata:
                if "/Title" in pdf.metadata and pdf.metadata["/Title"]:
                    metadata["title"] = pdf.metadata["/Title"]
                if "/Author" in pdf.metadata and pdf.metadata["/Author"]:
                    metadata["author"] = pdf.metadata["/Author"]
                if "/CreationDate" in pdf.metadata and pdf.metadata["/CreationDate"]:
                    metadata["creation_date"] = pdf.metadata["/CreationDate"]
            
            return metadata
        except Exception as e:
            logger.error(f"Error extracting metadata: {str(e)}")
            # Return basic metadata on error
            return {
                "title": "Unknown",
                "author": "Unknown",
                "creation_date": "Unknown",
                "pages": 0
            }

    async def process_pdf(self, filename: str) -> Dict[str, Any]:
        """Process a PDF file and return its chunks and metadata."""
        try:
            file_path = self.upload_dir / filename
            if not file_path.exists():
                logger.error(f"PDF file not found: {filename}")
                raise FileNotFoundError(f"PDF file not found: {filename}")

            # Read PDF
            try:
                pdf = PdfReader(str(file_path))
                logger.info(f"PDF opened: {filename}")
            except Exception as e:
                logger.error(f"Failed to read PDF {filename}: {str(e)}")
                raise ValueError(f"Failed to read PDF: {str(e)}")
            
            # Extract metadata
            metadata = self.extract_metadata(pdf)
            logger.info(f"Metadata extracted for {filename}")
            
            # Extract text from all pages
            text = ""
            try:
                for i, page in enumerate(pdf.pages):
                    text += page.extract_text() + "\n\n"
                    logger.info(f"Processed page {i+1} of {filename}")
            except Exception as e:
                logger.error(f"Failed to extract text from {filename}: {str(e)}")
                raise ValueError(f"Failed to extract text: {str(e)}")
            
            # Clean text
            text = self.clean_text(text)
            
            # Split into chunks
            chunks = self.text_splitter.split_text(text)
            logger.info(f"Split {filename} into {len(chunks)} chunks")
            
            return {
                "chunks": chunks,
                "metadata": metadata,
                "summary": f"Document Title: {metadata['title']}\nAuthor: {metadata['author']}\nPages: {metadata['pages']}\nWord count: {len(text.split())}\nCharacter count: {len(text)}"
            }

        except Exception as e:
            logger.error(f"Error processing PDF {filename}: {str(e)}")
            raise

    def clean_text(self, text: str) -> str:
        """Clean extracted text."""
        try:
            # Remove multiple newlines
            text = re.sub(r'\n{3,}', '\n\n', text)
            # Remove multiple spaces
            text = re.sub(r' +', ' ', text)
            # Remove weird characters
            text = re.sub(r'[^\x00-\x7F]+', '', text)
            return text.strip()
        except Exception as e:
            logger.error(f"Error cleaning text: {str(e)}")
            # Return original text if cleaning fails
            return text.strip()

    async def get_text_chunks(self, filename: str) -> List[str]:
        """Get text chunks for a processed PDF."""
        result = await self.process_pdf(filename)
        return result["chunks"]
    
    def cleanup_pdf(self, filename: str) -> None:
        """Remove a PDF file from the upload directory."""
        file_path = self.upload_dir / filename
        if file_path.exists():
            file_path.unlink()

# Create a singleton instance
pdf_processor = PDFProcessor() 