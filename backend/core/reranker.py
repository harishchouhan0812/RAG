"""
Cross-encoder reranker for improving retrieval quality
Reorders retrieved candidates using more accurate scoring
"""

from typing import List, Dict, Any, Optional
from sentence_transformers import CrossEncoder
import numpy as np


class Reranker:
    """Rerank retrieved results using cross-encoder model"""
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Initialize reranker model
        
        Args:
            model_name: Name of cross-encoder model
                       Default: cross-encoder/ms-marco-MiniLM-L-6-v2
                       Options: cross-encoder/ms-marco-MiniLM-L-12-v2 (more accurate, slower)
        """
        print(f"Loading reranker model: {model_name}")
        self.model = CrossEncoder(model_name)
        self.model_name = model_name
        print("Reranker loaded successfully")
    
    def rerank(
        self,
        query: str,
        results: List[Dict[str, Any]],
        top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Rerank retrieved results
        
        Args:
            query: Query text
            results: List of retrieved results with 'text' field
            top_k: Number of top results to return (None = return all)
            
        Returns:
            Reranked results with updated scores and ranks
        """
        if not results:
            return []
        
        # Prepare query-document pairs
        pairs = [[query, result["text"]] for result in results]
        
        # Get reranking scores
        scores = self.model.predict(pairs)
        
        # Create reranked results
        reranked = []
        for result, score in zip(results, scores):
            reranked_result = result.copy()
            reranked_result["original_score"] = result.get("score", 0.0)
            reranked_result["rerank_score"] = float(score)
            reranked_result["score"] = float(score)  # Update main score
            reranked.append(reranked_result)
        
        # Sort by rerank score
        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        
        # Update ranks
        for i, result in enumerate(reranked):
            result["original_rank"] = result.get("rank", i + 1)
            result["rank"] = i + 1
        
        # Return top_k if specified
        if top_k:
            return reranked[:top_k]
        
        return reranked
    
    def score_pair(self, query: str, text: str) -> float:
        """
        Score a single query-text pair
        
        Args:
            query: Query text
            text: Document text
            
        Returns:
            Relevance score
        """
        score = self.model.predict([[query, text]])[0]
        return float(score)
    
    def compare_reranking(
        self,
        query: str,
        results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Compare ranking before and after reranking
        
        Args:
            query: Query text
            results: Retrieved results
            
        Returns:
            Comparison statistics
        """
        if not results:
            return {"changed_positions": 0, "avg_position_change": 0.0}
        
        # Store original ranks
        original_ranks = {r["chunk_id"]: r.get("rank", i+1) 
                         for i, r in enumerate(results)}
        
        # Rerank
        reranked = self.rerank(query, results)
        
        # Calculate position changes
        position_changes = []
        for new_rank, result in enumerate(reranked, 1):
            old_rank = original_ranks[result["chunk_id"]]
            change = abs(old_rank - new_rank)
            position_changes.append(change)
        
        return {
            "changed_positions": sum(1 for c in position_changes if c > 0),
            "avg_position_change": np.mean(position_changes),
            "max_position_change": max(position_changes) if position_changes else 0,
            "total_results": len(results),
        }
