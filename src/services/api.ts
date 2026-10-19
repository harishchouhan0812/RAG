/**
 * API service for communicating with FastAPI backend
 */

import axios from 'axios';
import type {
  Document,
  Chunk,
  ChunkingConfig,
  QueryRequest,
  QueryResponse,
  PipelineStatus,
  PipelineEvent,
  EvaluationMetrics,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for LLM operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  async healthCheck() {
    const response = await api.get('/');
    return response.data;
  },

  // Get pipeline status
  async getPipelineStatus(): Promise<PipelineStatus> {
    const response = await api.get('/pipeline/status');
    return response.data;
  },

  // Upload document
  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Chunk document
  async chunkDocument(
    docId: string,
    config: ChunkingConfig
  ): Promise<{ doc_id: string; chunks: Chunk[]; chunk_count: number; config: ChunkingConfig }> {
    const response = await api.post(`/documents/${docId}/chunk`, config);
    return response.data;
  },

  // Generate embeddings
  async generateEmbeddings(docId: string): Promise<{
    doc_id: string;
    embeddings: Array<{ chunk_id: string; dimension: number; preview: number[] }>;
    model: string;
    dimension: number;
  }> {
    const response = await api.post(`/embeddings/generate?doc_id=${docId}`);
    return response.data;
  },

  // Build index
  async buildIndex(docId: string): Promise<{
    doc_id: string;
    indexed_count: number;
    total_index_size: number;
    dimension: number;
  }> {
    const response = await api.post(`/index/build?doc_id=${docId}`);
    return response.data;
  },

  // Execute query
  async executeQuery(request: QueryRequest): Promise<QueryResponse> {
    const response = await api.post('/query', request);
    return response.data;
  },

  // Get all chunks
  async getAllChunks(): Promise<{ chunks: Chunk[] }> {
    const response = await api.get('/chunks');
    return response.data;
  },

  // Get specific chunk
  async getChunk(chunkId: string): Promise<{
    chunk: Chunk;
    embedding: {
      dimension: number;
      preview: number[];
      model: string;
    } | null;
  }> {
    const response = await api.get(`/chunks/${chunkId}`);
    return response.data;
  },

  // Get events
  async getEvents(): Promise<{ events: PipelineEvent[] }> {
    const response = await api.get('/events');
    return response.data;
  },

  // Clear events
  async clearEvents(): Promise<{ status: string }> {
    const response = await api.post('/events/clear');
    return response.data;
  },

  // Reset pipeline
  async resetPipeline(): Promise<{ status: string; message: string }> {
    const response = await api.post('/reset');
    return response.data;
  },

  // Evaluate retrieval
  async evaluateRetrieval(
    retrievedChunks: string[],
    relevantChunks: string[],
    kValues: number[] = [1, 3, 5, 10]
  ): Promise<EvaluationMetrics> {
    const response = await api.post('/evaluate', {
      retrieved_chunks: retrievedChunks,
      relevant_chunks: relevantChunks,
      k_values: kValues,
    });
    return response.data;
  },
};

export default apiService;
