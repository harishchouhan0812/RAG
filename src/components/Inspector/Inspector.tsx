/**
 * Inspector Component - Detailed stage explanations
 */

import { X, Info, AlertTriangle, Lightbulb, Code } from 'lucide-react';
import { useRAGStore } from '../../stores/ragStore';
import { cn } from '../../lib/utils';

const stageDetails: Record<string, {
  purpose: string;
  how_it_works: string;
  why_needed: string;
  failure_modes: string[];
  mitigation: string[];
  example: string;
}> = {
  upload: {
    purpose: 'Accept and validate document files from users',
    how_it_works: 'Receives file uploads, validates file type and size, stores temporarily for processing',
    why_needed: 'RAG systems need external knowledge. Document upload provides that knowledge source.',
    failure_modes: [
      'Unsupported file format',
      'File too large',
      'Corrupted file',
      'Empty document'
    ],
    mitigation: [
      'Validate file extensions before upload',
      'Set reasonable size limits (50MB default)',
      'Check file integrity',
      'Verify content is extractable'
    ],
    example: 'User uploads "company-handbook.pdf" → System validates → Ready for extraction'
  },
  extract: {
    purpose: 'Extract readable text from various document formats',
    how_it_works: 'Uses format-specific parsers (PyMuPDF for PDF, python-docx for DOCX) to extract text content',
    why_needed: 'RAG retrieves text passages, not PDF layouts. Extraction converts documents to searchable text.',
    failure_modes: [
      'Scanned PDFs without OCR',
      'Complex layouts',
      'Embedded images with text',
      'Garbled encoding'
    ],
    mitigation: [
      'Add OCR for scanned documents',
      'Handle encoding detection',
      'Preserve section structure',
      'Extract alt text from images'
    ],
    example: 'PDF pages → "Chapter 1: Introduction\\n\\nThis document describes..."'
  },
  chunk: {
    purpose: 'Split text into smaller, overlapping passages',
    how_it_works: 'Divides text using configurable strategies (recursive, sentence, fixed) with overlap between chunks',
    why_needed: 'Long documents exceed model context limits. Chunks enable precise retrieval of relevant sections.',
    failure_modes: [
      'Chunks too small (incomplete context)',
      'Chunks too large (imprecise retrieval)',
      'Sentence splitting mid-thought',
      'Excessive overlap (redundancy)'
    ],
    mitigation: [
      'Use 400-600 character chunks for most use cases',
      'Add 10-20% overlap to preserve context',
      'Split on natural boundaries (paragraphs, sentences)',
      'Preserve metadata (source page, section)'
    ],
    example: '500-char chunks with 50-char overlap → 42 chunks from 20,000-char document'
  },
  embed: {
    purpose: 'Convert text chunks into numerical vector representations',
    how_it_works: 'Uses Sentence Transformer models to generate dense embeddings capturing semantic meaning',
    why_needed: 'Enables semantic similarity search. Similar meanings produce similar vectors regardless of exact wording.',
    failure_modes: [
      'Out-of-domain text (model not trained on this type)',
      'Very short chunks (insufficient context)',
      'Mixed languages',
      'Jargon or rare terms'
    ],
    mitigation: [
      'Choose domain-appropriate embedding models',
      'Ensure chunks have sufficient context',
      'Use multilingual models if needed',
      'Fine-tune embeddings on your domain'
    ],
    example: '"machine learning algorithms" → [0.02, -0.15, 0.34, ..., 0.11] (384 dimensions)'
  },
  index: {
    purpose: 'Store embeddings in an efficient vector database',
    how_it_works: 'FAISS indexes vectors for fast similarity search using approximate nearest neighbor algorithms',
    why_needed: 'Enables sub-second similarity search across millions of vectors instead of comparing each one.',
    failure_modes: [
      'Index not rebuilt after updates',
      'Dimension mismatch',
      'Lost chunk-to-text mapping',
      'Index corruption'
    ],
    mitigation: [
      'Rebuild index when documents change',
      'Validate embedding dimensions match',
      'Store metadata with each vector',
      'Implement index backup/restore'
    ],
    example: '42 vectors (384-dim each) → FAISS L2 index → <10ms search time'
  },
  query: {
    purpose: 'Process user questions and prepare for retrieval',
    how_it_works: 'Embeds the query using the same model as documents, optionally applies query rewriting',
    why_needed: 'Query must be in the same embedding space as documents for meaningful similarity comparison.',
    failure_modes: [
      'Query too vague',
      'Keyword-heavy questions',
      'Multiple questions in one',
      'Wrong language'
    ],
    mitigation: [
      'Provide query suggestions',
      'Detect and split multi-questions',
      'Use query rewriting for clarity',
      'Support multilingual queries'
    ],
    example: '"What are the safety procedures?" → embedding → ready for similarity search'
  },
  retrieve: {
    purpose: 'Find the most relevant chunks for the query',
    how_it_works: 'Calculates similarity between query and all document embeddings, returns top-k matches',
    why_needed: 'Retrieves external knowledge that the LLM needs to answer the question accurately.',
    failure_modes: [
      'Irrelevant results (semantic mismatch)',
      'Missing key information',
      'Too few results (insufficient context)',
      'Too many results (context overflow)'
    ],
    mitigation: [
      'Use hybrid retrieval (dense + sparse)',
      'Tune top-k for your use case',
      'Add metadata filtering',
      'Implement re-ranking'
    ],
    example: 'Top 5 chunks with scores: [0.89, 0.84, 0.79, 0.75, 0.71]'
  },
  rerank: {
    purpose: 'Improve ranking accuracy using cross-encoder models',
    how_it_works: 'Scores each query-document pair jointly using a more accurate but slower model',
    why_needed: 'Bi-encoders (used for retrieval) sacrifice accuracy for speed. Reranking improves top results.',
    failure_modes: [
      'High latency (cross-encoders are slow)',
      'Overfitting to training data',
      'Not worth cost for simple queries'
    ],
    mitigation: [
      'Only rerank top-20 to 50 candidates',
      'Use distilled reranker models',
      'Make reranking optional',
      'Cache reranking results'
    ],
    example: 'Before: [0.89, 0.84, 0.79] → After: [0.92, 0.88, 0.85] (reranked scores)'
  },
  augment: {
    purpose: 'Build the complete prompt with retrieved context',
    how_it_works: 'Combines system instructions, user question, and retrieved passages into one prompt',
    why_needed: 'Provides the LLM with both the question and relevant external knowledge to generate an answer.',
    failure_modes: [
      'Context exceeds model limit',
      'Poor context ordering',
      'Redundant passages',
      'Lost source attribution'
    ],
    mitigation: [
      'Track token counts',
      'Order by relevance score',
      'Deduplicate similar chunks',
      'Include source IDs in context'
    ],
    example: 'System: "Answer using context" + Context: [passages] + Question → Full prompt'
  },
  generate: {
    purpose: 'Generate the final answer using an LLM',
    how_it_works: 'Sends augmented prompt to LLM (local or API), streams response, extracts citations',
    why_needed: 'LLM synthesizes retrieved information into a coherent, natural language answer.',
    failure_modes: [
      'Hallucination (ignoring context)',
      'Contradicting sources',
      'Missing citations',
      'Context not used'
    ],
    mitigation: [
      'Instruct model to cite sources',
      'Use grounded generation prompts',
      'Verify claims against context',
      'Add "I don\'t know" capability'
    ],
    example: 'Answer: "According to [Source 1], safety procedures include..." with citations'
  },
};

