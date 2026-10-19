/**
 * Query Interface Component - Ask questions and see results
 */

import { useState } from 'react';
import { Send, Loader2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useRAGStore } from '../../stores/ragStore';
import { apiService } from '../../services/api';
import { cn, formatTime, similarityToPercentage } from '../../lib/utils';

export default function QueryInterface() {
  const {
    currentQuery,
    isQuerying,
    retrievalMethod,
    topK,
    useReranking,
    alpha,
    setIsQuerying,
    addQuery,
    updateStageStatus,
  } = useRAGStore();

  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;

    setError(null);
    setIsQuerying(true);
    updateStageStatus('query', 'processing');

    try {
      const response = await apiService.executeQuery({
        query: query.trim(),
        top_k: topK,
        retrieval_method: retrievalMethod,
        alpha,
        use_reranking: useReranking,
        context_limit: 3,
      });

      addQuery(response);
      updateStageStatus('query', 'completed');
      updateStageStatus('retrieve', 'completed');
      if (useReranking) {
        updateStageStatus('rerank', 'completed');
      }
      updateStageStatus('augment', 'completed');
      updateStageStatus('generate', 'completed');

      setQuery('');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Query failed');
      updateStageStatus('query', 'failed');
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="h-full flex flex-col glass-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent-400" />
          Query Interface
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {expanded && (
        <>
          {/* Query Form */}
          <div className="p-4 border-b border-white/10">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your documents..."
                disabled={isQuerying}
                className="flex-1 glass-panel px-4 py-2 text-sm text-white rounded-lg border border-white/20 focus:border-primary-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!query.trim() || isQuerying}
                className={cn(
                  'glass-button px-6 flex items-center gap-2',
                  (!query.trim() || isQuerying) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isQuerying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Querying...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Ask
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto scrollbar-custom p-4">
            {currentQuery ? (
              <div className="space-y-4">
                {/* Question */}
                <div className="glass-panel p-4 border-l-4 border-accent-500">
                  <div className="text-xs text-gray-400 mb-2">Question</div>
                  <div className="text-white font-medium">{currentQuery.query}</div>
                </div>

                {/* Answer */}
                <div className="glass-panel p-4 border-l-4 border-green-500">
                  <div className="text-xs text-gray-400 mb-2">Answer</div>
                  <div className="text-white whitespace-pre-wrap">{currentQuery.answer}</div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                    <span>⏱️ {formatTime(currentQuery.metrics.total_time)}</span>
                    <span>📄 {currentQuery.metrics.context_chunks} chunks used</span>
                    <span>🔍 {currentQuery.metrics.retrieval_method}</span>
                    {currentQuery.metrics.reranking_used && <span>🔄 reranked</span>}
                  </div>
                </div>

                {/* Retrieved Chunks */}
                <div>
                  <div className="text-sm font-semibold text-gray-300 mb-2">
                    Retrieved Chunks ({currentQuery.retrieved_chunks.length})
                  </div>
                  <div className="space-y-2">
                    {currentQuery.retrieved_chunks.map((chunk, index) => (
                      <div
                        key={index}
                        className="glass-panel p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-primary-400">
                            Rank #{chunk.rank}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              Score: {similarityToPercentage(chunk.score)}%
                            </span>
                            {chunk.rerank_score && (
                              <span className="text-xs text-accent-400">
                                (reranked: {similarityToPercentage(chunk.rerank_score)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-3">{chunk.text}</p>
                        {chunk.metadata && (
                          <div className="mt-2 text-xs text-gray-500">
                            {String(chunk.metadata.document ?? '')} • Chunk {String(chunk.metadata.chunk_index ?? '')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No queries yet. Upload a document and ask a question!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
