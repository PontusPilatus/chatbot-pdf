from pathlib import Path
from typing import List
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import re

class PDFProcessor:
    def __init__(self, upload_dir: Path = Path("uploads")):
        self.upload_dir = upload_dir
        # Adjust chunk size and overlap for better context preservation
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,  # Smaller chunks for more precise context
            chunk_overlap=100,  # Decent overlap to maintain context between chunks
            length_function=len,
            # Include Swedish-specific punctuation and separators
            separators=["\n\n", "\n", ".", "!", "?", ",", ";", ":", " ", ""]
        )

    def clean_text(self, text: str) -> str:
        """Clean and normalize text while preserving Swedish characters."""
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        
        # Preserve Swedish characters (å, ä, ö) and their uppercase variants
        # Remove any non-printable characters except Swedish letters
        text = ''.join(char for char in text if char.isprintable() or char in 'åäöÅÄÖ')
        
        # Fix common OCR errors with Swedish characters
        replacements = {
            'aa': 'å',
            'ae': 'ä',
            'oe': 'ö',
            'Aa': 'Å',
            'Ae': 'Ä',
            'Oe': 'Ö'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        # Normalize whitespace around punctuation
        text = re.sub(r'\s*([.!?])\s*', r'\1 ', text)
        text = re.sub(r'\s*([,:])\s*', r'\1 ', text)
        
        return text.strip()
        
    async def process_pdf(self, filename: str) -> List[str]:
        """Process a PDF file and return chunks of text."""
        file_path = self.upload_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"PDF file not found: {filename}")
            
        # Load and parse PDF
        pdf = PdfReader(str(file_path))
        text = ""
        
        # Extract text from all pages with better formatting
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            # Clean and normalize the text
            page_text = self.clean_text(page_text)
            # Add page number reference
            text += f"[Page {i+1}] {page_text}\n\n"
        
        # Split text into chunks
        chunks = self.text_splitter.split_text(text)
        
        # Filter out very short or empty chunks
        chunks = [chunk for chunk in chunks if len(chunk.strip()) > 50]
        
        return chunks
    
    async def get_text_chunks(self, filename: str) -> List[str]:
        """Get text chunks for a processed PDF."""
        return await self.process_pdf(filename)
    
    def cleanup_pdf(self, filename: str) -> None:
        """Remove a PDF file from the upload directory."""
        file_path = self.upload_dir / filename
        if file_path.exists():
            file_path.unlink()

# Initialize the PDF processor
pdf_processor = PDFProcessor() 