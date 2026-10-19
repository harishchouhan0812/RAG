/**
 * Sidebar Component - Control panel for RAG pipeline
 */

import { useState, useRef } from 'react';
import { 
  Upload, 
  Settings, 
  Sliders, 
  BookOpen, 
  RotateCcw,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useRAGStore } from '../../stores/ragStore';
import { apiService } from '../../services/api';
import { cn } from '../../lib/utils';
import type { ChunkingConfig } from '../../types';

export default function Sidebar() {
  const {
    documents,
    chunkingConfig,
    retrievalMethod,
    topK,
    useReranking,
    alpha,
    teachingMode,
    setChunkingConfig,
    setRetrievalMethod,
    setTopK,
    setUseReranking,
    setAlpha,
    setTeachingMode,
    addDocument,
    setChunks,
    updateStageStatus,
    addEvent,
    resetPipeline,
  } = useRAGStore();

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    updateStageStatus('upload', 'processing');

    try {
      // Upload document
      const doc = await apiService.uploadDocument(file);
      addDocument(doc);
      updateStageStatus('upload', 'completed');
      updateStageStatus('extract', 'completed');

      // Auto-process
      await processDocument(doc.id);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Upload failed');
      updateStageStatus('upload', 'failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processDocument = async (docId: string) => {
    setProcessing(true);
    
    try {
      // Chunk document
      updateStageStatus('chunk', 'processing');
      const chunkResult = await apiService.chunkDocument(docId, chunkingConfig);
      setChunks(chunkResult.chunks);
      updateStageStatus('chunk', 'completed');

      // Generate embeddings
      updateStageStatus('embed', 'processing');
      await apiService.generateEmbeddings(docId);
      updateStageStatus('embed', 'completed');

      // Build index
      updateStageStatus('index', 'processing');
      await apiService.buildIndex(docId);
      updateStageStatus('index', 'completed');

      addEvent({
        type: 'document_processed',
        timestamp: new Date().toISOString(),
        time: Date.now(),
        data: { doc_id: docId, chunks: chunkResult.chunks.length },
      });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Processing failed');
      updateStageStatus('chunk', 'failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset the entire pipeline? All data will be lost.')) return;

    try {
      await apiService.resetPipeline();
      resetPipeline();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return (
    <aside className="w-80 glass-panel border-r border-white/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-400" />
          Control Panel
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-custom p-4 space-y-6">
        {/* Upload Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Document Upload
          </h3>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading || processing}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || processing}
            className={cn(
              'w-full glass-button flex items-center justify-center gap-2',
              (uploading || processing) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Document
              </>
            )}
          </button>

          {error && (
            <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Document List */}
          {documents.length > 0 && (
            <div className="mt-3 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="glass-panel p-3 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {doc.filename}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {doc.word_count.toLocaleString()} words
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Chunking Configuration */}
        <section>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Chunking Config
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Chunk Size: {chunkingConfig.chunk_size}
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={chunkingConfig.chunk_size}
                onChange={(e) => setChunkingConfig({ chunk_size: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Overlap: {chunkingConfig.overlap}
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={chunkingConfig.overlap}
                onChange={(e) => setChunkingConfig({ overlap: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Strategy</label>
              <select
                value={chunkingConfig.strategy}
                onChange={(e) => setChunkingConfig({ strategy: e.target.value as ChunkingConfig['strategy'] })}
                className="w-full glass-panel px-3 py-2 text-sm text-white rounded-lg border border-white/20 focus:border-primary-500 focus:outline-none"
              >
                <option value="recursive">Recursive</option>
                <option value="sentence">Sentence</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>
        </section>

        {/* Retrieval Configuration */}
        <section>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Retrieval Config
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Method</label>
              <select
                value={retrievalMethod}
                onChange={(e) => setRetrievalMethod(e.target.value as 'dense' | 'sparse' | 'hybrid')}
                className="w-full glass-panel px-3 py-2 text-sm text-white rounded-lg border border-white/20 focus:border-primary-500 focus:outline-none"
              >
                <option value="dense">Dense (Semantic)</option>
                <option value="sparse">Sparse (BM25)</option>
                <option value="hybrid">Hybrid (Both)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Top-K: {topK}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {retrievalMethod === 'hybrid' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Alpha (Dense/Sparse): {alpha.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={alpha}
                  onChange={(e) => setAlpha(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reranking"
                checked={useReranking}
                onChange={(e) => setUseReranking(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="reranking" className="text-sm text-gray-300">
                Use Reranking
              </label>
            </div>
          </div>
        </section>

        {/* Teaching Mode */}
        <section>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Learning
          </h3>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="teaching"
              checked={teachingMode}
              onChange={(e) => setTeachingMode(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="teaching" className="text-sm text-gray-300">
              Teaching Mode
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Step-by-step execution with explanations
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleReset}
          className="w-full glass-button flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/20"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Pipeline
        </button>
      </div>
    </aside>
  );
}
