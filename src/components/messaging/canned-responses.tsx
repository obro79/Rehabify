'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from 'lucide-react';

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface CannedResponsesProps {
  responses: CannedResponse[];
  onSelect: (content: string) => void;
  onAdd?: (response: Omit<CannedResponse, 'id'>) => void;
  onEdit?: (id: string, response: Omit<CannedResponse, 'id'>) => void;
  onDelete?: (id: string) => void;
  isEditable?: boolean;
}

const CATEGORIES = [
  { key: 'encouragement', label: 'Encouragement', color: 'bg-green-100 text-green-700' },
  { key: 'guidance', label: 'Guidance', color: 'bg-blue-100 text-blue-700' },
  { key: 'scheduling', label: 'Scheduling', color: 'bg-purple-100 text-purple-700' },
  { key: 'correction', label: 'Correction', color: 'bg-amber-100 text-amber-700' },
  { key: 'warning', label: 'Warning', color: 'bg-red-100 text-red-700' },
  { key: 'feedback', label: 'Feedback', color: 'bg-teal-100 text-teal-700' },
];

function getCategoryStyle(category: string): string {
  return CATEGORIES.find((c) => c.key === category)?.color || 'bg-stone-100 text-stone-700';
}

export function CannedResponses({
  responses,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  isEditable = true,
}: CannedResponsesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // TODO: Implement edit modal UI using editingId
  const [editingId, setEditingId] = useState<string | null>(null);
  void editingId; // Suppress unused warning until edit modal is implemented

  // Group responses by category
  const groupedResponses = responses.reduce(
    (acc, response) => {
      const category = response.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(response);
      return acc;
    },
    {} as Record<string, CannedResponse[]>
  );

  const handleSelect = (content: string) => {
    onSelect(content);
    setIsExpanded(false);
  };

  return (
    <div className="border-t border-stone-200/60">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-stone-50/80 hover:bg-stone-100/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-stone-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="text-sm font-medium text-stone-700">Quick Replies</span>
          <span className="text-xs text-stone-400">({responses.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto bg-white border-t border-stone-100">
          {Object.entries(groupedResponses).map(([category, categoryResponses]) => {
            const categoryInfo = CATEGORIES.find((c) => c.key === category);
            return (
              <div key={category} className="p-3 border-b border-stone-50 last:border-b-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      getCategoryStyle(category)
                    )}
                  >
                    {categoryInfo?.label || category}
                  </span>
                </div>
                <div className="space-y-2">
                  {categoryResponses.map((response) => (
                    <div
                      key={response.id}
                      className={cn(
                        'group relative p-3 rounded-lg border border-stone-100',
                        'hover:border-teal-200 hover:bg-teal-50/50 cursor-pointer',
                        'transition-all duration-200'
                      )}
                      onClick={() => handleSelect(response.content)}
                    >
                      <p className="text-sm text-stone-700 pr-16">{response.content}</p>

                      {/* Edit/Delete buttons */}
                      {isEditable && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {onEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(response.id);
                              }}
                              className="p-1.5 rounded-md hover:bg-stone-200 text-stone-500"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this quick reply?')) {
                                  onDelete(response.id);
                                }
                              }}
                              className="p-1.5 rounded-md hover:bg-red-100 text-stone-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add New Button */}
          {isEditable && onAdd && (
            <button
              onClick={() => {
                // TODO: Open add modal
                const content = prompt('Enter quick reply text:');
                if (content) {
                  onAdd({ title: content.slice(0, 30), content, category: 'guidance' });
                }
              }}
              className="w-full p-3 flex items-center justify-center gap-2 text-sm text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create new template
            </button>
          )}
        </div>
      )}
    </div>
  );
}
