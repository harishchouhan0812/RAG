# Sample Queries for Testing

Use these example queries to test the RAG system with the provided sample document:

## Basic Questions

1. "What is RAG?"
2. "What are the main components of a RAG system?"
3. "How does document chunking work?"
4. "What embedding models are recommended?"

## Technical Questions

5. "What is the recommended chunk size for documents?"
6. "How can I improve retrieval quality?"
7. "What are common RAG pitfalls?"
8. "How do I handle hallucination in RAG systems?"

## Configuration Questions

9. "What retrieval method should I use?"
10. "How do I optimize for latency?"
11. "What evaluation metrics should I track?"
12. "How do I implement hybrid retrieval?"

## Advanced Topics

13. "What is Graph RAG?"
14. "How does agentic RAG work?"
15. "What are the security concerns in RAG systems?"
16. "How do I scale a RAG system for production?"

## Troubleshooting

17. "Why am I getting irrelevant results?"
18. "How do I fix poor chunking?"
19. "What causes index staleness?"
20. "How do I reduce query latency?"

## Expected Behavior

- **Good queries** should retrieve relevant chunks and generate accurate answers with citations
- **Dense retrieval** works well for semantic questions
- **Hybrid retrieval** handles both semantic and keyword-based queries
- **Reranking** improves the final result quality but adds latency
- **Context length** affects how much information the LLM can use

## Testing Different Configurations

### Test 1: Dense vs Sparse vs Hybrid
Run the same query with each retrieval method and compare:
- Precision of results
- Latency
- Answer quality

### Test 2: Top-K Variation
Try top-k values of 3, 5, 10 and observe:
- How many relevant chunks are retrieved
- Whether increasing k improves answers
- Impact on latency

### Test 3: Reranking Impact
Compare results with and without reranking:
- Does ranking improve?
- Is the quality gain worth the latency cost?

### Test 4: Chunking Strategy
Try different chunk sizes (200, 500, 1000) and observe:
- Context preservation
- Retrieval precision
- Answer completeness
