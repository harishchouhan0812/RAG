"""
Vector store using FAISS for efficient similarity search
Stores and indexes document embeddings
"""

import numpy as np
import faiss
from typing import List, Dict, Any, Optional, Tuple, Union


class VectorStore:
    """FAISS-based vector store for semantic search"""
    
    def __init__(self, dimension: int = 384):
        """
        Initialize vector store
        
        Args:
            dimension: Embedding dimension
        """
        self.dimension = dimension
        
        # Use L2 distance for FAISS (will convert to cosine similarity)
        self.index = faiss.IndexFlatL2(dimension)
        
        # Store metadata for each vector
        self.chunk_ids: List[str] = []
        self.texts: List[str] = []
        self.metadata: List[Dict[str, Any]] = []
        
        print(f"Initialized vector store (dimension={dimension})")
    
    def add(self, chunk_id: str, embedding: Union[np.ndarray, List[float]], 
            text: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Add a single vector to the index
        
        Args:
            chunk_id: Unique identifier for the chunk
            embedding: Vector embedding
            text: Original text
            metadata: Additional metadata
        """
        # Convert to numpy array if needed
        if isinstance(embedding, list):
            embedding = np.array(embedding, dtype=np.float32)
        else:
            embedding = embedding.astype(np.float32)
        
        # Reshape for FAISS (needs 2D array)
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)
        
        # Validate dimension
        if embedding.shape[1] != self.dimension:
            raise ValueError(
                f"Embedding dimension {embedding.shape[1]} "
                f"does not match index dimension {self.dimension}"
            )
        
        # Add to index
        self.index.add(embedding)
        
        # Store metadata
        self.chunk_ids.append(chunk_id)
        self.texts.append(text)
        self.metadata.append(metadata or {})
    
    def add_batch(self, chunk_ids: List[str], embeddings: List[np.ndarray], 
                  texts: List[str], metadata_list: Optional[List[Dict[str, Any]]] = None):
        """
        Add multiple vectors to the index at once
        
        Args:
            chunk_ids: List of unique identifiers
            embeddings: List of vector embeddings
            texts: List of original texts
            metadata_list: List of metadata dicts
        """
        if not chunk_ids or not embeddings or not texts:
            raise ValueError("Cannot add empty batch")
        
        if len(chunk_ids) != len(embeddings) != len(texts):
            raise ValueError("All lists must have the same length")
        
        # Convert embeddings to numpy array
        embeddings_array = np.array(embeddings, dtype=np.float32)
        
        if embeddings_array.shape[1] != self.dimension:
            raise ValueError(
                f"Embedding dimension {embeddings_array.shape[1]} "
                f"does not match index dimension {self.dimension}"
            )
        
        # Add to index
        self.index.add(embeddings_array)
        
        # Store metadata
        self.chunk_ids.extend(chunk_ids)
        self.texts.extend(texts)
        
        if metadata_list:
            self.metadata.extend(metadata_list)
        else:
            self.metadata.extend([{}] * len(chunk_ids))
    
    def search(self, query_embedding: Union[np.ndarray, List[float]], 
               top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar vectors
        
        Args:
            query_embedding: Query vector
            top_k: Number of results to return
            
        Returns:
            List of results with chunk_id, text, score, and metadata
        """
        if self.count() == 0:
            return []
        
        # Convert to numpy array if needed
        if isinstance(query_embedding, list):
            query_embedding = np.array(query_embedding, dtype=np.float32)
        else:
            query_embedding = query_embedding.astype(np.float32)
        
        # Reshape for FAISS
        if len(query_embedding.shape) == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        # Ensure we don't request more results than available
        k = min(top_k, self.count())
        
        # Search
        distances, indices = self.index.search(query_embedding, k)
        
        # Convert L2 distances to similarity scores
        # Smaller distance = higher similarity
        # Use exponential decay: similarity = exp(-distance)
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:  # FAISS returns -1 for empty slots
                continue
            
            # Convert distance to similarity score (0 to 1)
            # Using exponential decay
            similarity = float(np.exp(-dist))
            
            results.append({
                "chunk_id": self.chunk_ids[idx],
                "text": self.texts[idx],
                "score": similarity,
                "distance": float(dist),
                "metadata": self.metadata[idx],
            })
        
        return results
    
    def get_by_id(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific chunk by ID
        
        Args:
            chunk_id: Chunk identifier
            
        Returns:
            Chunk data or None if not found
        """
        try:
            idx = self.chunk_ids.index(chunk_id)
            return {
                "chunk_id": chunk_id,
                "text": self.texts[idx],
                "metadata": self.metadata[idx],
            }
        except ValueError:
            return None
    
    def count(self) -> int:
        """Get number of vectors in index"""
        return self.index.ntotal
    
    def reset(self):
        """Clear all vectors and metadata"""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunk_ids.clear()
        self.texts.clear()
        self.metadata.clear()
    
    def get_all_chunks(self) -> List[Dict[str, Any]]:
        """Get all stored chunks with metadata"""
        return [
            {
                "chunk_id": self.chunk_ids[i],
                "text": self.texts[i],
                "metadata": self.metadata[i],
            }
            for i in range(len(self.chunk_ids))
        ]
