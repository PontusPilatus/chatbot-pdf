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
from langdetect import detect, detect_langs
from langdetect.lang_detect_exception import LangDetectException
import unicodedata
from pdf2image import convert_from_path
import pytesseract
import tempfile
import sys

# Set up basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self, upload_dir: Path = Path("app/uploads")):
        self.upload_dir = upload_dir
        self.upload_dir.mkdir(exist_ok=True)
        # Adjust chunk size and overlap for better context
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,  # Smaller chunks for better retrieval
            chunk_overlap=100,  # Increased overlap percentage
            length_function=len,
            separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ": ", ", ", " ", ""]
        )
        
        # Configure paths for Windows
        if os.name == 'nt':  # Windows
            # Set Tesseract path
            if os.path.exists(r'C:\Program Files\Tesseract-OCR\tesseract.exe'):
                pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
                logger.info("Tesseract found at default location")
            else:
                logger.warning("Tesseract not found in default location")
            
            # Try multiple possible poppler locations
            poppler_paths = [
                r'C:\Program Files\poppler\Library\bin',  # User's actual installation
                r'C:\Program Files\poppler\bin',
                r'C:\Program Files\Tesseract-OCR\poppler\bin',
                r'C:\Program Files\poppler-23.11.0\Library\bin',
                r'C:\Program Files\poppler-23.11.0\bin'
            ]
            
            poppler_found = False
            for path in poppler_paths:
                if os.path.exists(path):
                    if path not in os.environ['PATH']:
                        os.environ['PATH'] += os.pathsep + path
                        logger.info(f"Added poppler to PATH: {path}")
                    poppler_found = True
                    break
            
            if not poppler_found:
                logger.warning("Poppler not found in any standard location. PDF to image conversion may fail.")
                logger.info("Please install poppler from: https://github.com/oschwartz10612/poppler-windows/releases/")

    def extract_text_with_ocr(self, pdf_path: str, language: str = 'eng') -> str:
        """Extract text using OCR if regular extraction fails."""
        try:
            logger.info(f"Attempting OCR extraction for {pdf_path} with language: {language}")
            
            # Map language codes to Tesseract language packs
            lang_map = {
                'sv': 'swe',  # Swedish
                'en': 'eng',  # English
                'de': 'deu',  # German
                'fr': 'fra',  # French
                'es': 'spa',  # Spanish
                'it': 'ita',  # Italian
                'pt': 'por',  # Portuguese
                'nl': 'nld',  # Dutch
                'pl': 'pol',  # Polish
                'ru': 'rus',  # Russian
                'uk': 'ukr',  # Ukrainian
                'ar': 'ara',  # Arabic
                'hi': 'hin',  # Hindi
                'ja': 'jpn',  # Japanese
                'ko': 'kor',  # Korean
                'zh': 'chi_sim',  # Simplified Chinese
                'da': 'dan',  # Danish
                'fi': 'fin',  # Finnish
                'no': 'nor',  # Norwegian
                'tr': 'tur',  # Turkish
                'cs': 'ces',  # Czech
                'hu': 'hun',  # Hungarian
                'el': 'ell',  # Greek
                'he': 'heb',  # Hebrew
                'th': 'tha',  # Thai
                'vi': 'vie',  # Vietnamese
            }
            
            # Get Tesseract language code
            tesseract_lang = lang_map.get(language, 'eng')
            logger.info(f"Using Tesseract language: {tesseract_lang}")
            
            # If multiple languages are detected, try to use them all
            if ',' in language:
                # Split multiple languages and map each one
                langs = [lang_map.get(lang.strip(), 'eng') for lang in language.split(',')]
                # Remove duplicates and join with plus sign (Tesseract format)
                tesseract_lang = '+'.join(sorted(set(langs)))
            
            with tempfile.TemporaryDirectory() as temp_dir:
                # Convert PDF to images
                try:
                    logger.info("Converting PDF to images using pdftocairo")
                    images = convert_from_path(
                        pdf_path,
                        output_folder=temp_dir,
                        fmt='png',
                        grayscale=True,
                        use_pdftocairo=True,
                        paths_only=True
                    )
                except Exception as e:
                    logger.error(f"PDF to image conversion with pdftocairo failed: {str(e)}")
                    logger.info("Trying without pdftocairo")
                    images = convert_from_path(
                        pdf_path,
                        output_folder=temp_dir,
                        fmt='png',
                        grayscale=True,
                        use_pdftocairo=False,
                        paths_only=True
                    )
                
                if not images:
                    logger.error("No images extracted from PDF")
                    return ""
                
                logger.info(f"Successfully converted PDF to {len(images)} images")
                
                # Process each image with OCR
                text = ""
                for i, image_path in enumerate(images):
                    logger.info(f"Processing page {i+1} with OCR using language: {tesseract_lang}")
                    try:
                        # Try with specified language
                        page_text = pytesseract.image_to_string(
                            image_path,
                            lang=tesseract_lang,
                            config='--psm 1'  # Automatic page segmentation
                        )
                        logger.info(f"OCR successful for page {i+1} with {tesseract_lang}")
                    except Exception as e:
                        logger.error(f"OCR failed with {tesseract_lang}: {str(e)}")
                        # Fallback to English
                        logger.info("Falling back to English OCR")
                        page_text = pytesseract.image_to_string(
                            image_path,
                            lang='eng',
                            config='--psm 1'
                        )
                    
                    if page_text.strip():
                        logger.info(f"Extracted {len(page_text.split())} words from page {i+1}")
                    else:
                        logger.warning(f"No text extracted from page {i+1}")
                    
                    text += page_text + "\n\n"
                
                final_text = text.strip()
                logger.info(f"Total extracted text length: {len(final_text)} characters")
                return final_text
                
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return ""

    def detect_language(self, text: str) -> str:
        """Detect the primary language of the text."""
        try:
            # Get language probabilities
            langs = detect_langs(text[:10000])  # Use first 10k chars for speed
            # Return most probable language
            return langs[0].lang
        except LangDetectException:
            # Default to English if detection fails
            return 'en'

    def extract_metadata(self, pdf: PdfReader, detected_language: str) -> Dict[str, Any]:
        """Extract metadata from PDF."""
        try:
            metadata = {
                "title": "Unknown",
                "author": "Unknown",
                "creation_date": "Unknown",
                "pages": len(pdf.pages),
                "language": detected_language
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
                "pages": 0,
                "language": detected_language
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
            
            # Extract text from all pages
            text = ""
            ocr_used = False
            try:
                # First try normal text extraction
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    logger.info(f"Page {i+1} raw text length: {len(page_text)} chars")
                    logger.info(f"Page {i+1} raw word count: {len([w for w in page_text.split() if w.strip()])}")
                    text += page_text + "\n\n"
                    logger.info(f"Processed page {i+1} of {filename}")
                
                # Log initial text extraction results
                initial_words = len([w for w in text.split() if w.strip()])
                logger.info(f"Initial text extraction: {initial_words} words, {len(text)} chars")
                logger.info(f"Sample of extracted text: {text[:200]}")
                
                # Try OCR if text seems insufficient or problematic
                if initial_words < 100 or len(text.strip()) < 200:
                    logger.info(f"Text seems insufficient ({initial_words} words), attempting OCR")
                    ocr_text = self.extract_text_with_ocr(str(file_path))
                    if ocr_text.strip():
                        ocr_words = len([w for w in ocr_text.split() if w.strip()])
                        logger.info(f"OCR extracted {ocr_words} words")
                        if ocr_words > initial_words:
                            text = ocr_text
                            ocr_used = True
                            logger.info("Using OCR text instead of direct extraction")
                        else:
                            logger.info("Keeping original text as it contains more words than OCR")
            except Exception as e:
                logger.error(f"Text extraction failed, attempting OCR: {str(e)}")
                text = self.extract_text_with_ocr(str(file_path))
                ocr_used = True
            
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
            
            # Clean text (preserving unicode characters)
            text = self.clean_text(text)
            
            # Count words and characters more carefully
            words = len([w for w in text.split() if len(w.strip()) > 0])
            chars = len(text)
            logger.info(f"Final count: {words} words, {chars} characters")
            logger.info(f"Average word length: {chars/words if words > 0 else 0:.2f} characters")
            
            # Detect language
            detected_language = self.detect_language(text)
            logger.info(f"Detected language: {detected_language}")
            
            # Extract metadata with language
            metadata = self.extract_metadata(pdf, detected_language)
            metadata['ocr_used'] = ocr_used
            metadata['word_count'] = words
            metadata['char_count'] = chars
            
            # Split into chunks
            chunks = self.text_splitter.split_text(text)
            logger.info(f"Split {filename} into {len(chunks)} chunks")
            
            # Add language metadata to each chunk
            chunk_metadata = [{
                "page": i // 2 + 1,  # Rough page estimation
                "language": detected_language,
                "filename": filename,
                "ocr_used": ocr_used
            } for i in range(len(chunks))]
            
            # Create summary
            summary = (
                f"Document Title: {metadata['title']}\n"
                f"Author: {metadata['author']}\n"
                f"Pages: {metadata['pages']}\n"
                f"Language: {metadata['language']}\n"
                f"OCR Used: {ocr_used}\n"
                f"Word count: {words}\n"
                f"Character count: {chars}"
            )
            
            return {
                "chunks": chunks,
                "metadata": metadata,
                "chunk_metadata": chunk_metadata,
                "summary": summary
            }

        except Exception as e:
            logger.error(f"Error processing PDF {filename}: {str(e)}")
            raise

    def clean_text(self, text: str) -> str:
        """Clean extracted text while preserving unicode characters."""
        try:
            # Log original text stats
            logger.info(f"Original text length: {len(text)} chars")
            logger.info(f"Original word count: {len([w for w in text.split() if w.strip()])}")
            logger.info(f"First 200 chars of original text: {text[:200]}")
            
            # Remove multiple newlines
            text = re.sub(r'\n{3,}', '\n\n', text)
            # Remove multiple spaces
            text = re.sub(r' +', ' ', text)
            # Remove control characters while preserving unicode
            text = ''.join(char for char in text if not unicodedata.category(char).startswith('C') or char == '\n')
            
            cleaned = text.strip()
            # Log cleaned text stats
            logger.info(f"Cleaned text length: {len(cleaned)} chars")
            logger.info(f"Cleaned word count: {len([w for w in cleaned.split() if w.strip()])}")
            logger.info(f"First 200 chars of cleaned text: {cleaned[:200]}")
            
            return cleaned
        except Exception as e:
            logger.error(f"Error cleaning text: {str(e)}")
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