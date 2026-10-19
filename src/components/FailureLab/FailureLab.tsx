/**
 * Failure Modes Lab - Demonstrate and fix common RAG problems
 */

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Code, Lightbulb, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FailureMode {
  id: string;
  name: string;
  description: string;
  stage: string;
  severity: 'high' | 'medium' | 'low';
  cause: string;
  detection: string;
  mitigation: string;
  example_before: string;
  example_after: string;
  code_example?: string;
}

const failureModes: FailureMode[] = [
  {
    id: 'poor-chunking',
    name: 'Poor Chunking Strategy',
    description: 'Chunks are too small or too large, breaking context or reducing retrieval precision.',
    stage: 'Chunking',
    severity: 'high',
    cause: 'Incorrect chunk size settings or splitting mid-sentence. Chunk size doesn\'t match document structure.',
    detection: 'Retrieved chunks lack sufficient context. Answers are incomplete or reference broken sentences.',
    mitigation: 'Use 400-600 character chunks with 10-20% overlap. Split on natural boundaries (paragraphs, sentences). Test different sizes.',
    example_before: 'Chunk 1: "The safety procedures include wearing protect"\nChunk 2: "ive equipment at all times. Hard hats and"',
    example_after: 'Chunk 1: "The safety procedures include wearing protective equipment at all times. Hard hats and safety goggles are mandatory."',
    code_example: `# Bad: Too small
chunker.chunk(text, chunk_size=50, overlap=0)

# Good: Appropriate size with overlap
chunker.chunk(text, chunk_size=500, overlap=50)`
  },
  {
    id: 'irrelevant-retrieval',
    name: 'Irrelevant Retrieval Results',
    description: 'Retrieved chunks are semantically similar but factually irrelevant to the query.',
    stage: 'Retrieval',
    severity: 'high',
    cause: 'Over-reliance on semantic similarity alone. Query-document mismatch. Insufficient candidate set.',
    detection: 'High similarity scores but retrieved content doesn\'t answer the question. User feedback indicates poor relevance.',
    mitigation: 'Use hybrid retrieval (dense + BM25). Add metadata filtering. Implement reranking. Increase top-k during retrieval.',
    example_before: 'Query: "What is the refund policy?"\nRetrieved: "Our return policy allows exchanges within 30 days..." (Wrong policy)',
    example_after: 'Query: "What is the refund policy?"\nRetrieved: "Refunds are processed within 5-7 business days for items returned..." (Correct)',
    code_example: `# Bad: Dense only
retriever.retrieve(query, method="dense", top_k=5)

# Good: Hybrid with reranking
retriever.retrieve(query, method="hybrid", top_k=10)
reranker.rerank(query, results[:5])`
  },
  {
    id: 'missing-context',
    name: 'Missing Relevant Documents',
    description: 'Key information exists in documents but isn\'t retrieved.',
    stage: 'Retrieval',
    severity: 'high',
    cause: 'Top-k too low. Relevant chunk ranked below threshold. Query-document vocabulary mismatch.',
    detection: 'Answer says "information not found" despite document containing the answer. Low recall metrics.',
    mitigation: 'Increase top-k. Use query expansion. Add synonyms. Implement multi-query retrieval. Check embedding quality.',
    example_before: 'Top-5 retrieval misses the one chunk that actually answers the question (ranked #7).',
    example_after: 'Top-10 retrieval includes the relevant chunk. Reranking moves it to position #2.',
    code_example: `# Bad: Top-5 might miss relevant results
results = retrieve(query, top_k=5)

# Good: Retrieve more, then rerank
candidates = retrieve(query, top_k=20)
results = rerank(query, candidates)[:5]`
  },
  {
    id: 'hallucination',
    name: 'LLM Hallucination',
    description: 'Generated answer includes information not present in retrieved context.',
    stage: 'Generation',
    severity: 'high',
    cause: 'LLM relies on training data instead of context. Weak grounding instructions. Insufficient or contradictory context.',
    detection: 'Claims cannot be verified against retrieved chunks. Citations point to non-existent sources.',
    mitigation: 'Strengthen system prompts: "ONLY use provided context". Add citation requirements. Validate claims against context.',
    example_before: 'Context: "Product ships within 3-5 days"\nAnswer: "We offer next-day shipping" (Hallucinated)',
    example_after: 'Context: "Product ships within 3-5 days"\nAnswer: "According to [Source 1], the product ships within 3-5 days" (Grounded)',
    code_example: `# Bad: Weak prompt
"Answer the question: {query}"

# Good: Grounding prompt
"Answer using ONLY the context below. Cite sources with [Source N]. If the answer isn't in the context, say 'I cannot answer based on the provided information.'

Context: {context}

Question: {query}"`
  },
  {
    id: 'context-overflow',
    name: 'Context Window Overflow',
    description: 'Retrieved context exceeds model\'s token limit, causing truncation.',
    stage: 'Augmentation',
    severity: 'medium',
    cause: 'Too many chunks or chunks too large. Not tracking token counts. Model context limit not respected.',
    detection: 'Model errors about max length. Important information at the end gets truncated. Incomplete answers.',
    mitigation: 'Track token counts. Prioritize chunks by relevance score. Implement sliding window. Use models with larger context.',
    example_before: '15 chunks × 500 tokens = 7,500 tokens (exceeds 4K limit) → Truncation',
    example_after: 'Top 5 chunks × 400 tokens = 2,000 tokens (within limit) → Full context used',
    code_example: `# Bad: No token management
context = "\\n".join([chunk.text for chunk in all_chunks])

# Good: Token-aware selection
total_tokens = 0
selected = []
for chunk in sorted_chunks:
    tokens = count_tokens(chunk.text)
    if total_tokens + tokens < MAX_CONTEXT_TOKENS:
        selected.append(chunk)
        total_tokens += tokens`
  },
  {
    id: 'stale-index',
    name: 'Outdated Vector Index',
    description: 'Index not updated after document changes, leading to retrieval of deleted or outdated content.',
    stage: 'Indexing',
    severity: 'medium',
    cause: 'Documents updated but index not rebuilt. Asynchronous update failures. No invalidation strategy.',
    detection: 'Retrieved chunks reference old information. Documents show different content than retrieved passages.',
    mitigation: 'Rebuild index when documents change. Implement automatic reindexing. Add version tracking. Use timestamps.',
    example_before: 'Document updated with new policy → Index still returns old policy text',
    example_after: 'Document updated → Index rebuild triggered → Current policy retrieved',
    code_example: `# Bad: Manual, easy to forget
upload_document(doc)
# Forgot to rebuild index!

# Good: Automatic pipeline
def upload_document(doc):
    doc_id = parse_and_store(doc)
    chunks = chunk_document(doc_id)
    embeddings = generate_embeddings(chunks)
    rebuild_index(embeddings)  # Automatic
    return doc_id`
  },
  {
    id: 'embedding-mismatch',
    name: 'Query-Document Embedding Mismatch',
    description: 'Query and documents embedded with different models or settings, breaking similarity.',
    stage: 'Embedding',
    severity: 'high',
    cause: 'Model changed between indexing and querying. Different normalization. Model version drift.',
    detection: 'All similarity scores are very low. Semantic search fails completely. Random-seeming results.',
    mitigation: 'Use consistent embedding model. Version lock models. Re-embed all content when model changes.',
    example_before: 'Docs: model-v1 (384 dim) → Query: model-v2 (768 dim) → Dimension mismatch error',
    example_after: 'Docs: model-v1 (384 dim) → Query: model-v1 (384 dim) → Correct similarity',
    code_example: `# Bad: Model inconsistency
doc_embeddings = model_v1.encode(docs)
query_embedding = model_v2.encode(query)  # Wrong!

# Good: Same model
MODEL = load_model("all-MiniLM-L6-v2")
doc_embeddings = MODEL.encode(docs)
query_embedding = MODEL.encode(query)  # Consistent`
  },
  {
    id: 'poor-citations',
    name: 'Missing or Incorrect Citations',
    description: 'Generated answer doesn\'t cite sources or cites wrong sources.',
    stage: 'Generation',
    severity: 'medium',
    cause: 'No citation instructions. Source IDs not included in context. Model ignores citation format.',
    detection: 'Answer lacks [Source N] markers. Citations don\'t match retrieved chunks. No traceability.',
    mitigation: 'Include source IDs in context. Explicitly instruct citation format. Post-process to validate citations.',
    example_before: 'Answer: "The policy states that refunds take 5-7 days." (No source)',
    example_after: 'Answer: "According to [Source 2], the policy states that refunds take 5-7 days."',
    code_example: `# Bad: No source markers
context = "\\n".join([c.text for c in chunks])

# Good: Include source IDs
context = "\\n".join([
    f"[Source {i+1}] {c.text}"
    for i, c in enumerate(chunks)
])

prompt += "\\nCite sources using [Source N] format."`
  },
  {
    id: 'query-too-vague',
    name: 'Vague or Broad Queries',
    description: 'User query is too general, leading to unfocused retrieval.',
    stage: 'Query Processing',
    severity: 'low',
    cause: 'No query refinement. User unfamiliar with system. No guidance or examples.',
    detection: 'Many high-similarity but diverse results. Answer is generic or unfocused.',
    mitigation: 'Provide query suggestions. Implement query rewriting. Ask clarifying questions. Show example queries.',
    example_before: 'Query: "Tell me about the system" → 50 vaguely related chunks',
    example_after: 'Query: "What are the system\'s security authentication methods?" → 5 focused, relevant chunks',
    code_example: `# Bad: Accept vague query as-is
results = retrieve(user_query)

# Good: Query refinement
if is_too_vague(user_query):
    suggestions = generate_refinement_suggestions(user_query)
    return {"suggestions": suggestions}
else:
    results = retrieve(user_query)`
  },
  {
    id: 'semantic-not-factual',
    name: 'Semantic Similarity ≠ Factual Relevance',
    description: 'High similarity score doesn\'t guarantee factual relevance or correctness.',
    stage: 'Retrieval',
    severity: 'medium',
    cause: 'Embeddings capture semantic similarity, not factual relationships. Similar phrasing, different meaning.',
    detection: 'High-scoring chunks are topically similar but don\'t answer the specific question.',
    mitigation: 'Combine with keyword matching (BM25). Use reranking. Add factual verification. Consider query type.',
    example_before: 'Query: "How much does the premium plan cost?"\nHighly ranked: "The basic plan offers great value..." (Wrong plan)',
    example_after: 'Query: "How much does the premium plan cost?"\nHighly ranked: "The premium plan costs $29.99/month..."',
    code_example: `# Bad: Semantic only
results = vector_search(query_embedding)

# Good: Hybrid approach
semantic_results = vector_search(query_embedding)
keyword_results = bm25_search(query)
results = reciprocal_rank_fusion(semantic_results, keyword_results)`
  }
];

