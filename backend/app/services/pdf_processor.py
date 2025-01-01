from pathlib import Path
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader
from chromadb.config import Settings

class PDFProcessor:
    def __init__(self, upload_dir: Path = Path("uploads")):
        self.upload_dir = upload_dir
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
    async def process_pdf(self, filename: str) -> List[str]:
        """Process a PDF file and return chunks of text."""
        file_path = self.upload_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"PDF file not found: {filename}")
            
        # Load and parse PDF
        loader = PyPDFLoader(str(file_path))
        pages = loader.load()
        
        # Extract and join text from all pages
        text = " ".join(page.page_content for page in pages)
        
        # Split text into chunks
        chunks = self.text_splitter.split_text(text)
        
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