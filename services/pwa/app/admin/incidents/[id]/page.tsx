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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
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
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // For now, simulate incident data since the backend endpoint may not exist
      // In a real app, this would fetch from the API
      const mockIncident: IncidentDetail = {
        id: parseInt(params.id),
        type: 'Bullying Report',
        status: 'pending',
        description: 'Student reported being bullied during lunch break. Multiple incidents observed over past week.',
        location: 'Main cafeteria',
        created_at: new Date().toISOString(),
        ai_meta: {
          severity: 'medium',
          risk_level: 'moderate',
          category: 'bullying',
          confidence: 0.85,
          routing_reason: 'Bullying incidents typically require counselor intervention and administrative oversight.'
        },
        attachments: []
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIncident(mockIncident);
    } catch (err) {
      console.error('Error fetching incident:', err);
      setError('Failed to load incident details');
    } finally {
      setLoading(false);
    }
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
    if (s === 'pending') {
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

  if (error || !incident) {
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
            <p className="text-red-600 text-lg">{error || 'Incident not found'}</p>
            <Link href="/admin" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
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
              {incident.status.toUpperCase()}
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
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Assign to Staff
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Mark Resolved
                </button>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  Request More Info
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  Add Note
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