export default function FailureLab() {
  const [selectedFailure, setSelectedFailure] = useState<FailureMode>(failureModes[0]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Failure List */}
      <aside className="w-80 glass-panel border-r border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Failure Modes
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Common RAG problems and solutions
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-custom p-2">
          {failureModes.map((failure) => (
            <button
              key={failure.id}
              onClick={() => setSelectedFailure(failure)}
              className={cn(
                'w-full text-left p-3 rounded-lg mb-2 transition-all',
                'hover:bg-white/10',
                selectedFailure.id === failure.id && 'bg-white/10 border-l-4 border-primary-500'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-white">{failure.name}</h3>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0',
                  getSeverityColor(failure.severity)
                )}>
                  {failure.severity}
                </span>
              </div>
              <p className="text-xs text-gray-400">{failure.stage}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Failure Details */}
      <main className="flex-1 overflow-y-auto scrollbar-custom p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="glass-panel p-6 border-l-4 border-red-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">{selectedFailure.name}</h1>
                <p className="text-gray-300">{selectedFailure.description}</p>
              </div>
              <span className={cn(
                'text-sm px-3 py-1 rounded-full border font-medium',
                getSeverityColor(selectedFailure.severity)
              )}>
                {selectedFailure.severity} severity
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>📍 Stage: {selectedFailure.stage}</span>
            </div>
          </div>

          {/* Root Cause */}
          <div className="glass-panel p-6">
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Root Cause
            </h3>
            <p className="text-gray-300">{selectedFailure.cause}</p>
          </div>

          {/* Detection */}
          <div className="glass-panel p-6">
            <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              How to Detect
            </h3>
            <p className="text-gray-300">{selectedFailure.detection}</p>
          </div>

          {/* Example: Before vs After */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="glass-panel p-6 border-l-4 border-red-500">
              <h3 className="text-sm font-semibold text-red-400 mb-3">❌ Problem Example</h3>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-900/50 p-4 rounded">
                {selectedFailure.example_before}
              </pre>
            </div>

            {/* After */}
            <div className="glass-panel p-6 border-l-4 border-green-500">
              <h3 className="text-sm font-semibold text-green-400 mb-3">✅ Solution Example</h3>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-900/50 p-4 rounded">
                {selectedFailure.example_after}
              </pre>
            </div>
          </div>

          {/* Mitigation */}
          <div className="glass-panel p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Mitigation Strategy
            </h3>
            <p className="text-gray-300">{selectedFailure.mitigation}</p>
          </div>

          {/* Code Example */}
          {selectedFailure.code_example && (
            <div className="glass-panel p-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10">
              <h3 className="text-sm font-semibold text-primary-400 mb-3 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code Example
              </h3>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-900/80 p-4 rounded overflow-x-auto scrollbar-custom">
                {selectedFailure.code_example}
              </pre>
            </div>
          )}

          {/* Key Takeaway */}
          <div className="glass-panel p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Key Takeaway
            </h3>
            <p className="text-gray-300">
              Understanding this failure mode helps you build more robust RAG systems. 
              Always validate your pipeline's behavior and implement monitoring to catch these issues early.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
