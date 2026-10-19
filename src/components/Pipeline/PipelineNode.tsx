/**
 * Custom Pipeline Node Component for React Flow
 */

import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import { 
  Upload, 
  FileText, 
  Scissors, 
  Sparkles, 
  Database, 
  Search,
  Filter,
  Layers,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn, getStatusColor, getStatusIcon } from '../../lib/utils';
import type { PipelineStage } from '../../types';

interface PipelineNodeProps {
  data: PipelineStage;
}

const iconMap: Record<string, LucideIcon> = {
  upload: Upload,
  extract: FileText,
  chunk: Scissors,
  embed: Sparkles,
  index: Database,
  query: MessageSquare,
  retrieve: Search,
  rerank: Filter,
  augment: Layers,
  generate: MessageSquare,
};

const PipelineNode = memo(({ data }: PipelineNodeProps) => {
  const Icon = iconMap[data.id] || FileText;
  const statusClasses = getStatusColor(data.status);

  return (
    <div
      className={cn(
        'glass-panel px-4 py-3 min-w-[200px] transition-all duration-300 cursor-pointer',
        'hover:scale-105 hover:shadow-2xl',
        data.status === 'processing' && 'glow-effect',
        data.status === 'completed' && 'border-green-500/50',
        data.status === 'failed' && 'border-red-500/50'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary-500 border-2 border-white"
      />

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            'p-2 rounded-lg border',
            statusClasses,
            data.status === 'processing' && 'animate-pulse'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm">{data.label}</h3>
            {data.status === 'processing' && (
              <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
            )}
            {data.status === 'completed' && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            {data.status === 'failed' && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            {data.status === 'waiting' && (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{data.description}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-2">
        <span
          className={cn(
            'inline-block text-xs px-2 py-1 rounded-full border font-medium',
            statusClasses
          )}
        >
          {getStatusIcon(data.status)} {data.status}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-accent-500 border-2 border-white"
      />
    </div>
  );
});

PipelineNode.displayName = 'PipelineNode';

export default PipelineNode;
