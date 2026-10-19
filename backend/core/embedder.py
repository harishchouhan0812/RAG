"""
Embedding generation using Sentence Transformers
Converts text into dense vector representations
"""

import numpy as np
from typing import List, Union
from sentence_transformers import SentenceTransformer


class EmbeddingGenerator:
    """Generate embeddings for text using pre-trained models"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding model
        
        Args:
            model_name: Name of sentence-transformers model
                       Default: all-MiniLM-L6-v2 (384 dimensions, fast)
                       Options: all-mpnet-base-v2 (768 dimensions)
                               multi-qa-MiniLM-L6-cos-v1 (384 dimensions, QA optimized)
        """
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"Model loaded. Dimension: {self.dimension}")
    
    def embed(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text
            
        Returns:
            Numpy array of embedding vector
        """
        if not text or not text.strip():
            raise ValueError("Cannot embed empty text")
        
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding
    
    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts efficiently
        
        Args:
            texts: List of input texts
            batch_size: Batch size for encoding
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        # Filter out empty texts
        valid_texts = [t for t in texts if t and t.strip()]
        
        if not valid_texts:
            raise ValueError("All texts are empty")
        
        # Encode in batches for efficiency
        embeddings = self.model.encode(
            valid_texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            show_progress_bar=len(valid_texts) > 100
        )
        
        return embeddings
    
    def similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score (0 to 1)
        """
        # Normalize vectors
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        # Cosine similarity
        similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
        
        # Ensure result is in [0, 1] range
        # Convert from [-1, 1] to [0, 1]
        similarity = (similarity + 1) / 2
        
        return float(similarity)
    
    def batch_similarity(self, query_embedding: np.ndarray, embeddings: List[np.ndarray]) -> List[float]:
        """
        Calculate similarities between query and multiple embeddings
        
        Args:
            query_embedding: Query vector
            embeddings: List of document embedding vectors
            
        Returns:
            List of similarity scores
        """
        similarities = []
        for emb in embeddings:
            sim = self.similarity(query_embedding, emb)
            similarities.append(sim)
        
        return similarities
