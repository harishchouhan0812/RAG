/**
 * Teaching Mode Component - Step-by-step RAG explanation
 */

import { useState } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause,
  RotateCcw,
  X,
  CheckCircle,
  Info,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { useRAGStore } from '../../stores/ragStore';
import { cn } from '../../lib/utils';

interface TeachingStep {
  id: string;
  stage: string;
  title: string;
  explanation: string;
  technical_details: string;
  why_needed: string;
  what_happens: string;
  common_issues: string[];
  best_practices: string[];
  visual_aid?: string;
}

const teachingSteps: TeachingStep[] = [
  {
    id: 'step1',
    stage: 'upload',
    title: 'Step 1: Document Upload',
    explanation: 'RAG systems need external knowledge. The first step is getting that knowledge into the system by uploading documents.',
    technical_details: 'The system accepts PDF, DOCX, TXT, and Markdown files. It validates file type, size, and readability before proceeding.',
    why_needed: 'LLMs have a knowledge cutoff date and don\'t know about your private documents. RAG bridges this gap by retrieving relevant information from your documents.',
    what_happens: 'File is uploaded → Validated (type, size) → Stored temporarily → Ready for text extraction',
    common_issues: [
      'Scanned PDFs without text layer',
      'Corrupted files',
      'Files exceeding size limits',
      'Unsupported formats'
    ],
    best_practices: [
      'Use text-based PDFs when possible',
      'Keep files under 50MB for best performance',
      'Ensure documents are well-formatted',
      'Check document encoding (UTF-8 preferred)'
    ],
    visual_aid: '📤 User → [Upload] → System Storage'
  },
  {
    id: 'step2',
    stage: 'extract',
    title: 'Step 2: Text Extraction',
    explanation: 'Extract clean, searchable text from the document format. This converts PDFs, Word docs, etc. into plain text that can be processed.',
    technical_details: 'Uses PyMuPDF for PDFs (extracts text layer), python-docx for Word documents, and UTF-8 decoding for text files.',
    why_needed: 'RAG searches and retrieves text passages, not PDF layouts or Word formatting. Everything must become searchable text.',
    what_happens: 'Document → Parser (format-specific) → Text extraction → Character/word count → Validation',
    common_issues: [
      'OCR needed for scanned documents',
      'Complex layouts with tables/images',
      'Encoding issues (non-UTF-8)',
      'Garbled text from poor formatting'
    ],
    best_practices: [
      'Validate extraction quality',
      'Preserve document structure when possible',
      'Handle special characters properly',
      'Keep metadata (page numbers, sections)'
    ],
    visual_aid: '📄 PDF Pages → [Extract] → "Chapter 1: Introduction\\n\\nThis document..."'
  },
  {
    id: 'step3',
    stage: 'chunk',
    title: 'Step 3: Document Chunking',
    explanation: 'Split the long document into smaller, overlapping passages called chunks. This enables precise retrieval of relevant sections.',
    technical_details: 'Configurable chunking strategies: Recursive (respects paragraphs/sentences), Sentence-based, or Fixed-size. Default: 500 chars with 50-char overlap.',
    why_needed: 'Long documents exceed model context limits (typically 4K-8K tokens). Chunks allow retrieving only relevant passages instead of entire documents.',
    what_happens: 'Full text → Split on boundaries (paragraphs/sentences) → Apply overlap → Create chunks → Store with metadata',
    common_issues: [
      'Chunks too small: lose context',
      'Chunks too large: imprecise retrieval',
      'Splitting mid-sentence or mid-table',
      'Too much overlap: redundancy and cost'
    ],
    best_practices: [
      'Use 400-600 characters for most documents',
      'Add 10-20% overlap to preserve context',
      'Split on natural boundaries (paragraphs)',
      'Keep source metadata (page, section)'
    ],
    visual_aid: 'Text (20,000 chars) → [Chunk] → 42 chunks (500 chars each, 50 overlap)'
  },
  {
    id: 'step4',
    stage: 'embed',
    title: 'Step 4: Embedding Generation',
    explanation: 'Convert each text chunk into a numerical vector (embedding) that captures its semantic meaning. Similar meanings produce similar vectors.',
    technical_details: 'Uses Sentence Transformer models (e.g., all-MiniLM-L6-v2). Each chunk becomes a 384-dimensional vector where position in space represents meaning.',
    why_needed: 'Enables semantic search. "car" and "automobile" are different words but have similar embeddings, so we can find conceptually similar content.',
    what_happens: 'Chunk text → Sentence Transformer → Vector [0.02, -0.15, ...] → Store with chunk ID',
    common_issues: [
      'Domain mismatch: model not trained on your content type',
      'Very short chunks: insufficient context',
      'Mixed languages: need multilingual models',
      'Technical jargon: may need fine-tuning'
    ],
    best_practices: [
      'Choose domain-appropriate models',
      'Use consistent embedding model',
      'Ensure chunks have enough context',
      'Consider fine-tuning for specialized domains'
    ],
    visual_aid: '"machine learning" → [Embed] → [0.02, -0.15, 0.34, ..., 0.11] (384 dims)'
  },
  {
    id: 'step5',
    stage: 'index',
    title: 'Step 5: Vector Indexing',
    explanation: 'Store embeddings in a vector database (FAISS) for fast similarity search. This enables sub-second search across millions of vectors.',
    technical_details: 'FAISS uses approximate nearest neighbor algorithms. Builds an index structure that enables O(log n) search instead of O(n) brute force.',
    why_needed: 'Comparing every query to every chunk embedding would be too slow. Indexing enables instant similarity search.',
    what_happens: 'Embeddings → FAISS index builder → Optimized index structure → Ready for search queries',
    common_issues: [
      'Index not rebuilt after document updates',
      'Dimension mismatch errors',
      'Lost chunk-to-text mappings',
      'Index file corruption'
    ],
    best_practices: [
      'Rebuild index when documents change',
      'Validate dimensions match',
      'Backup index files',
      'Store metadata with vectors'
    ],
    visual_aid: '42 vectors → [FAISS Index] → Optimized search structure → <10ms queries'
  },
  {
    id: 'step6',
    stage: 'query',
    title: 'Step 6: Query Processing',
    explanation: 'When a user asks a question, embed it using the same model. This puts the query in the same vector space as documents.',
    technical_details: 'Query text → Same Sentence Transformer → Query vector. Must use identical model/settings as document embedding.',
    why_needed: 'For meaningful similarity comparison, query and documents must be in the same vector space (same embedding model).',
    what_happens: 'User question → Tokenize → Embed → Query vector [0.12, -0.08, ...] → Ready for search',
    common_issues: [
      'Query too vague or broad',
      'Multiple questions in one query',
      'Wrong language',
      'Keyword-only queries (no semantic content)'
    ],
    best_practices: [
      'Encourage specific questions',
      'Support query refinement',
      'Detect and handle multi-part questions',
      'Consider query rewriting'
    ],
    visual_aid: '"What are the safety procedures?" → [Embed] → [0.12, -0.08, ...] → Search'
  },
  {
    id: 'step7',
    stage: 'retrieve',
    title: 'Step 7: Similarity Search & Retrieval',
    explanation: 'Find the top-k most similar chunks to the query by calculating vector similarity (cosine similarity or distance).',
    technical_details: 'Hybrid retrieval: Dense (embedding similarity) + Sparse (BM25 keyword matching) combined via Reciprocal Rank Fusion.',
    why_needed: 'Retrieves external knowledge the LLM needs to answer accurately. Only relevant passages are selected, not entire documents.',
    what_happens: 'Query vector → Compare to all indexed vectors → Rank by similarity → Return top-k results',
    common_issues: [
      'Irrelevant results (semantic mismatch)',
      'Missing key information',
      'Too few results: insufficient context',
      'Too many results: context overflow'
    ],
    best_practices: [
      'Use hybrid retrieval (dense + sparse)',
      'Tune top-k for your use case (typically 5-10)',
      'Add metadata filters when available',
      'Consider retrieval metrics (MRR, precision)'
    ],
    visual_aid: 'Query → [Search FAISS] → Rank by score → Top 5: [0.89, 0.84, 0.79, 0.75, 0.71]'
  },
  {
    id: 'step8',
    stage: 'rerank',
    title: 'Step 8: Reranking (Optional)',
    explanation: 'Improve ranking accuracy using a cross-encoder model that scores query-chunk pairs more accurately than retrieval.',
    technical_details: 'Cross-encoder sees both query and chunk together (vs bi-encoder which encodes separately). More accurate but slower.',
    why_needed: 'Initial retrieval optimizes for speed. Reranking improves accuracy for the top candidates before sending to LLM.',
    what_happens: 'Top-k results → Cross-encoder scores each pair → Re-sort by new scores → Updated ranking',
    common_issues: [
      'High latency (slow for large candidate sets)',
      'Diminishing returns for simple queries',
      'Overfitting to reranker training data'
    ],
    best_practices: [
      'Only rerank top 20-50 candidates',
      'Make reranking optional/configurable',
      'Use distilled models for speed',
      'A/B test to measure impact'
    ],
    visual_aid: 'Before: [0.89, 0.84, 0.79] → [Rerank] → After: [0.92, 0.88, 0.85]'
  },
  {
    id: 'step9',
    stage: 'augment',
    title: 'Step 9: Context Augmentation',
    explanation: 'Build the complete prompt by combining system instructions, retrieved passages, and the user question.',
    technical_details: 'Assembles: System prompt + Context passages (with source IDs) + User question. Tracks token count to stay within limits.',
    why_needed: 'Provides LLM with both the question AND relevant external knowledge to generate an accurate, grounded answer.',
    what_happens: 'Retrieved chunks → Format with sources → Add system instructions → Append query → Complete prompt',
    common_issues: [
      'Context exceeds token limit',
      'Poor ordering of passages',
      'Redundant information',
      'Lost source attribution'
    ],
    best_practices: [
      'Order by relevance score',
      'Include source identifiers',
      'Deduplicate similar chunks',
      'Monitor token usage'
    ],
    visual_aid: 'System + "[Source 1] text..." + "[Source 2] text..." + Question → Full prompt'
  },
  {
    id: 'step10',
    stage: 'generate',
    title: 'Step 10: LLM Answer Generation',
    explanation: 'Send the augmented prompt to an LLM (local or API) which generates a natural language answer using the retrieved context.',
    technical_details: 'Supports local models (GPT-2, LLaMA) or APIs (OpenAI, Anthropic). Instructs model to cite sources and stay grounded.',
    why_needed: 'LLM synthesizes retrieved information into a coherent answer, combining multiple sources and explaining complex topics.',
    what_happens: 'Full prompt → LLM → Generated answer with citations → Return to user',
    common_issues: [
      'Hallucination (ignoring context)',
      'Missing citations',
      'Contradicting sources',
      'Not using retrieved context'
    ],
    best_practices: [
      'Instruct model to cite sources',
      'Use "grounded generation" prompts',
      'Enable "I don\'t know" responses',
      'Validate claims against context'
    ],
    visual_aid: 'Prompt → [LLM] → "According to [Source 1], the safety procedures include..."'
  }
];

