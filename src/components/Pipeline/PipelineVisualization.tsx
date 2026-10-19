/**
 * Pipeline Visualization Component - Interactive React Flow diagram
 */

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useRAGStore } from '../../stores/ragStore';
import PipelineNode from './PipelineNode';
import { getStatusColor } from '../../lib/utils';
import type { PipelineStage } from '../../types';

const nodeTypes = {
  pipelineNode: PipelineNode,
};

export default function PipelineVisualization() {
  const { pipelineStages, setSelectedStage } = useRAGStore();

  // Define node positions in a flowing layout
  const initialNodes: Node[] = useMemo(() => [
    {
      id: 'upload',
      type: 'pipelineNode',
      position: { x: 100, y: 50 },
      data: pipelineStages.find((s) => s.id === 'upload') || {},
    },
    {
      id: 'extract',
      type: 'pipelineNode',
      position: { x: 100, y: 180 },
      data: pipelineStages.find((s) => s.id === 'extract') || {},
    },
    {
      id: 'chunk',
      type: 'pipelineNode',
      position: { x: 100, y: 310 },
      data: pipelineStages.find((s) => s.id === 'chunk') || {},
    },
    {
      id: 'embed',
      type: 'pipelineNode',
      position: { x: 400, y: 50 },
      data: pipelineStages.find((s) => s.id === 'embed') || {},
    },
    {
      id: 'index',
      type: 'pipelineNode',
      position: { x: 400, y: 180 },
      data: pipelineStages.find((s) => s.id === 'index') || {},
    },
    {
      id: 'query',
      type: 'pipelineNode',
      position: { x: 700, y: 50 },
      data: pipelineStages.find((s) => s.id === 'query') || {},
    },
    {
      id: 'retrieve',
      type: 'pipelineNode',
      position: { x: 700, y: 180 },
      data: pipelineStages.find((s) => s.id === 'retrieve') || {},
    },
    {
      id: 'rerank',
      type: 'pipelineNode',
      position: { x: 700, y: 310 },
      data: pipelineStages.find((s) => s.id === 'rerank') || {},
    },
    {
      id: 'augment',
      type: 'pipelineNode',
      position: { x: 1000, y: 115 },
      data: pipelineStages.find((s) => s.id === 'augment') || {},
    },
    {
      id: 'generate',
      type: 'pipelineNode',
      position: { x: 1000, y: 245 },
      data: pipelineStages.find((s) => s.id === 'generate') || {},
    },
  ], [pipelineStages]);

  const initialEdges: Edge[] = useMemo(() => [
    // Document processing flow
    {
      id: 'e-upload-extract',
      source: 'upload',
      target: 'extract',
      animated: false,
      style: { stroke: '#0ea5e9', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
    },
    {
      id: 'e-extract-chunk',
      source: 'extract',
      target: 'chunk',
      animated: false,
      style: { stroke: '#0ea5e9', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
    },
    {
      id: 'e-chunk-embed',
      source: 'chunk',
      target: 'embed',
      animated: false,
      style: { stroke: '#0ea5e9', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
    },
    {
      id: 'e-embed-index',
      source: 'embed',
      target: 'index',
      animated: false,
      style: { stroke: '#0ea5e9', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
    },
    
    // Query flow
    {
      id: 'e-query-retrieve',
      source: 'query',
      target: 'retrieve',
      animated: false,
      style: { stroke: '#d946ef', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#d946ef' },
    },
    {
      id: 'e-index-retrieve',
      source: 'index',
      target: 'retrieve',
      animated: false,
      style: { stroke: '#0ea5e9', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
      label: 'Search',
      labelStyle: { fill: '#fff', fontSize: 12 },
      labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 },
    },
    {
      id: 'e-retrieve-rerank',
      source: 'retrieve',
      target: 'rerank',
      animated: false,
      style: { stroke: '#d946ef', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#d946ef' },
    },
    {
      id: 'e-rerank-augment',
      source: 'rerank',
      target: 'augment',
      animated: false,
      style: { stroke: '#d946ef', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#d946ef' },
    },
    {
      id: 'e-augment-generate',
      source: 'augment',
      target: 'generate',
      animated: false,
      style: { stroke: '#d946ef', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#d946ef' },
    },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when pipeline stages change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const stage = pipelineStages.find((s) => s.id === node.id);
        if (stage) {
          return {
            ...node,
            data: stage,
          };
        }
        return node;
      })
    );

    // Animate edges for processing stages
    setEdges((eds) =>
      eds.map((edge) => {
        const sourceStage = pipelineStages.find((s) => s.id === edge.source);
        const targetStage = pipelineStages.find((s) => s.id === edge.target);
        
        const isAnimated = 
          sourceStage?.status === 'processing' || 
          targetStage?.status === 'processing';

        return {
          ...edge,
          animated: isAnimated,
        };
      })
    );
  }, [pipelineStages, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedStage(node.id);
    },
    [setSelectedStage]
  );

  return (
    <div className="w-full h-full relative">
      {/* Title */}
      <div className="absolute top-4 left-4 z-10 glass-panel px-4 py-2">
        <h2 className="text-lg font-bold gradient-text">RAG Pipeline Architecture</h2>
        <p className="text-xs text-gray-400">Click nodes for details</p>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 glass-panel px-4 py-3 space-y-2">
        <div className="text-sm font-semibold text-gray-300 mb-2">Status</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500/50 border border-gray-500" />
          <span className="text-xs text-gray-400">Waiting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500 animate-pulse" />
          <span className="text-xs text-gray-400">Processing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500" />
          <span className="text-xs text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500" />
          <span className="text-xs text-gray-400">Failed</span>
        </div>
        
        <div className="border-t border-white/10 my-2 pt-2">
          <div className="text-sm font-semibold text-gray-300 mb-2">Flow</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-primary-500" />
            <span className="text-xs text-gray-400">Document</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-accent-500" />
            <span className="text-xs text-gray-400">Query</span>
          </div>
        </div>
      </div>

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-transparent"
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="rgba(255,255,255,0.1)" 
        />
        <Controls 
          className="glass-panel border border-white/10"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Statistics Overlay */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel px-4 py-3">
        <div className="grid grid-cols-4 gap-4">
          {(['waiting', 'processing', 'completed', 'failed'] as PipelineStage['status'][]).map((status) => {
            const count = pipelineStages.filter((s) => s.status === status).length;
            return (
              <div key={status} className="text-center">
                <div className={`text-xl font-bold ${getStatusColor(status).split(' ')[0]}`}>
                  {count}
                </div>
                <div className="text-xs text-gray-400 capitalize">{status}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
