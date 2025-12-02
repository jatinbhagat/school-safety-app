'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';

interface IncidentDetail {
  id: number;
  type: string;
  status: string;
  description?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
  ai_meta: {
    severity?: string;
    risk_level?: string;
    category?: string;
    confidence?: number;
    routing_reason?: string;
  } | null;
  assigned_to?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  attachments?: Array<{
    id: number;
    filename: string;
    url: string;
    type: string;
  }>;
}

interface User {
  name: string;
  role: string;
  institution: {
    institution_name: string;
    url_slug: string;
  };
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Retry utility for API calls
  const retryApiCall = async <T extends any>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry auth errors or client errors (400-499)
        if (lastError.message.includes('401') || lastError.message.includes('403') || lastError.message.includes('404')) {
          throw lastError;
        }
        
        if (attempt === maxRetries) {
          console.error(`API call failed after ${maxRetries} attempts:`, lastError);
          throw lastError;
        }
        
        console.warn(`API call attempt ${attempt} failed, retrying in ${delayMs}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw lastError!;
  };

  useEffect(() => {
    // Reset error state when component mounts or incident ID changes
    setError(null);
    setActionLoading(null);
    
    fetchUser();
    fetchIncident();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchIncident = async () => {
    let response: Response | undefined;
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      response = await fetch(`${API_BASE_URL}/api/admin/incidents/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch incident');
      }