export default function TeachingMode() {
  const { setTeachingMode } = useRAGStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const step = teachingSteps[currentStep];
  const progress = ((currentStep + 1) / teachingSteps.length) * 100;

  const nextStep = () => {
    if (currentStep < teachingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setAutoPlay(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="glass-panel border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary-400" />
            <div>
              <h1 className="text-xl font-bold gradient-text">Teaching Mode</h1>
              <p className="text-sm text-gray-400">Learn RAG step-by-step</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="text-sm text-gray-400">
              Step {currentStep + 1} of {teachingSteps.length}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="glass-button p-2"
                title="Reset to beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className="glass-button p-2"
                title={autoPlay ? 'Pause' : 'Auto-play'}
              >
                {autoPlay ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => setTeachingMode(false)}
                className="glass-button p-2 text-red-400"
                title="Exit teaching mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-custom p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Step Title */}
          <div className="glass-panel p-8 border-l-4 border-primary-500">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
                <p className="text-lg text-gray-300">{step.explanation}</p>
              </div>
              <div className="glass-panel px-4 py-2 text-center">
                <div className="text-3xl font-bold gradient-text">{currentStep + 1}</div>
                <div className="text-xs text-gray-400">Step</div>
              </div>
            </div>
          </div>

          {/* Visual Aid */}
          {step.visual_aid && (
            <div className="glass-panel p-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10">
              <h3 className="text-sm font-semibold text-accent-400 mb-3">Visual Flow</h3>
              <div className="text-center font-mono text-lg text-white bg-gray-900/50 rounded-lg p-4">
                {step.visual_aid}
              </div>
            </div>
          )}

          {/* What Happens */}
          <div className="glass-panel p-6">
            <h3 className="text-sm font-semibold text-primary-400 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              What Happens in This Step
            </h3>
            <p className="text-gray-300">{step.what_happens}</p>
          </div>

          {/* Technical Details */}
          <div className="glass-panel p-6">
            <h3 className="text-sm font-semibold text-primary-400 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Technical Details
            </h3>
            <p className="text-gray-300">{step.technical_details}</p>
          </div>

          {/* Why Needed */}
          <div className="glass-panel p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Why This Step Is Necessary
            </h3>
            <p className="text-gray-300">{step.why_needed}</p>
          </div>

          {/* Common Issues */}
          <div className="glass-panel p-6 border-l-4 border-yellow-500">
            <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Common Issues to Watch For
            </h3>
            <ul className="space-y-2">
              {step.common_issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Best Practices */}
          <div className="glass-panel p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Best Practices
            </h3>
            <ul className="space-y-2">
              {step.best_practices.map((practice, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="glass-panel border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={cn(
              'glass-button flex items-center gap-2',
              currentStep === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            {teachingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentStep
                    ? 'bg-primary-500 w-8'
                    : 'bg-gray-600 hover:bg-gray-500'
                )}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === teachingSteps.length - 1}
            className={cn(
              'glass-button flex items-center gap-2',
              currentStep === teachingSteps.length - 1 && 'opacity-50 cursor-not-allowed'
            )}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
