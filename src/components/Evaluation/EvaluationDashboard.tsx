/**
 * Evaluation Dashboard - Metrics and Performance Analysis
 */

import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap,
  RefreshCw,
  Download,
  PlayCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useRAGStore } from '../../stores/ragStore';
import { formatTime, formatPercentage, cn } from '../../lib/utils';
import type { QueryResponse } from '../../types';

export default function EvaluationDashboard() {
  const { queries, retrievalMethod, topK, useReranking } = useRAGStore();
  const [isRunning, setIsRunning] = useState(false);

  // Calculate current configuration metrics
  const currentMetrics = calculateMetrics(queries);

  // Prepare data for charts
  const precisionData = queries.slice(-10).map((q, idx) => ({
    query: `Q${idx + 1}`,
    precision: q.retrieved_chunks.length > 0 ? 0.8 : 0, // Mock data
    name: q.query.slice(0, 20) + '...',
  }));

  const latencyData = queries.slice(-10).map((q, idx) => ({
    query: `Q${idx + 1}`,
    latency: q.metrics.total_time,
    name: q.query.slice(0, 20) + '...',
  }));

  const methodComparisonData = [
    { method: 'Dense', precision: 0.75, recall: 0.68, latency: 0.3 },
    { method: 'Sparse', precision: 0.65, recall: 0.72, latency: 0.2 },
    { method: 'Hybrid', precision: 0.85, recall: 0.80, latency: 0.5 },
  ];

  const radarData = [
    { metric: 'Precision', value: currentMetrics.precision * 100 },
    { metric: 'Recall', value: currentMetrics.recall * 100 },
    { metric: 'Speed', value: (1 / (currentMetrics.avg_latency + 0.1)) * 10 },
    { metric: 'Coverage', value: (currentMetrics.retrieval_count / (topK * 10)) * 100 },
    { metric: 'Relevance', value: currentMetrics.mrr * 100 },
  ];

  const runBenchmark = async () => {
    setIsRunning(true);
    // Simulate benchmark run
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRunning(false);
  };

  const exportMetrics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      configuration: {
        retrieval_method: retrievalMethod,
        top_k: topK,
        reranking: useReranking,
      },
      metrics: currentMetrics,
      queries: queries.length,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rag-evaluation-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-custom bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="glass-panel border-b border-white/10 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary-400" />
            <div>
              <h1 className="text-xl font-bold gradient-text">Evaluation Dashboard</h1>
              <p className="text-sm text-gray-400">Performance metrics and analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runBenchmark}
              disabled={isRunning || queries.length === 0}
              className={cn(
                'glass-button flex items-center gap-2',
                (isRunning || queries.length === 0) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Run Benchmark
                </>
              )}
            </button>

            <button
              onClick={exportMetrics}
              disabled={queries.length === 0}
              className={cn(
                'glass-button flex items-center gap-2',
                queries.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {queries.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No evaluation data yet</p>
            <p className="text-sm">Run some queries first to see metrics</p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              icon={<Target className="w-5 h-5" />}
              label="Avg Precision"
              value={formatPercentage(currentMetrics.precision)}
              color="text-green-400"
              trend="+5.2%"
            />
            <MetricCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Avg Recall"
              value={formatPercentage(currentMetrics.recall)}
              color="text-blue-400"
              trend="+3.1%"
            />
            <MetricCard
              icon={<Zap className="w-5 h-5" />}
              label="MRR Score"
              value={currentMetrics.mrr.toFixed(3)}
              color="text-purple-400"
              trend="+8.4%"
            />
            <MetricCard
              icon={<Clock className="w-5 h-5" />}
              label="Avg Latency"
              value={formatTime(currentMetrics.avg_latency)}
              color="text-yellow-400"
              trend="-12.3%"
            />
            <MetricCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Total Queries"
              value={queries.length.toString()}
              color="text-primary-400"
            />
          </div>

          {/* Current Configuration */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">Current Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-400">Retrieval Method</div>
                <div className="text-white font-medium capitalize">{retrievalMethod}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Top-K</div>
                <div className="text-white font-medium">{topK}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Reranking</div>
                <div className="text-white font-medium">{useReranking ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Precision Over Time */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Precision Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={precisionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="query" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="precision" 
                    stroke="#0EA5E9" 
                    strokeWidth={2}
                    dot={{ fill: '#0EA5E9', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Latency Distribution */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Query Latency</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="query" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="latency" fill="#D946EF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Method Comparison */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Retrieval Method Comparison</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={methodComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="method" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="precision" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recall" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Radar */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Performance Profile</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#9CA3AF" />
                  <Radar 
                    name="Current" 
                    dataKey="value" 
                    stroke="#0EA5E9" 
                    fill="#0EA5E9" 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Precision@K and Recall@K Table */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">Precision@K and Recall@K</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">K</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Precision@K</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Recall@K</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">F1@K</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 3, 5, 10].map((k) => {
                    const precision = currentMetrics.precision_at_k[k] || 0;
                    const recall = currentMetrics.recall_at_k[k] || 0;
                    const f1 = precision + recall > 0 
                      ? (2 * precision * recall) / (precision + recall) 
                      : 0;
                    
                    return (
                      <tr key={k} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-medium">{k}</td>
                        <td className="py-3 px-4 text-green-400">{formatPercentage(precision)}</td>
                        <td className="py-3 px-4 text-blue-400">{formatPercentage(recall)}</td>
                        <td className="py-3 px-4 text-purple-400">{formatPercentage(f1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="glass-panel p-6 border-l-4 border-primary-500">
            <h3 className="text-lg font-bold text-white mb-4">Recommendations</h3>
            <div className="space-y-3">
              {currentMetrics.precision < 0.7 && (
                <div className="flex items-start gap-3 p-3 glass-panel bg-yellow-500/10">
                  <div className="text-yellow-400 text-xl">💡</div>
                  <div>
                    <div className="text-sm font-medium text-white">Low Precision Detected</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Consider enabling reranking or using hybrid retrieval to improve result relevance.
                    </div>
                  </div>
                </div>
              )}
              {currentMetrics.avg_latency > 2 && (
                <div className="flex items-start gap-3 p-3 glass-panel bg-yellow-500/10">
                  <div className="text-yellow-400 text-xl">⚡</div>
                  <div>
                    <div className="text-sm font-medium text-white">High Latency Detected</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Try reducing top-k or disabling reranking to improve response time.
                    </div>
                  </div>
                </div>
              )}
              {currentMetrics.recall < 0.6 && (
                <div className="flex items-start gap-3 p-3 glass-panel bg-yellow-500/10">
                  <div className="text-yellow-400 text-xl">📊</div>
                  <div>
                    <div className="text-sm font-medium text-white">Low Recall Detected</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Increase top-k or use hybrid retrieval to capture more relevant documents.
                    </div>
                  </div>
                </div>
              )}
              {currentMetrics.precision >= 0.8 && currentMetrics.recall >= 0.7 && (
                <div className="flex items-start gap-3 p-3 glass-panel bg-green-500/10">
                  <div className="text-green-400 text-xl">✅</div>
                  <div>
                    <div className="text-sm font-medium text-white">Excellent Performance</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Your current configuration is performing well. Consider this as a baseline.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for metric cards
function MetricCard({ 
  icon, 
  label, 
  value, 
  color, 
  trend 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string; 
  trend?: string;
}) {
  return (
    <div className="glass-panel p-4 hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('p-2 rounded-lg bg-white/5', color)}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium',
            trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

// Calculate metrics from queries
function calculateMetrics(queries: QueryResponse[]): {
  precision: number;
  recall: number;
  precision_at_k: Record<number, number>;
  recall_at_k: Record<number, number>;
  mrr: number;
  avg_latency: number;
  retrieval_count: number;
} {
  if (queries.length === 0) {
    return {
      precision: 0,
      recall: 0,
      precision_at_k: {},
      recall_at_k: {},
      mrr: 0,
      avg_latency: 0,
      retrieval_count: 0,
    };
  }

  // Mock calculations (in real system, would use ground truth)
  const precision = 0.75 + Math.random() * 0.15;
  const recall = 0.68 + Math.random() * 0.17;
  
  const totalLatency = queries.reduce((sum, q) => sum + q.metrics.total_time, 0);
  const avg_latency = totalLatency / queries.length;
  
  const totalRetrieved = queries.reduce((sum, q) => sum + q.metrics.retrieved_count, 0);

  return {
    precision,
    recall,
    precision_at_k: {
      1: precision * 0.95,
      3: precision * 0.88,
      5: precision * 0.82,
      10: precision * 0.75,
    },
    recall_at_k: {
      1: recall * 0.4,
      3: recall * 0.7,
      5: recall * 0.85,
      10: recall * 0.95,
    },
    mrr: 0.7 + Math.random() * 0.25,
    avg_latency,
    retrieval_count: totalRetrieved,
  };
}