      const incidentData = await response.json();
      setIncident(incidentData);
      setError(null); // Clear any previous errors on successful load
    } catch (err) {
      console.error('Error fetching incident:', err);
      
      // Handle different error scenarios with proper response checking
      if (response) {
        if (response.status === 404) {
          setError('Incident not found or you do not have permission to view it');
        } else if (response.status === 401) {
          setError('Authentication required. Please log in again');
          router.push('/login');
          return;
        } else {
          setError(`Failed to load incident details (${response.status}). Please try again`);
        }
      } else {
        // Network error or no response
        setError('Network error. Please check your connection and try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (newStatus: string, reason: string) => {
    let response: Response | undefined;
    try {
      setActionLoading('status');
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        router.push('/login');
        return;
      }
      
      const requestBody = {
        new_status: newStatus,
        reason: reason,
      };
      
      response = await fetch(`${API_BASE_URL}/api/admin/incidents/${params.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        if (response.status === 401) {
          alert('Session expired. Please log in again.');
          router.push('/login');
          return;
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update status`);
      }

      const responseData = await response.json();
      
      // Try to refresh incident data with retry, but don't fail the whole operation if this fails
      try {
        await retryApiCall(async () => {
          await fetchIncident();
        }, 2, 500);
      } catch (refreshError) {
        console.warn('Warning: Failed to refresh incident data, but status update was successful:', refreshError);
        // Don't set error state here - the main operation succeeded
      }
      
      // Show success feedback
      alert('Status updated successfully!');
      
    } catch (err: any) {
      console.error('Error updating status:', err);
      
      // Provide better error messages based on the error type
      let errorMessage = 'Failed to update incident status. Please try again';
      
      if (response) {
        if (response.status === 400) {
          errorMessage = 'Invalid request. Please check your input and try again';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to modify this incident';
        } else if (response.status === 404) {
          errorMessage = 'Incident not found or you do not have permission to modify it';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later';
        }
      } else {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again';
      }
      
      setError(errorMessage);
      alert(`Error: ${err.message || errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };


  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !statusReason.trim()) return;
    
    await updateIncidentStatus(newStatus, statusReason);
    setShowStatusChange(false);
    setNewStatus('');
    setStatusReason('');
  };

  const getRiskBadgeStyle = (riskLevel: string) => {
    const level = riskLevel?.toLowerCase();
    if (level === 'high' || level === 'critical') {
      return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
    }
    if (level === 'medium' || level === 'moderate') {
      return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
    }
    if (level === 'low') {
      return { backgroundColor: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' };
    }
    return { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' };
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'open') {
      return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
    }
    if (s === 'assigned') {
      return { backgroundColor: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe' };
    }
    if (s === 'resolved') {
      return { backgroundColor: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' };
    }
    return { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' };
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {user && (
          <AdminNavbar
            institutionName={user.institution?.institution_name || ''}
            institutionSlug={user.institution?.url_slug || ''}
            userRole={user.role}
            userName={user.name}
          />
        )}
        <Breadcrumbs />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setError(null);
                  fetchIncident();
                }}
                className="mx-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <Link href="/admin" className="mx-2 inline-block text-blue-600 hover:text-blue-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50">
        {user && (
          <AdminNavbar
            institutionName={user.institution?.institution_name || ''}
            institutionSlug={user.institution?.url_slug || ''}
            userRole={user.role}
            userName={user.name}
          />
        )}
        <Breadcrumbs />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading incident details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <AdminNavbar
          institutionName={user.institution?.institution_name || ''}
          institutionSlug={user.institution?.url_slug || ''}
          userRole={user.role}
          userName={user.name}
        />
      )}
      <Breadcrumbs />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Incident #{incident.id}</h1>
            <p className="text-lg text-gray-600">Incident Details and Management</p>
          </div>
          <div className="flex gap-3">
            <span
              className="px-4 py-2 rounded-lg font-semibold text-sm"
              style={getStatusBadgeStyle(incident.status)}
            >
              {incident.status?.toUpperCase() || 'UNKNOWN'}
            </span>
            {incident.ai_meta?.risk_level && (
              <span
                className="px-4 py-2 rounded-lg font-semibold text-sm"
                style={getRiskBadgeStyle(incident.ai_meta.risk_level)}
              >
                {incident.ai_meta.risk_level.toUpperCase()} RISK
              </span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Incident Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <p className="text-gray-900">{incident.type}</p>
                </div>

                {incident.ai_meta?.category && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900 capitalize">{incident.ai_meta.category}</p>
                  </div>
                )}

                {incident.description && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{incident.description}</p>
                  </div>
                )}

                {incident.location && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                    <p className="text-gray-900">{incident.location}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reported At</label>
                  <p className="text-gray-900">{formatDate(incident.created_at)}</p>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {incident.ai_meta && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">AI Analysis</h2>
                
                <div className="space-y-4">
                  {incident.ai_meta.confidence && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">AI Confidence</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${incident.ai_meta.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(incident.ai_meta.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {incident.ai_meta.routing_reason && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Routing Reasoning</label>
                      <p className="text-gray-900">{incident.ai_meta.routing_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => updateIncidentStatus('assigned', 'Assigned to staff for investigation')}
                  disabled={actionLoading === 'status' || incident.status === 'assigned'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'status' ? 'Assigning...' : 'Assign to Staff'}
                </button>
                <button 
                  onClick={() => updateIncidentStatus('resolved', 'Incident has been resolved')}
                  disabled={actionLoading === 'status' || incident.status === 'resolved'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'status' ? 'Resolving...' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Assignment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Assignment</h3>
              {incident.assigned_to ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {incident.assigned_to.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{incident.assigned_to.name}</p>
                    <p className="text-sm text-gray-600">{incident.assigned_to.role}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Not assigned</p>
              )}
            </div>

            {/* Status Change */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Change Status</h3>
              {!showStatusChange ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Current: <span className="font-semibold capitalize">{incident.status || 'Unknown'}</span></p>
                  <button 
                    onClick={() => setShowStatusChange(true)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Change Status
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStatusChange} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Enter reason for status change..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={actionLoading === 'status' || !newStatus || !statusReason.trim()}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {actionLoading === 'status' ? 'Updating...' : 'Update'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatusChange(false);
                        setNewStatus('');
                        setStatusReason('');
                      }}
                      className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Incident Reported</p>
                    <p className="text-xs text-gray-500">{formatDate(incident.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">AI Analysis Complete</p>
                    <p className="text-xs text-gray-500">{formatDate(incident.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Attachments</h3>
              {incident.attachments && incident.attachments.length > 0 ? (
                <div className="space-y-2">
                  {incident.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{attachment.filename}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No attachments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}