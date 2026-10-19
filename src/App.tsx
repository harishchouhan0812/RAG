/**
 * Main App Component - Explainable RAG Lab
 */

import { useEffect, useState } from 'react';
import { useRAGStore } from './stores/ragStore';
import { apiService } from './services/api';

// Components
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import PipelineVisualization from './components/Pipeline/PipelineVisualization';
import Inspector from './components/Inspector/Inspector';
import EventLog from './components/EventLog/EventLog';
import QueryInterface from './components/Query/QueryInterface';
import TeachingMode from './components/TeachingMode/TeachingMode';
import FailureLab from './components/FailureLab/FailureLab';
import EvaluationDashboard from './components/Evaluation/EvaluationDashboard';
import { Loader2, Activity, BookOpen, AlertTriangle, BarChart3 } from 'lucide-react';
import { cn } from './lib/utils';

type ViewMode = 'pipeline' | 'teaching' | 'failure-lab' | 'evaluation';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const { setPipelineStatus, teachingMode, setTeachingMode } = useRAGStore();

  // Sync teaching mode with view mode
  useEffect(() => {
    if (teachingMode && viewMode !== 'teaching') {
      setViewMode('teaching');
    }
  }, [teachingMode, viewMode]);

  useEffect(() => {
    if (viewMode === 'teaching') {
      setTeachingMode(true);
    } else {
      setTeachingMode(false);
    }
  }, [viewMode, setTeachingMode]);

  useEffect(() => {
    // Initialize app and check backend connection
    const initialize = async () => {
      try {
        // Check backend health
        await apiService.healthCheck();
        
        // Load pipeline status
        const status = await apiService.getPipelineStatus();
        setPipelineStatus(status);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError('Failed to connect to backend. Make sure the server is running on http://localhost:8000');
        setIsLoading(false);
      }
    };

    initialize();
  }, [setPipelineStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold gradient-text mb-2">
            Initializing RAG Pipeline
          </h2>
          <p className="text-gray-400">Loading models and checking backend...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-panel p-8 max-w-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">Connection Error</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <div className="glass-panel bg-gray-800/50 p-4 text-left">
              <p className="text-sm font-mono text-gray-400 mb-2">Quick Fix:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                <li>Open a terminal in the project directory</li>
                <li>Run: <code className="bg-gray-700 px-2 py-1 rounded">cd backend && python main.py</code></li>
                <li>Wait for "RAG Pipeline Ready!" message</li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="glass-button mt-6"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* View Mode Tabs */}
      <div className="glass-panel border-b border-white/10 px-6">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('pipeline')}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-all border-b-2',
              viewMode === 'pipeline'
                ? 'text-primary-400 border-primary-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Pipeline
          </button>
          <button
            onClick={() => setViewMode('teaching')}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-all border-b-2',
              viewMode === 'teaching'
                ? 'text-primary-400 border-primary-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Teaching Mode
          </button>
          <button
            onClick={() => setViewMode('failure-lab')}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-all border-b-2',
              viewMode === 'failure-lab'
                ? 'text-primary-400 border-primary-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Failure Modes Lab
          </button>
          <button
            onClick={() => setViewMode('evaluation')}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-all border-b-2',
              viewMode === 'evaluation'
                ? 'text-primary-400 border-primary-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Evaluation
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conditional Left Sidebar - Only show in pipeline mode */}
        {viewMode === 'pipeline' && <Sidebar />}

        {/* Center Panel - Different views */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'teaching' && <TeachingMode />}
          {viewMode === 'failure-lab' && <FailureLab />}
          {viewMode === 'evaluation' && <EvaluationDashboard />}
          {viewMode === 'pipeline' && (
            <>
              {/* Pipeline Visualization */}
              <div className="flex-1 overflow-hidden">
                <PipelineVisualization />
              </div>

              {/* Query Interface */}
              <div className="h-64 border-t border-white/10">
                <QueryInterface />
              </div>
            </>
          )}
        </main>

        {/* Right Panel - Inspector (only in pipeline mode) */}
        {viewMode === 'pipeline' && <Inspector />}
      </div>

      {/* Bottom Panel - Event Log (only in pipeline mode) */}
      {viewMode === 'pipeline' && (
        <div className="h-48 border-t border-white/10">
          <EventLog />
        </div>
      )}
    </div>
  );
}

export default App;