export default function Inspector() {
  const { selectedStage, setSelectedStage, pipelineStages } = useRAGStore();

  const stage = pipelineStages.find((s) => s.id === selectedStage);
  const details = selectedStage ? stageDetails[selectedStage] : null;

  if (!selectedStage || !stage || !details) {
    return (
      <aside className="w-96 glass-panel border-l border-white/10 p-6">
        <div className="text-center text-gray-400 mt-20">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Click a pipeline node to see detailed explanations</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 glass-panel border-l border-white/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Stage Inspector</h2>
        <button
          onClick={() => setSelectedStage(null)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-custom p-4 space-y-4">
        {/* Stage Title */}
        <div className="glass-panel p-4">
          <h3 className="text-xl font-bold text-white mb-2">{stage.label}</h3>
          <p className="text-sm text-gray-400">{stage.description}</p>
          <div className={cn(
            'inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium border',
            stage.status === 'completed' && 'bg-green-500/20 text-green-300 border-green-500/30',
            stage.status === 'processing' && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            stage.status === 'waiting' && 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            stage.status === 'failed' && 'bg-red-500/20 text-red-300 border-red-500/30',
          )}>
            {stage.status}
          </div>
        </div>

        {/* Purpose */}
        <section className="glass-panel p-4">
          <h4 className="text-sm font-semibold text-primary-400 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Purpose
          </h4>
          <p className="text-sm text-gray-300">{details.purpose}</p>
        </section>

        {/* How It Works */}
        <section className="glass-panel p-4">
          <h4 className="text-sm font-semibold text-primary-400 mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            How It Works
          </h4>
          <p className="text-sm text-gray-300">{details.how_it_works}</p>
        </section>

        {/* Why Needed */}
        <section className="glass-panel p-4">
          <h4 className="text-sm font-semibold text-primary-400 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Why This Step Matters
          </h4>
          <p className="text-sm text-gray-300">{details.why_needed}</p>
        </section>

        {/* Example */}
        <section className="glass-panel p-4 bg-gradient-to-br from-primary-500/10 to-accent-500/10">
          <h4 className="text-sm font-semibold text-accent-400 mb-2">Example</h4>
          <p className="text-sm text-gray-300 font-mono">{details.example}</p>
        </section>

        {/* Failure Modes */}
        <section className="glass-panel p-4 border-l-4 border-red-500/50">
          <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            What Can Go Wrong
          </h4>
          <ul className="space-y-2">
            {details.failure_modes.map((mode, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{mode}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Mitigation */}
        <section className="glass-panel p-4 border-l-4 border-green-500/50">
          <h4 className="text-sm font-semibold text-green-400 mb-3">Mitigation Strategies</h4>
          <ul className="space-y-2">
            {details.mitigation.map((strategy, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>{strategy}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
