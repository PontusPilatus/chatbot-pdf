from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import re
from datetime import datetime
from .summarizer import summarizer

class PDFProcessor:
    def __init__(self, upload_dir: Path = Path("uploads")):
        self.upload_dir = upload_dir
        # Adjust chunk size and overlap for better context
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # Larger chunks for more context
            chunk_overlap=200,  # More overlap to avoid breaking context
            length_function=len,
            # Add more separators to better handle document structure
            separators=[
                "\n\n",  # Paragraphs
                "\n",    # Lines
                ". ",    # Sentences
                "! ",    # Exclamations
                "? ",    # Questions
                "; ",    # Semi-colons
                ": ",    # Colons
                ", ",    # Commas
                " ",     # Words
                ""       # Characters
            ]
        )

    def extract_metadata(self, pdf: PdfReader) -> Dict[str, Any]:
        """Extract metadata from PDF."""
        raw_metadata = pdf.metadata
        print(f"Raw metadata: {raw_metadata}")  # Debug print
        
        # Initialize with basic info
        metadata = {
            "title": "Unknown",
            "author": "Unknown",
            "creation_date": "Unknown",
            "pages": len(pdf.pages)
        }

        if raw_metadata:
            # Clean and format metadata
            if "/Title" in raw_metadata and raw_metadata["/Title"]:
                metadata["title"] = str(raw_metadata["/Title"]).strip()
            if "/Author" in raw_metadata and raw_metadata["/Author"]:
                metadata["author"] = str(raw_metadata["/Author"]).strip()
            if "/Subject" in raw_metadata and raw_metadata["/Subject"]:
                metadata["subject"] = str(raw_metadata["/Subject"]).strip()
            if "/Keywords" in raw_metadata and raw_metadata["/Keywords"]:
                metadata["keywords"] = str(raw_metadata["/Keywords"]).strip()
            if "/Creator" in raw_metadata and raw_metadata["/Creator"]:
                metadata["creator"] = str(raw_metadata["/Creator"]).strip()
            if "/Producer" in raw_metadata and raw_metadata["/Producer"]:
                metadata["producer"] = str(raw_metadata["/Producer"]).strip()

            # Parse creation date if available
            if "/CreationDate" in raw_metadata and raw_metadata["/CreationDate"]:
                creation_date = str(raw_metadata["/CreationDate"])
                print(f"Creation date from PDF: {creation_date}")  # Debug print
                
                if creation_date.startswith("D:"):
                    try:
                        # Format: D:YYYYMMDDHHmmSS
                        date_str = creation_date[2:14]  # Extract YYYYMMDDHHMM
                        metadata["creation_date"] = datetime.strptime(
                            date_str, "%Y%m%d%H%M"
                        ).isoformat()
                    except ValueError as e:
                        print(f"Date parsing error: {e}")  # Debug print
                        metadata["creation_date"] = creation_date

        # Try to extract title from first page if not found in metadata
        if metadata["title"] == "Unknown":
            try:
                first_page_text = pdf.pages[0].extract_text()
                # Look for potential title in first few lines
                lines = [line.strip() for line in first_page_text.split('\n') if line.strip()]
                if lines:
                    # Use first non-empty line as title if it's reasonable length
                    potential_title = lines[0]
                    if 10 <= len(potential_title) <= 100:
                        metadata["title"] = potential_title
            except Exception as e:
                print(f"Error extracting title from first page: {e}")

        print(f"Final metadata: {metadata}")  # Debug print
        return metadata

    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # First, normalize all whitespace to single spaces
        text = ' '.join(text.split())
        
        # Remove any non-printable characters
        text = ''.join(char for char in text if char.isprintable())
        
        # Fix common OCR issues and improve readability
        text = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', text)  # Add space between camelCase
        text = re.sub(r'(?<=[.!?])\s*(?=[A-Z])', '\n', text)  # Add newline after sentences
        text = re.sub(r'\s*\n\s*', '\n', text)  # Clean up newlines
        text = re.sub(r'\n{3,}', '\n\n', text)  # Limit consecutive newlines
        text = re.sub(r'\s+', ' ', text)  # Normalize spaces
        
        # Ensure proper spacing around punctuation
        text = re.sub(r'\s*([.!?,:;])\s*', r'\1 ', text)
        
        # Remove any remaining whitespace artifacts
        text = re.sub(r'^\s+|\s+$', '', text, flags=re.MULTILINE)
        
        return text.strip()
        
    async def process_pdf(self, filename: str) -> Dict[str, Any]:
        """Process a PDF file and return chunks, metadata, and summary."""
        file_path = self.upload_dir / filename
        
        print(f"Processing PDF: {filename}")  # Debug log
        
        if not file_path.exists():
            print(f"File not found: {file_path}")  # Debug log
            raise FileNotFoundError(f"PDF file not found: {filename}")
            
        # Load and parse PDF
        pdf = PdfReader(str(file_path))
        text = ""
        
        print(f"PDF loaded, pages: {len(pdf.pages)}")  # Debug log
        
        # Extract metadata first
        metadata = self.extract_metadata(pdf)
        print(f"Extracted metadata: {metadata}")  # Debug log
        
        # Add metadata to text for better context
        text += f"Document Title: {metadata['title']}\n"
        if metadata['author'] != "Unknown":
            text += f"Author: {metadata['author']}\n"
        if metadata['creation_date'] != "Unknown":
            text += f"Created: {metadata['creation_date']}\n"
        text += f"Number of Pages: {metadata['pages']}\n\n"
        
        # Extract text from all pages with better structure preservation
        for i, page in enumerate(pdf.pages):
            print(f"Processing page {i+1}")  # Debug log
            page_text = page.extract_text()
            if page_text:
                cleaned_text = self.clean_text(page_text)
                if cleaned_text:
                    # Add clear page markers and preserve structure
                    text += f"\n\n=== Page {i+1} ===\n\n{cleaned_text}\n\n"
        
        if not text.strip():
            print("No text content extracted")  # Debug log
            raise ValueError("No text content extracted from PDF")
            
        print(f"Total extracted text length: {len(text)}")  # Debug log
        
        # Generate summary
        summary = summarizer.create_summary(text, metadata)
        print(f"Generated summary length: {len(summary)}")  # Debug log
        
        # Split text into chunks with overlap
        chunks = self.text_splitter.split_text(text)
        print(f"Number of chunks: {len(chunks)}")  # Debug log
        
        # Filter and clean chunks
        valid_chunks = []
        for chunk in chunks:
            chunk = chunk.strip()
            if len(chunk) > 100:  # Increased minimum length for more meaningful chunks
                # Extract page number from chunk
                page_match = re.search(r'=== Page (\d+) ===', chunk)
                if page_match:
                    page_num = page_match.group(1)
                    # Clean up the chunk but preserve page reference
                    cleaned_chunk = re.sub(r'=== Page \d+ ===\s*', '', chunk).strip()
                    if cleaned_chunk:
                        valid_chunks.append(f"[Page {page_num}] {cleaned_chunk}")
                else:
                    valid_chunks.append(chunk)
        
        print(f"Number of valid chunks: {len(valid_chunks)}")  # Debug log
        
        return {
            "chunks": valid_chunks,
            "metadata": metadata,
            "summary": summary
        }
    
    async def get_text_chunks(self, filename: str) -> List[str]:
        """Get text chunks for a processed PDF."""
        result = await self.process_pdf(filename)
        return result["chunks"]
    
    def cleanup_pdf(self, filename: str) -> None:
        """Remove a PDF file from the upload directory."""
        file_path = self.upload_dir / filename
        if file_path.exists():
            file_path.unlink()

# Initialize the PDF processor
pdf_processor = PDFProcessor() 