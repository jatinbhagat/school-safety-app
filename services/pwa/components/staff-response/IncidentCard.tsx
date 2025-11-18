'use client';

import { StatusBadge } from './StatusBadge';
import { PriorityIndicator } from './PriorityIndicator';
import { formatDistanceToNow } from 'date-fns';

interface IncidentCardProps {
  incident: {
    id: number | string;
    type: string;
    description?: string;
    location?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'pending' | 'triaged' | 'assigned';
    priority: 'critical' | 'high' | 'medium' | 'low';
    created_at: string;
    assigned_to?: string;
    ai_confidence?: number;
    recommended_role?: string;
  };
  onClick?: () => void;
  showActions?: boolean;
  onAccept?: () => void;
}

export function IncidentCard({ incident, onClick, showActions = true, onAccept }: IncidentCardProps) {
  const getCategoryDisplay = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">#{incident.id}</span>
          <StatusBadge status={incident.status} size="sm" />
        </div>
        <PriorityIndicator priority={incident.priority} size="sm" />
      </div>

      {/* Content */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            {getCategoryDisplay(incident.type)}
          </span>
          {incident.location && (
            <span className="text-gray-500">📍 {incident.location}</span>
          )}
        </div>

        {incident.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {truncateText(incident.description, 100)}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Reported {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
          </span>
          {incident.assigned_to && (
            <span className="font-medium">
              Assigned: {incident.assigned_to}
            </span>
          )}
        </div>
      </div>

      {/* AI Recommendation */}
      {incident.ai_confidence && incident.recommended_role && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-2 mb-3">
          <p className="text-xs text-purple-700">
            🤖 AI: {incident.recommended_role} ({Math.round(incident.ai_confidence * 100)}% confidence)
          </p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="flex-1 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-md transition-colors"
          >
            📖 View Details
          </button>
          {incident.status === 'open' && onAccept && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              className="flex-1 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-md transition-colors"
            >
              ✅ Accept
            </button>
          )}
        </div>
      )}
    </div>
  );
}
