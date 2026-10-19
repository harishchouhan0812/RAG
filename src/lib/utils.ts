/**
 * Utility functions for the application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format time duration
 */
export function formatTime(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  } else if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get status color classes
 */
export function getStatusColor(status: 'waiting' | 'processing' | 'completed' | 'failed'): string {
  const colors = {
    waiting: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
    processing: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    completed: 'text-green-400 bg-green-500/20 border-green-500/30',
    failed: 'text-red-400 bg-red-500/20 border-red-500/30',
  };
  return colors[status];
}

/**
 * Get status icon
 */
export function getStatusIcon(status: 'waiting' | 'processing' | 'completed' | 'failed'): string {
  const icons = {
    waiting: '⏸️',
    processing: '⚙️',
    completed: '✅',
    failed: '❌',
  };
  return icons[status];
}

/**
 * Highlight text matches
 */
export function highlightText(text: string, query: string): string {
  if (!query) return text;
  
  const queryTerms = query.toLowerCase().split(/\s+/);
  let highlighted = text;
  
  queryTerms.forEach((term) => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200">$1</mark>');
  });
  
  return highlighted;
}

/**
 * Calculate similarity percentage
 */
export function similarityToPercentage(score: number): number {
  return Math.round(score * 100);
}

/**
 * Format timestamp
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Download text as file
 */
export function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Extract citations from text
 */
export function extractCitations(text: string): string[] {
  const regex = /\[Source \d+\]/g;
  return text.match(regex) || [];
}

/**
 * Color hash for consistent colors
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Calculate text statistics
 */
export function calculateTextStats(text: string): {
  chars: number;
  words: number;
  sentences: number;
  paragraphs: number;
} {
  return {
    chars: text.length,
    words: text.split(/\s+/).filter(Boolean).length,
    sentences: text.split(/[.!?]+/).filter(Boolean).length,
    paragraphs: text.split(/\n\s*\n/).filter(Boolean).length,
  };
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
