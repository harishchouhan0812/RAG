/**
 * TypeScript type definitions for RAG pipeline
 */

export interface Document {
  id: string;
  filename: string;
  file_type: string;
  text: string;
  metadata: Record<string, unknown>;
  char_count: number;
  word_count: number;
  status: string;
}

export interface Chunk {
  id: string;
  doc_id: string;
  text: string;
  index: number;
  char_count: number;
  word_count: number;
  metadata: Record<string, unknown>;
}

export interface Embedding {
  chunk_id: string;
  dimension: number;
  preview: number[];
  model?: string;
}

export interface RetrievedChunk {
  chunk_id: string;
  text: string;
  score: number;
  rank: number;
  metadata: Record<string, unknown>;
  retrieval_method?: string;
  original_score?: number;
  rerank_score?: number;
  original_rank?: number;
}

export interface QueryRequest {
  query: string;
  top_k?: number;
  retrieval_method?: 'dense' | 'sparse' | 'hybrid';
  alpha?: number;
  use_reranking?: boolean;
  context_limit?: number;
  system_prompt?: string | null;
}

export interface QueryResponse {
  query: string;
  answer: string;
  retrieved_chunks: RetrievedChunk[];
  context_used: RetrievedChunk[];
  query_embedding_preview: number[];
  metrics: {
    total_time: number;
    retrieved_count: number;
    context_chunks: number;
    retrieval_method: string;
    reranking_used: boolean;
  };
}

export interface ChunkingConfig {
  chunk_size: number;
  overlap: number;
  strategy: 'recursive' | 'sentence' | 'fixed';
}

export interface PipelineStatus {
  documents_count: number;
  chunks_count: number;
  indexed_count: number;
  embedding_model: string;
  llm_provider: string;
  reranker_available: boolean;
}

export interface PipelineEvent {
  type: string;
  timestamp: string;
  time: number;
  data: Record<string, unknown>;
}

export interface PipelineStage {
  id: string;
  label: string;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  description: string;
  details?: string;
}

export interface EvaluationMetrics {
  precision_at_k: Record<number, number>;
  recall_at_k: Record<number, number>;
  mrr: number;
  average_score: number;
}

export interface TeachingStep {
  stage: string;
  title: string;
  explanation: string;
  input_data?: unknown;
  output_data?: unknown;
  why_needed: string;
  what_can_go_wrong: string;
  completed: boolean;
}

export interface FailureMode {
  id: string;
  name: string;
  description: string;
  stage: string;
  cause: string;
  detection: string;
  mitigation: string;
  example_before?: string;
  example_after?: string;
}

export interface ArchitectureComparison {
  name: string;
  description: string;
  components: string[];
  strengths: string[];
  limitations: string[];
  use_case: string;
  implemented: boolean;
}

export type NodeStatus = 'waiting' | 'processing' | 'completed' | 'failed';

export interface PipelineNodeData {
  label: string;
  status: NodeStatus;
  icon?: string;
  description?: string;
}
