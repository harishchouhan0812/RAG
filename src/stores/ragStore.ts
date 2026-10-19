/**
 * Zustand store for RAG pipeline state management
 */

import { create } from 'zustand';
import type {
  Document,
  Chunk,
  ChunkingConfig,
  QueryResponse,
  PipelineStatus,
  PipelineEvent,
  PipelineStage,
  TeachingStep,
} from '../types';

interface RAGStore {
  // Document state
  documents: Document[];
  currentDocument: Document | null;
  chunks: Chunk[];
  
  // Pipeline state
  pipelineStatus: PipelineStatus | null;
  pipelineStages: PipelineStage[];
  events: PipelineEvent[];
  
  // Configuration
  chunkingConfig: ChunkingConfig;
  retrievalMethod: 'dense' | 'sparse' | 'hybrid';
  topK: number;
  useReranking: boolean;
  alpha: number;
  
  // Query state
  queries: QueryResponse[];
  currentQuery: QueryResponse | null;
  isQuerying: boolean;
  
  // UI state
  teachingMode: boolean;
  teachingSteps: TeachingStep[];
  currentStepIndex: number;
  selectedChunkId: string | null;
  selectedStage: string | null;
  
  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  setCurrentDocument: (document: Document | null) => void;
  setChunks: (chunks: Chunk[]) => void;
  
  setPipelineStatus: (status: PipelineStatus) => void;
  updateStageStatus: (stageId: string, status: 'waiting' | 'processing' | 'completed' | 'failed') => void;
  addEvent: (event: PipelineEvent) => void;
  setEvents: (events: PipelineEvent[]) => void;
  clearEvents: () => void;
  
  setChunkingConfig: (config: Partial<ChunkingConfig>) => void;
  setRetrievalMethod: (method: 'dense' | 'sparse' | 'hybrid') => void;
  setTopK: (k: number) => void;
  setUseReranking: (use: boolean) => void;
  setAlpha: (alpha: number) => void;
  
  addQuery: (query: QueryResponse) => void;
  setCurrentQuery: (query: QueryResponse | null) => void;
  setIsQuerying: (isQuerying: boolean) => void;
  
  setTeachingMode: (enabled: boolean) => void;
  setTeachingSteps: (steps: TeachingStep[]) => void;
  nextTeachingStep: () => void;
  previousTeachingStep: () => void;
  setCurrentStepIndex: (index: number) => void;
  
  setSelectedChunkId: (id: string | null) => void;
  setSelectedStage: (stage: string | null) => void;
  
  resetPipeline: () => void;
}

const initialPipelineStages: PipelineStage[] = [
  {
    id: 'upload',
    label: 'Document Upload',
    status: 'waiting',
    description: 'Upload PDF, DOCX, TXT, or Markdown files',
  },
  {
    id: 'extract',
    label: 'Text Extraction',
    status: 'waiting',
    description: 'Extract readable text from documents',
  },
  {
    id: 'chunk',
    label: 'Chunking',
    status: 'waiting',
    description: 'Split text into overlapping passages',
  },
  {
    id: 'embed',
    label: 'Embedding',
    status: 'waiting',
    description: 'Generate vector representations',
  },
  {
    id: 'index',
    label: 'Indexing',
    status: 'waiting',
    description: 'Store vectors in FAISS index',
  },
  {
    id: 'query',
    label: 'Query Processing',
    status: 'waiting',
    description: 'Process user question',
  },
  {
    id: 'retrieve',
    label: 'Retrieval',
    status: 'waiting',
    description: 'Find relevant passages',
  },
  {
    id: 'rerank',
    label: 'Reranking',
    status: 'waiting',
    description: 'Improve ranking with cross-encoder',
  },
  {
    id: 'augment',
    label: 'Context Augmentation',
    status: 'waiting',
    description: 'Build prompt with retrieved context',
  },
  {
    id: 'generate',
    label: 'LLM Generation',
    status: 'waiting',
    description: 'Generate answer with sources',
  },
];

export const useRAGStore = create<RAGStore>((set) => ({
  // Initial state
  documents: [],
  currentDocument: null,
  chunks: [],
  
  pipelineStatus: null,
  pipelineStages: initialPipelineStages,
  events: [],
  
  chunkingConfig: {
    chunk_size: 500,
    overlap: 50,
    strategy: 'recursive',
  },
  retrievalMethod: 'dense',
  topK: 5,
  useReranking: false,
  alpha: 0.5,
  
  queries: [],
  currentQuery: null,
  isQuerying: false,
  
  teachingMode: false,
  teachingSteps: [],
  currentStepIndex: 0,
  selectedChunkId: null,
  selectedStage: null,
  
  // Actions
  setDocuments: (documents) => set({ documents }),
  
  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document],
    currentDocument: document,
  })),
  
  setCurrentDocument: (document) => set({ currentDocument: document }),
  
  setChunks: (chunks) => set({ chunks }),
  
  setPipelineStatus: (status) => set({ pipelineStatus: status }),
  
  updateStageStatus: (stageId, status) => set((state) => ({
    pipelineStages: state.pipelineStages.map((stage) =>
      stage.id === stageId ? { ...stage, status } : stage
    ),
  })),
  
  addEvent: (event) => set((state) => ({
    events: [...state.events, event],
  })),
  
  setEvents: (events) => set({ events }),
  
  clearEvents: () => set({ events: [] }),
  
  setChunkingConfig: (config) => set((state) => ({
    chunkingConfig: { ...state.chunkingConfig, ...config },
  })),
  
  setRetrievalMethod: (method) => set({ retrievalMethod: method }),
  
  setTopK: (k) => set({ topK: k }),
  
  setUseReranking: (use) => set({ useReranking: use }),
  
  setAlpha: (alpha) => set({ alpha }),
  
  addQuery: (query) => set((state) => ({
    queries: [...state.queries, query],
    currentQuery: query,
  })),
  
  setCurrentQuery: (query) => set({ currentQuery: query }),
  
  setIsQuerying: (isQuerying) => set({ isQuerying }),
  
  setTeachingMode: (enabled) => set({ teachingMode: enabled }),
  
  setTeachingSteps: (steps) => set({ teachingSteps: steps, currentStepIndex: 0 }),
  
  nextTeachingStep: () => set((state) => ({
    currentStepIndex: Math.min(state.currentStepIndex + 1, state.teachingSteps.length - 1),
  })),
  
  previousTeachingStep: () => set((state) => ({
    currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
  })),
  
  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
  
  setSelectedChunkId: (id) => set({ selectedChunkId: id }),
  
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  
  resetPipeline: () => set({
    documents: [],
    currentDocument: null,
    chunks: [],
    pipelineStages: initialPipelineStages,
    events: [],
    queries: [],
    currentQuery: null,
    selectedChunkId: null,
    selectedStage: null,
    currentStepIndex: 0,
  }),
}));
