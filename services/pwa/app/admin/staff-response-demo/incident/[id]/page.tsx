'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DemoBanner } from '@/components/DemoBanner';
import { StatusBadge } from '@/components/staff-response/StatusBadge';
import { PriorityIndicator } from '@/components/staff-response/PriorityIndicator';
import { IncidentTimeline } from '@/components/staff-response/IncidentTimeline';
import { AIInsightsPanel } from '@/components/staff-response/AIInsightsPanel';
import { StaffNotes } from '@/components/staff-response/StaffNotes';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';

interface Incident {
  id: number | string;
  type: string;
  description?: string;
  location?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
  assigned_to?: string;
  assigned_at?: string;
  assigned_by?: string;
  reporter_name?: string;
  ai_confidence?: number;
  recommended_role?: string;
}

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResolution, setShowResolution] = useState(false);
  const [resolutionType, setResolutionType] = useState<string>('issue_resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    // Simulate API call to fetch incident details
    setTimeout(() => {
      // Demo data
      const demoIncident: Incident = {
        id: incidentId,
        type: 'bullying',
        description:
          'Being bullied in cafeteria by a group of students. This has been happening for the past week. They call me names and exclude me from sitting with them. It makes me feel really bad and I don\'t want to go to lunch anymore.',
        location: 'Cafeteria',
        status: incidentId === 'demo-inc-001' ? 'open' : 'in_progress',
        priority: 'high',
        created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        assigned_to: 'School Counselor',
        assigned_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        assigned_by: 'AI Triage System',
        reporter_name: 'Anonymous',
        ai_confidence: 0.87,
        recommended_role: 'School Counselor',
      };

      const demoTimeline = [
        {
          id: 1,
          event_type: 'created',
          event_description: 'Incident reported by student',
          actor_name: 'Anonymous Student',
          actor_type: 'student',
          created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          event_type: 'triaged',
          event_description: 'AI triaged incident as HIGH priority',
          event_data: { confidence: 0.87, severity: 'high' },
          actor_name: 'AI Triage System',
          actor_type: 'system',
          created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          event_type: 'assigned',
          event_description: 'Incident assigned to School Counselor',
          event_data: { role: 'counselor' },
          actor_name: 'AI Triage System',
          actor_type: 'system',
          created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        },
      ];

      const demoAiRecommendation = {
        recommended_role: 'School Counselor',
        confidence: 0.87,
        priority: 'high',
        reasoning:
          'This incident involves emotional distress and peer conflict. School counselors are trained in conflict resolution, trauma-informed care, and student support. They can conduct individual sessions with the affected student and facilitate mediation with involved parties.',
        routing_method: 'rule_based',
      };

      const demoNotes: any[] = [];

      setIncident(demoIncident);
      setTimeline(demoTimeline);
      setAiRecommendation(demoAiRecommendation);
      setNotes(demoNotes);
      setIsLoading(false);
    }, 500);
  }, [incidentId]);

  const handleAccept = () => {
    if (!incident) return;

    const newEvent = {
      id: timeline.length + 1,
      event_type: 'accepted',
      event_description: 'Jane Smith accepted the incident assignment',
      actor_name: 'Jane Smith',
      actor_role: 'School Counselor',
      actor_type: 'staff',
      created_at: new Date().toISOString(),
    };

    setTimeline([...timeline, newEvent]);
    alert('Assignment accepted! Student will be notified.');
  };

  const handleAddNote = async (noteText: string, noteType: string) => {
    const newNote = {
      id: notes.length + 1,
      note_text: noteText,
      note_type: noteType,
      author_name: 'Jane Smith',
      author_role: 'School Counselor',
      is_internal: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotes([...notes, newNote]);

    const newEvent = {
      id: timeline.length + 1,
      event_type: 'note_added',
      event_description: 'Jane Smith added a note',
      event_data: { note_type: noteType },
      actor_name: 'Jane Smith',
      actor_role: 'School Counselor',
      actor_type: 'staff',
      created_at: new Date().toISOString(),
    };

    setTimeline([...timeline, newEvent]);
  };

  const handleResolve = () => {
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution notes');
      return;
    }

    setIsResolving(true);

    setTimeout(() => {
      if (incident) {
        const createdAt = new Date(incident.created_at);
        const resolvedAt = new Date();
        const resolutionTimeMinutes = Math.round(
          (resolvedAt.getTime() - createdAt.getTime()) / 60000
        );

        const resolutionNote = {
          id: notes.length + 1,
          note_text: `**Resolution:** ${resolutionType.replace(/_/g, ' ')}\n\n${resolutionNotes}`,
          note_type: 'resolution',
          author_name: 'Jane Smith',
          author_role: 'School Counselor',
          is_internal: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setNotes([...notes, resolutionNote]);

        const resolveEvent = {
          id: timeline.length + 1,
          event_type: 'resolved',
          event_description: 'Jane Smith marked incident as resolved',
          event_data: { resolution_type: resolutionType, resolution_time_minutes: resolutionTimeMinutes },
          actor_name: 'Jane Smith',
          actor_role: 'School Counselor',
          actor_type: 'staff',
          created_at: new Date().toISOString(),
        };

        setTimeline([...timeline, resolveEvent]);
        setIncident({ ...incident, status: 'resolved' });
        setIsResolving(false);
        setShowResolution(false);

        alert(
          `Incident resolved successfully!\n\nResolution time: ${resolutionTimeMinutes} minutes\nThis is within the < 1 hour target for high-priority incidents.`
        );
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Incident not found</p>
          <Link
            href="/admin/staff-response-demo?demo=true"
            className="mt-4 inline-block text-purple-600 hover:text-purple-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryDisplay = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const resolutionTimeMinutes = incident.created_at
    ? Math.round((new Date().getTime() - new Date(incident.created_at).getTime()) / 60000)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/staff-response-demo?demo=true"
            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 mb-4"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Incident #{incident.id}
                </h1>
                <StatusBadge status={incident.status} size="lg" />
              </div>
              <p className="text-gray-600">
                {getCategoryDisplay(incident.type)} • Reported{' '}
                {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
              </p>
            </div>
            <PriorityIndicator priority={incident.priority} size="lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Incident Information
              </h2>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Category</dt>
                  <dd className="text-gray-900 mt-1">{getCategoryDisplay(incident.type)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Priority</dt>
                  <dd className="mt-1">
                    <PriorityIndicator priority={incident.priority} size="sm" />
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Location</dt>
                  <dd className="text-gray-900 mt-1">{incident.location || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Reported</dt>
                  <dd className="text-gray-900 mt-1">
                    {format(new Date(incident.created_at), 'MMM d, yyyy h:mm a')}
                    <br />
                    <span className="text-gray-500">
                      ({formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Reporter</dt>
                  <dd className="text-gray-900 mt-1">{incident.reporter_name || 'Anonymous'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={incident.status} size="sm" />
                  </dd>
                </div>
                {incident.assigned_to && (
                  <>
                    <div>
                      <dt className="font-medium text-gray-700">Assigned To</dt>
                      <dd className="text-gray-900 mt-1">{incident.assigned_to}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Assigned At</dt>
                      <dd className="text-gray-900 mt-1">
                        {incident.assigned_at &&
                          format(new Date(incident.assigned_at), 'MMM d, h:mm a')}
                      </dd>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <dt className="font-medium text-gray-700">Target Response Time</dt>
                  <dd className="text-gray-900 mt-1">
                    &lt; 1 hour for high-priority incidents
                    <span className="ml-2 text-sm">
                      (Current: {resolutionTimeMinutes} minutes)
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Description */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Incident Description
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {incident.description || 'No description provided'}
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Incident Timeline
              </h2>
              <IncidentTimeline events={timeline} />
            </div>

            {/* Staff Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Staff Notes & Actions
              </h2>
              <StaffNotes
                notes={notes}
                onAddNote={handleAddNote}
                canAddNotes={incident.status !== 'resolved'}
              />
            </div>

            {/* Resolution Section */}
            {incident.status !== 'resolved' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Mark as Resolved
                </h2>

                {!showResolution ? (
                  <button
                    onClick={() => setShowResolution(true)}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    ✅ Resolve Incident
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution Type
                      </label>
                      <select
                        value={resolutionType}
                        onChange={(e) => setResolutionType(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="issue_resolved">Issue Resolved</option>
                        <option value="referred_to_admin">Referred to Administrator</option>
                        <option value="ongoing_monitoring">Ongoing Monitoring</option>
                        <option value="no_action_needed">No Action Needed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution Notes
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Describe the resolution, actions taken, and outcome..."
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-700">
                        <strong>Time to Resolution:</strong> {resolutionTimeMinutes} minutes
                        {resolutionTimeMinutes < 60 && ' (within 1-hour target ✅)'}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleResolve}
                        disabled={isResolving}
                        className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isResolving ? 'Resolving...' : '✅ Confirm Resolution'}
                      </button>
                      <button
                        onClick={() => setShowResolution(false)}
                        disabled={isResolving}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* AI Insights */}
            <AIInsightsPanel aiRecommendation={aiRecommendation} incident={incident} />

            {/* Action Buttons */}
            {incident.status !== 'resolved' && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>

                {incident.status === 'open' && (
                  <button
                    onClick={handleAccept}
                    className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
                  >
                    ✅ Accept & Start Working
                  </button>
                )}

                <button
                  onClick={() => alert('Contact student feature coming soon')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  📞 Contact Student
                </button>

                <button
                  onClick={() => alert('Notify parent feature coming soon')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  📧 Notify Parent
                </button>

                <button
                  onClick={() => alert('Reassign feature coming soon')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  🔄 Reassign
                </button>

                <button
                  onClick={() => alert('Escalate feature coming soon')}
                  className="w-full px-4 py-2 border border-red-300 text-red-700 font-medium rounded-md hover:bg-red-50 transition-colors"
                >
                  🔴 Escalate
                </button>
              </div>
            )}

            {/* Demo Navigation */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Demo Navigation</h3>
              <p className="text-sm text-purple-700 mb-3">
                This incident was reported via the Kiosk and routed by AI.
              </p>
              <div className="space-y-2">
                <Link
                  href="/kiosk/demo-school?demo=true"
                  className="block text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  ← View Kiosk Demo
                </Link>
                <Link
                  href="/admin/triage-demo?demo=true"
                  className="block text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  ← View Triage Demo
                </Link>
                <Link
                  href="/admin/heatmap-demo?demo=true"
                  className="block text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  View Heatmap Impact →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
