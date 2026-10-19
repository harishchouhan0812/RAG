/**
 * Event Log Component - Real-time pipeline events
 */

import { useEffect, useRef } from 'react';
import { Activity, Trash2 } from 'lucide-react';
import { useRAGStore } from '../../stores/ragStore';
import { apiService } from '../../services/api';
import { formatTimestamp } from '../../lib/utils';

export default function EventLog() {
  const { events, setEvents, clearEvents } = useRAGStore();
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  // Fetch events periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await apiService.getEvents();
        setEvents(result.events);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [setEvents]);

  const handleClear = async () => {
    try {
      await apiService.clearEvents();
      clearEvents();
    } catch (err) {
      console.error('Failed to clear events:', err);
    }
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      document_upload_started: '📤',
      file_validation_passed: '✅',
      document_parsed: '📄',
      chunking_started: '✂️',
      chunking_completed: '✅',
      embedding_started: '✨',
      embedding_completed: '✅',
      indexing_started: '🗄️',
      indexing_completed: '✅',
      query_started: '❓',
      query_embedded: '🎯',
      retrieval_completed: '🔍',
      reranking_completed: '🔄',
      query_completed: '✅',
      pipeline_reset: '🔄',
    };
    return icons[type] || '📌';
  };

  const getEventColor = (type: string) => {
    if (type.includes('started')) return 'text-yellow-400';
    if (type.includes('completed')) return 'text-green-400';
    if (type.includes('failed')) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="h-full flex flex-col glass-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" />
          Event Log
          <span className="text-xs text-gray-400">({events.length})</span>
        </h2>
        <button
          onClick={handleClear}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Clear events"
        >
          <Trash2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Event List */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto scrollbar-custom p-4 space-y-2 text-sm"
      >
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No events yet. Upload a document to begin.
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              className="flex items-start gap-3 hover:bg-white/5 p-2 rounded transition-colors"
            >
              {/* Icon */}
              <span className="text-lg flex-shrink-0">
                {getEventIcon(event.type)}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`font-medium ${getEventColor(event.type)}`}>
                    {event.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                {Object.keys(event.data).length > 0 && (
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    {JSON.stringify(event.data, null, 0)
                      .replace(/[{}]/g, '')
                      .replace(/"/g, '')
                      .slice(0, 100)}
                    {JSON.stringify(event.data).length > 100 && '...'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
