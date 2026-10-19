"""
Document chunking with multiple strategies
Splits text into overlapping passages for retrieval
"""

import re
from typing import List


class DocumentChunker:
    """Split documents into chunks with configurable strategies"""
    
    def chunk(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
        strategy: str = "recursive"
    ) -> List[str]:
        """
        Chunk text using specified strategy
        
        Args:
            text: Input text to chunk
            chunk_size: Target size for each chunk (characters)
            overlap: Number of overlapping characters between chunks
            strategy: Chunking strategy (recursive, sentence, fixed)
            
        Returns:
            List of text chunks
        """
        if not text or not text.strip():
            return []
        
        if strategy == "recursive":
            return self._recursive_chunk(text, chunk_size, overlap)
        elif strategy == "sentence":
            return self._sentence_chunk(text, chunk_size, overlap)
        elif strategy == "fixed":
            return self._fixed_chunk(text, chunk_size, overlap)
        else:
            raise ValueError(f"Unknown chunking strategy: {strategy}")
    
    def _recursive_chunk(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        Recursive chunking that tries to split on natural boundaries
        Priority: paragraphs > sentences > words > characters
        """
        chunks = []
        
        # First split on double newlines (paragraphs)
        paragraphs = re.split(r'\n\s*\n', text)
        
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # If paragraph fits in remaining space, add it
            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += para + "\n\n"
            else:
                # Save current chunk if it exists
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    # Start new chunk with overlap
                    if overlap > 0 and len(current_chunk) > overlap:
                        current_chunk = current_chunk[-overlap:]
                    else:
                        current_chunk = ""
                
                # If paragraph is too large, split by sentences
                if len(para) > chunk_size:
                    sentences = re.split(r'(?<=[.!?])\s+', para)
                    for sent in sentences:
                        if len(current_chunk) + len(sent) <= chunk_size:
                            current_chunk += sent + " "
                        else:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                                if overlap > 0:
                                    current_chunk = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                                else:
                                    current_chunk = ""
                            
                            # If single sentence is too large, split by words
                            if len(sent) > chunk_size:
                                words = sent.split()
                                for word in words:
                                    if len(current_chunk) + len(word) <= chunk_size:
                                        current_chunk += word + " "
                                    else:
                                        if current_chunk:
                                            chunks.append(current_chunk.strip())
                                            current_chunk = current_chunk[-overlap:] if overlap > 0 and len(current_chunk) > overlap else ""
                                        current_chunk += word + " "
                            else:
                                current_chunk += sent + " "
                else:
                    current_chunk = para + "\n\n"
        
        # Add remaining chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _sentence_chunk(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        Chunk by sentences, combining until chunk_size is reached
        """
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = ""
        
        for sent in sentences:
            if len(current_chunk) + len(sent) <= chunk_size:
                current_chunk += sent + " "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    # Add overlap
                    if overlap > 0:
                        words = current_chunk.split()
                        overlap_text = " ".join(words[-overlap:]) if len(words) > overlap else current_chunk
                        current_chunk = overlap_text + " " + sent + " "
                    else:
                        current_chunk = sent + " "
                else:
                    current_chunk = sent + " "
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _fixed_chunk(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        Simple fixed-size chunking with character overlap
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            
            if chunk.strip():
                chunks.append(chunk.strip())
            
            start = end - overlap if overlap > 0 else end
        
        return chunks
    
    def get_chunk_stats(self, chunks: List[str]) -> dict:
        """Get statistics about chunks"""
        if not chunks:
            return {
                "count": 0,
                "avg_length": 0,
                "min_length": 0,
                "max_length": 0,
            }
        
        lengths = [len(c) for c in chunks]
        
        return {
            "count": len(chunks),
            "avg_length": sum(lengths) // len(lengths),
            "min_length": min(lengths),
            "max_length": max(lengths),
            "total_chars": sum(lengths),
        }
