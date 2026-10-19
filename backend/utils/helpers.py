"""
Utility functions for RAG pipeline
Event logging, metrics calculation, and helper functions
"""

import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict


class EventLogger:
    """Log pipeline events for visualization"""
    
    def __init__(self):
        self.events: List[Dict[str, Any]] = []
    
    def log(self, event_type: str, data: Dict[str, Any]):
        """
        Log an event
        
        Args:
            event_type: Type of event
            data: Event data
        """
        event = {
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "time": time.time(),
            "data": data,
        }
        self.events.append(event)
        
        # Keep only last 1000 events
        if len(self.events) > 1000:
            self.events = self.events[-1000:]
    
    def get_events(self, event_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get logged events
        
        Args:
            event_type: Filter by event type (optional)
            
        Returns:
            List of events
        """
        if event_type:
            return [e for e in self.events if e["type"] == event_type]
        return self.events
    
    def clear(self):
        """Clear all events"""
        self.events.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get event statistics"""
        event_counts = defaultdict(int)
        for event in self.events:
            event_counts[event["type"]] += 1
        
        return {
            "total_events": len(self.events),
            "event_types": dict(event_counts),
            "first_event": self.events[0]["timestamp"] if self.events else None,
            "last_event": self.events[-1]["timestamp"] if self.events else None,
        }


def calculate_metrics(
    retrieved_chunks: List[str],
    relevant_chunks: List[str],
    k_values: List[int] = [1, 3, 5, 10]
) -> Dict[str, Any]:
    """
    Calculate retrieval evaluation metrics
    
    Args:
        retrieved_chunks: List of retrieved chunk IDs (in rank order)
        relevant_chunks: List of ground truth relevant chunk IDs
        k_values: K values for precision@k and recall@k
        
    Returns:
        Dictionary with metrics
    """
    if not retrieved_chunks or not relevant_chunks:
        return {
            "precision_at_k": {k: 0.0 for k in k_values},
            "recall_at_k": {k: 0.0 for k in k_values},
            "mrr": 0.0,
            "average_score": 0.0,
        }
    
    relevant_set = set(relevant_chunks)
    
    # Precision@k and Recall@k
    precision_at_k = {}
    recall_at_k = {}
    
    for k in k_values:
        top_k = retrieved_chunks[:k]
        relevant_in_top_k = len([c for c in top_k if c in relevant_set])
        
        precision_at_k[k] = relevant_in_top_k / k if k > 0 else 0.0
        recall_at_k[k] = relevant_in_top_k / len(relevant_set) if relevant_set else 0.0
    
    # Mean Reciprocal Rank (MRR)
    mrr = 0.0
    for i, chunk_id in enumerate(retrieved_chunks, 1):
        if chunk_id in relevant_set:
            mrr = 1.0 / i
            break
    
    # Average score (mean of all precision values)
    avg_score = sum(precision_at_k.values()) / len(precision_at_k) if precision_at_k else 0.0
    
    return {
        "precision_at_k": precision_at_k,
        "recall_at_k": recall_at_k,
        "mrr": mrr,
        "average_score": avg_score,
    }


def format_time(seconds: float) -> str:
    """
    Format time in human-readable format
    
    Args:
        seconds: Time in seconds
        
    Returns:
        Formatted time string
    """
    if seconds < 1:
        return f"{seconds * 1000:.0f}ms"
    elif seconds < 60:
        return f"{seconds:.2f}s"
    else:
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes}m {secs:.0f}s"


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to maximum length
    
    Args:
        text: Input text
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def highlight_matches(text: str, query: str) -> List[Dict[str, Any]]:
    """
    Find matching terms between query and text
    
    Args:
        text: Document text
        query: Query text
        
    Returns:
        List of match positions and terms
    """
    query_terms = set(query.lower().split())
    text_lower = text.lower()
    
    matches = []
    for term in query_terms:
        start = 0
        while True:
            pos = text_lower.find(term, start)
            if pos == -1:
                break
            matches.append({
                "term": term,
                "position": pos,
                "length": len(term),
                "text": text[pos:pos + len(term)]
            })
            start = pos + 1
    
    return sorted(matches, key=lambda x: x["position"])


def calculate_overlap(chunk1: str, chunk2: str) -> float:
    """
    Calculate overlap between two text chunks
    
    Args:
        chunk1: First chunk
        chunk2: Second chunk
        
    Returns:
        Overlap ratio (0 to 1)
    """
    if not chunk1 or not chunk2:
        return 0.0
    
    # Find common substring
    len1, len2 = len(chunk1), len(chunk2)
    max_len = max(len1, len2)
    
    # Simple character-based overlap
    common_chars = sum(1 for c1, c2 in zip(chunk1, chunk2) if c1 == c2)
    
    return common_chars / max_len if max_len > 0 else 0.0


def extract_citations(text: str) -> List[str]:
    """
    Extract citations from text (e.g., [Source 1], [Source 2])
    
    Args:
        text: Text with citations
        
    Returns:
        List of citation strings
    """
    import re
    pattern = r'\[Source \d+\]'
    return re.findall(pattern, text)


def validate_chunk_config(chunk_size: int, overlap: int) -> tuple[bool, Optional[str]]:
    """
    Validate chunking configuration
    
    Args:
        chunk_size: Chunk size in characters
        overlap: Overlap size in characters
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if chunk_size < 100:
        return False, "Chunk size must be at least 100 characters"
    
    if chunk_size > 2000:
        return False, "Chunk size cannot exceed 2000 characters"
    
    if overlap < 0:
        return False, "Overlap cannot be negative"
    
    if overlap >= chunk_size:
        return False, "Overlap must be less than chunk size"
    
    if overlap > chunk_size * 0.5:
        return False, "Overlap should not exceed 50% of chunk size"
    
    return True, None
