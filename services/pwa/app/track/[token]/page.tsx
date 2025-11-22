'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TimelineEvent {
  type: string;
  description: string;
  role: string;
  timestamp: string;
}

interface Dispute {
  id: number;
  status: string;
  created_at: string;
  resolved_at?: string;
}

interface Incident {
  id: number;
  category: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  flagged_as_false: boolean;
  false_report_reason?: string;
  false_report_confirmed: boolean;
}

interface TrackingData {
  incident: Incident;
  timeline: TimelineEvent[];
  disputes: Dispute[];
  canDispute: boolean;
}

export default function TrackingPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchTrackingData();
  }, [params.token]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/track/${params.token}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('This tracking link is invalid or expired.');
        } else if (response.status === 400) {
          setError('Invalid tracking token.');
        } else {
          setError('Failed to load report data. Please try again later.');
        }
        setLoading(false);
        return;
      }

      const trackingData = await response.json();
      setData(trackingData);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Failed to load report data. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your report status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Report</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { incident, timeline, disputes, canDispute } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report Status Tracker</h1>
              <p className="text-sm text-gray-500 mt-1">Track your safety report anonymously</p>
            </div>
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              SafelyNotify.com
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Report #{incident.id}</h2>
              <p className="text-sm text-gray-500">Submitted {formatDate(incident.created_at)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(incident.status)}`}>
              {incident.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <p className="text-gray-900">{incident.category}</p>
            </div>

            {incident.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{incident.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
              <p className="text-gray-900">{formatDate(incident.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* False Report Warning */}
        {incident.flagged_as_false && (
          <div className={`rounded-lg border p-6 mb-6 ${
            incident.false_report_confirmed
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className={`h-6 w-6 ${incident.false_report_confirmed ? 'text-red-600' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-medium ${incident.false_report_confirmed ? 'text-red-800' : 'text-yellow-800'}`}>
                  {incident.false_report_confirmed ? 'False Report Confirmed' : 'Report Flagged as Potentially False'}
                </h3>
                {incident.false_report_reason && (
                  <p className={`text-sm mt-2 ${incident.false_report_confirmed ? 'text-red-700' : 'text-yellow-700'}`}>
                    Reason: {incident.false_report_reason}
                  </p>
                )}
                {canDispute && (
                  <div className="mt-4">
                    <Link
                      href={`/dispute/${params.token}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-900 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Submit a Dispute
                    </Link>
                    <p className="text-xs text-yellow-700 mt-2">
                      You have 7 days from the flagging date to dispute this decision.
                    </p>
                  </div>
                )}
                {!canDispute && incident.flagged_as_false && !incident.false_report_confirmed && disputes.length > 0 && (
                  <p className="text-sm text-yellow-700 mt-2">
                    A dispute has been submitted and is under review.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disputes Section */}
        {disputes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Disputes</h3>
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Dispute #{dispute.id}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      dispute.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : dispute.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dispute.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Submitted: {formatDate(dispute.created_at)}
                  </p>
                  {dispute.resolved_at && (
                    <p className="text-sm text-gray-600">
                      Resolved: {formatDate(dispute.resolved_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>

          {timeline.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="relative pl-8 pb-4 last:pb-0">
                  {/* Timeline line */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                  )}

                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow"></div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                      {event.role && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 capitalize">{event.role}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This tracking link is private and unique to your report.</p>
          <p className="mt-1">Do not share this link with anyone unless you trust them.</p>
        </div>
      </div>
    </div>
  );
}
