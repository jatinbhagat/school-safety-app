'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Incident {
  id: number;
  category: string;
  status: string;
  flagged_as_false: boolean;
  false_report_reason?: string;
  false_report_confirmed: boolean;
}

interface TrackingData {
  incident: Incident;
  canDispute: boolean;
}

export default function DisputePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [disputeReason, setDisputeReason] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [additionalEvidence, setAdditionalEvidence] = useState('');

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
        } else {
          setError('Failed to load report data.');
        }
        setLoading(false);
        return;
      }

      const trackingData = await response.json();
      setData(trackingData);

      // Check if dispute is allowed
      if (!trackingData.canDispute) {
        if (trackingData.incident.false_report_confirmed) {
          setError('This report has already been confirmed as false. Disputes are no longer allowed.');
        } else if (!trackingData.incident.flagged_as_false) {
          setError('This report has not been flagged as false.');
        } else {
          setError('A dispute has already been submitted for this report.');
        }
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!disputeReason.trim()) {
      alert('Please provide a reason for your dispute.');
      return;
    }

    if (disputeReason.length > 2000) {
      alert('Dispute reason must be less than 2000 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/dispute/${params.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dispute_reason: disputeReason,
          contact_info: contactInfo || null,
          additional_evidence: additionalEvidence || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Failed to submit dispute');
        return;
      }

      setSuccess(true);
      setDisputeReason('');
      setContactInfo('');
      setAdditionalEvidence('');

      // Redirect to tracking page after 3 seconds
      setTimeout(() => {
        router.push(`/track/${params.token}`);
      }, 3000);
    } catch (err) {
      console.error('Error submitting dispute:', err);
      setError('Failed to submit dispute. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Submit Dispute</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/track/${params.token}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Report Status
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dispute Submitted Successfully</h1>
          <p className="text-gray-600 mb-6">
            Your dispute has been submitted and will be reviewed by an administrator. You will be notified once a decision is made.
          </p>
          <p className="text-sm text-gray-500">Redirecting to report status...</p>
        </div>
      </div>
    );
  }

  const { incident, canDispute } = data!;

  if (!canDispute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cannot Submit Dispute</h1>
          <p className="text-gray-600 mb-6">{error || 'This report is not eligible for disputes.'}</p>
          <Link
            href={`/track/${params.token}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Report Status
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/track/${params.token}`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block"
          >
            ← Back to Report Status
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Submit Dispute</h1>
          <p className="text-sm text-gray-500 mt-1">Report #{incident.id}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Why was this flagged?</h3>
              {incident.false_report_reason && (
                <p className="text-sm text-yellow-700 mt-2">{incident.false_report_reason}</p>
              )}
              <p className="text-sm text-yellow-700 mt-2">
                If you believe this flag is incorrect, please submit a dispute with your explanation.
                Disputes must be submitted within 7 days of the flag date.
              </p>
            </div>
          </div>
        </div>

        {/* Dispute Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dispute Reason */}
            <div>
              <label htmlFor="disputeReason" className="block text-sm font-medium text-gray-700 mb-2">
                Why do you believe this flag is incorrect? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="disputeReason"
                rows={6}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please explain why you believe your report is accurate..."
                required
                maxLength={2000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {disputeReason.length}/2000 characters
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information (Optional)
              </label>
              <input
                id="contactInfo"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email or phone number (if you'd like to be contacted)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Providing contact information may help speed up the review process.
              </p>
            </div>

            {/* Additional Evidence */}
            <div>
              <label htmlFor="additionalEvidence" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Evidence or Context (Optional)
              </label>
              <textarea
                id="additionalEvidence"
                rows={4}
                value={additionalEvidence}
                onChange={(e) => setAdditionalEvidence(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional information, witnesses, or evidence..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !disputeReason.trim()}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
              <Link
                href={`/track/${params.token}`}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Info Footer */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Your dispute will be reviewed by a super administrator</li>
            <li>The review typically takes 3-5 business days</li>
            <li>You'll be notified of the decision via this tracking portal</li>
            <li>If approved, the false report flag will be removed</li>
            <li>If rejected, the flag will remain and may be confirmed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
