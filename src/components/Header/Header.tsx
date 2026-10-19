/**
 * Header Component - App title and status
 */

import { Brain, Activity, Database, Zap } from 'lucide-react';
import { useRAGStore } from '../../stores/ragStore';
import { formatNumber } from '../../lib/utils';

export default function Header() {
  const { pipelineStatus, documents, chunks } = useRAGStore();

  return (
    <header className="glass-panel border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Brain className="w-10 h-10 text-primary-400 animate-pulse-slow" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">
              Explainable RAG Lab
            </h1>
            <p className="text-sm text-gray-400">
              Interactive Teaching & Visualization Platform
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-6">
          {/* Documents */}
          <div className="flex items-center gap-2 glass-panel px-4 py-2">
            <Database className="w-5 h-5 text-primary-400" />
            <div>
              <div className="text-xs text-gray-400">Documents</div>
              <div className="text-lg font-bold text-white">
                {formatNumber(documents.length)}
              </div>
            </div>
          </div>

          {/* Chunks */}
          <div className="flex items-center gap-2 glass-panel px-4 py-2">
            <Activity className="w-5 h-5 text-accent-400" />
            <div>
              <div className="text-xs text-gray-400">Chunks</div>
              <div className="text-lg font-bold text-white">
                {formatNumber(chunks.length)}
              </div>
            </div>
          </div>

          {/* Indexed */}
          {pipelineStatus && (
            <div className="flex items-center gap-2 glass-panel px-4 py-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-xs text-gray-400">Indexed</div>
                <div className="text-lg font-bold text-white">
                  {formatNumber(pipelineStatus.indexed_count)}
                </div>
              </div>
            </div>
          )}

          {/* Model Info */}
          {pipelineStatus && (
            <div className="glass-panel px-4 py-2">
              <div className="text-xs text-gray-400">Embedding Model</div>
              <div className="text-sm font-medium text-white">
                {pipelineStatus.embedding_model}
              </div>
            </div>
          )}

          {/* Pipeline Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400 font-medium">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
