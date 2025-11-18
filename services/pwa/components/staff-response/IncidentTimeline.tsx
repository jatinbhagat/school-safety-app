'use client';

import { formatDistanceToNow, format } from 'date-fns';

interface TimelineEvent {
  id: number | string;
  event_type: string;
  event_description: string;
  event_data?: any;
  actor_name?: string;
  actor_role?: string;
  actor_type?: 'system' | 'staff' | 'student' | 'admin';
  created_at: string;
}

interface IncidentTimelineProps {
  events: TimelineEvent[];
}

export function IncidentTimeline({ events }: IncidentTimelineProps) {
  const getEventIcon = (eventType: string, actorType?: string) => {
    switch (eventType) {
      case 'created':
        return '📝';
      case 'triaged':
        return '🤖';
      case 'assigned':
      case 'reassigned':
        return '👤';
      case 'accepted':
        return '✋';
      case 'note_added':
        return '💬';
      case 'status_changed':
        return '🔄';
      case 'escalated':
        return '⚠️';
      case 'resolved':
        return '✅';
      case 'closed':
        return '🔒';
      default:
        return actorType === 'system' ? '🤖' : '•';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return 'text-blue-600 bg-blue-100';
      case 'triaged':
        return 'text-purple-600 bg-purple-100';
      case 'assigned':
      case 'reassigned':
      case 'accepted':
        return 'text-indigo-600 bg-indigo-100';
      case 'note_added':
        return 'text-gray-600 bg-gray-100';
      case 'escalated':
        return 'text-orange-600 bg-orange-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'closed':
        return 'text-gray-500 bg-gray-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getEventColor(event.event_type)}`}
            >
              {getEventIcon(event.event_type, event.actor_type)}
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 my-1" />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-6">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-medium text-gray-900">
                {event.event_description}
              </p>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </span>
            </div>

            <p className="text-xs text-gray-500">
              {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
            </p>

            {/* Additional event data */}
            {event.actor_name && (
              <p className="text-xs text-gray-600 mt-1">
                by {event.actor_name}
                {event.actor_role && ` (${event.actor_role})`}
              </p>
            )}

            {event.event_data && event.event_data.resolution_time_minutes && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                Resolved in {event.event_data.resolution_time_minutes} minutes
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
