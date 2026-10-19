"""
Hybrid retriever combining dense (vector) and sparse (BM25) retrieval
Provides multiple retrieval strategies for different use cases
"""

import numpy as np
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Okapi
from collections import defaultdict


class HybridRetriever:
    """Combine dense semantic search with sparse keyword search"""
    
    def __init__(self, vector_store, embedding_generator):
        """
        Initialize hybrid retriever
        
        Args:
            vector_store: VectorStore instance for dense retrieval
            embedding_generator: EmbeddingGenerator for query embedding
        """
        self.vector_store = vector_store
        self.embedding_generator = embedding_generator
        self.bm25 = None
        self.corpus_texts = []
        self._build_bm25_index()
    
    def _build_bm25_index(self):
        """Build BM25 index from vector store content"""
        if self.vector_store.count() == 0:
            self.bm25 = None
            return
        
        # Get all texts from vector store
        self.corpus_texts = self.vector_store.texts
        
        # Tokenize texts for BM25
        tokenized_corpus = [text.lower().split() for text in self.corpus_texts]
        
        # Build BM25 index
        self.bm25 = BM25Okapi(tokenized_corpus)
        print(f"Built BM25 index with {len(self.corpus_texts)} documents")
    
    def retrieve(
        self,
        query: str,
        query_embedding: Optional[np.ndarray] = None,
        top_k: int = 5,
        retrieval_method: str = "dense",
        alpha: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks using specified method
        
        Args:
            query: Query text
            query_embedding: Pre-computed query embedding (optional)
            top_k: Number of results to return
            retrieval_method: "dense", "sparse", or "hybrid"
            alpha: Weight for hybrid retrieval (0=sparse only, 1=dense only)
            
        Returns:
            List of retrieved chunks with scores
        """
        # Rebuild BM25 if needed
        if self.bm25 is None or len(self.corpus_texts) != self.vector_store.count():
            self._build_bm25_index()
        
        if retrieval_method == "dense":
            return self._dense_retrieve(query, query_embedding, top_k)
        elif retrieval_method == "sparse":
            return self._sparse_retrieve(query, top_k)
        elif retrieval_method == "hybrid":
            return self._hybrid_retrieve(query, query_embedding, top_k, alpha)
        else:
            raise ValueError(f"Unknown retrieval method: {retrieval_method}")
    
    def _dense_retrieve(
        self, 
        query: str, 
        query_embedding: Optional[np.ndarray], 
        top_k: int
    ) -> List[Dict[str, Any]]:
        """Dense retrieval using vector similarity"""
        # Generate query embedding if not provided
        if query_embedding is None:
            query_embedding = self.embedding_generator.embed(query)
        
        # Search vector store
        results = self.vector_store.search(query_embedding, top_k)
        
        # Add rank and format
        for i, result in enumerate(results):
            result["rank"] = i + 1
            result["retrieval_method"] = "dense"
        
        return results
    
    def _sparse_retrieve(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Sparse retrieval using BM25 keyword matching"""
        if self.bm25 is None:
            return []
        
        # Tokenize query
        tokenized_query = query.lower().split()
        
        # Get BM25 scores
        scores = self.bm25.get_scores(tokenized_query)
        
        # Get top-k indices
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        # Build results
        results = []
        for rank, idx in enumerate(top_indices):
            chunk_id = self.vector_store.chunk_ids[idx]
            text = self.vector_store.texts[idx]
            metadata = self.vector_store.metadata[idx]
            
            results.append({
                "chunk_id": chunk_id,
                "text": text,
                "score": float(scores[idx]),
                "rank": rank + 1,
                "metadata": metadata,
                "retrieval_method": "sparse",
            })
        
        return results
    
    def _hybrid_retrieve(
        self,
        query: str,
        query_embedding: Optional[np.ndarray],
        top_k: int,
        alpha: float
    ) -> List[Dict[str, Any]]:
        """
        Hybrid retrieval using Reciprocal Rank Fusion (RRF)
        
        Args:
            query: Query text
            query_embedding: Query vector
            top_k: Number of final results
            alpha: Weight (not used in RRF, kept for API compatibility)
        """
        # Get more candidates from each method
        candidate_k = top_k * 3
        
        # Get dense results
        dense_results = self._dense_retrieve(query, query_embedding, candidate_k)
        
        # Get sparse results
        sparse_results = self._sparse_retrieve(query, candidate_k)
        
        # Reciprocal Rank Fusion
        k = 60  # RRF constant
        rrf_scores = defaultdict(float)
        chunk_data = {}
        
        # Add dense scores
        for rank, result in enumerate(dense_results, 1):
            chunk_id = result["chunk_id"]
            rrf_scores[chunk_id] += 1 / (k + rank)
            if chunk_id not in chunk_data:
                chunk_data[chunk_id] = result
        
        # Add sparse scores
        for rank, result in enumerate(sparse_results, 1):
            chunk_id = result["chunk_id"]
            rrf_scores[chunk_id] += 1 / (k + rank)
            if chunk_id not in chunk_data:
                chunk_data[chunk_id] = result
        
        # Sort by RRF score
        sorted_chunks = sorted(
            rrf_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_k]
        
        # Build final results
        results = []
        for rank, (chunk_id, rrf_score) in enumerate(sorted_chunks, 1):
            result = chunk_data[chunk_id].copy()
            result["score"] = float(rrf_score)
            result["rank"] = rank
            result["retrieval_method"] = "hybrid"
            results.append(result)
        
        return results
    
    def explain_retrieval(self, query: str, chunk_text: str) -> Dict[str, Any]:
        """
        Explain why a chunk was retrieved
        
        Args:
            query: Query text
            chunk_text: Retrieved chunk text
            
        Returns:
            Explanation with matching terms and similarity info
        """
        query_tokens = set(query.lower().split())
        chunk_tokens = set(chunk_text.lower().split())
        
        matching_tokens = query_tokens & chunk_tokens
        
        return {
            "matching_terms": list(matching_tokens),
            "match_count": len(matching_tokens),
            "query_terms": list(query_tokens),
            "coverage": len(matching_tokens) / len(query_tokens) if query_tokens else 0,
        }
