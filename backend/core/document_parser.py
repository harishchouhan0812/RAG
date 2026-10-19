"""
Document parser for PDF, DOCX, TXT, and Markdown files
Handles real text extraction with validation
"""

import io
import uuid
from typing import Dict, Any
import fitz  # PyMuPDF
from docx import Document


class DocumentParser:
    """Parse various document formats and extract text"""
    
    def __init__(self):
        self.supported_types = ["pdf", "docx", "txt", "md", "markdown"]
    
    def parse(self, content: bytes, filename: str) -> Dict[str, Any]:
        """
        Parse document content and extract text
        
        Args:
            content: Raw file bytes
            filename: Original filename
            
        Returns:
            Dictionary with parsed document data
        """
        file_ext = filename.split(".")[-1].lower()
        
        if file_ext not in self.supported_types:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Generate unique document ID
        doc_id = f"doc_{uuid.uuid4().hex[:8]}"
        
        # Parse based on file type
        if file_ext == "pdf":
            text, metadata = self._parse_pdf(content)
        elif file_ext == "docx":
            text, metadata = self._parse_docx(content)
        elif file_ext in ["txt", "md", "markdown"]:
            text, metadata = self._parse_text(content)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Validate extraction
        if not text or len(text.strip()) < 10:
            raise ValueError("Failed to extract meaningful text from document")
        
        return {
            "id": doc_id,
            "filename": filename,
            "file_type": file_ext,
            "text": text,
            "metadata": metadata,
        }
    
    def _parse_pdf(self, content: bytes) -> tuple[str, Dict[str, Any]]:
        """Parse PDF document"""
        try:
            pdf_stream = io.BytesIO(content)
            doc = fitz.open(stream=pdf_stream, filetype="pdf")
            
            # Extract text from all pages
            text_parts = []
            for page_num, page in enumerate(doc):
                page_text = page.get_text()
                if page_text.strip():
                    text_parts.append(page_text)
            
            full_text = "\n\n".join(text_parts)
            
            metadata = {
                "pages": len(doc),
                "page_count": len(doc),
                "extracted_pages": len(text_parts),
            }
            
            doc.close()
            
            # Check if extraction was successful
            if not full_text.strip():
                raise ValueError(
                    "No text extracted from PDF. "
                    "This may be a scanned document requiring OCR."
                )
            
            return full_text, metadata
            
        except Exception as e:
            raise ValueError(f"PDF parsing failed: {str(e)}")
    
    def _parse_docx(self, content: bytes) -> tuple[str, Dict[str, Any]]:
        """Parse DOCX document"""
        try:
            docx_stream = io.BytesIO(content)
            doc = Document(docx_stream)
            
            # Extract text from paragraphs
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            full_text = "\n\n".join(paragraphs)
            
            metadata = {
                "paragraphs": len(doc.paragraphs),
                "extracted_paragraphs": len(paragraphs),
            }
            
            if not full_text.strip():
                raise ValueError("No text found in DOCX document")
            
            return full_text, metadata
            
        except Exception as e:
            raise ValueError(f"DOCX parsing failed: {str(e)}")
    
    def _parse_text(self, content: bytes) -> tuple[str, Dict[str, Any]]:
        """Parse plain text or markdown"""
        try:
            # Try UTF-8 first, fall back to latin-1
            try:
                text = content.decode("utf-8")
            except UnicodeDecodeError:
                text = content.decode("latin-1")
            
            metadata = {
                "encoding": "utf-8",
                "lines": len(text.split("\n")),
            }
            
            if not text.strip():
                raise ValueError("Empty text file")
            
            return text, metadata
            
        except Exception as e:
            raise ValueError(f"Text parsing failed: {str(e)}")
