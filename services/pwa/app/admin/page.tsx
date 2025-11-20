'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';

interface Incident {
  id: number;
  type: string;
  status: string;
  created_at: string;
  ai_meta: {
    severity?: string;
    risk_level?: string;
  } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');
  const [institutionSlug, setInstitutionSlug] = useState<string>('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  useEffect(() => {
    fetchUserAndInstitution();
    fetchIncidents();
  }, []);

  const fetchUserAndInstitution = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Get current user
      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!meResponse.ok) {
        router.push('/login');
        return;
      }

      const userData = await meResponse.json();
      setUserName(userData.name);
      setUserRole(userData.role);

      // Get institution details
      const instResponse = await fetch(`${API_BASE_URL}/api/institutions/${userData.institutionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (instResponse.ok) {
        const instData = await instResponse.json();
        setInstitutionName(instData.institution_name);
        setInstitutionSlug(instData.url_slug);
      }
    } catch (err) {
      console.error('Failed to fetch user/institution:', err);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const headers: HeadersInit = {};
      if (ADMIN_TOKEN) {
        headers['X-ADMIN-TOKEN'] = ADMIN_TOKEN;
      }

      const response = await fetch(`${API_BASE_URL}/admin/incidents`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch incidents');
      }
      const data = await response.json();
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const headers: HeadersInit = {};
      if (ADMIN_TOKEN) {
        headers['X-ADMIN-TOKEN'] = ADMIN_TOKEN;
      }

      const response = await fetch(`${API_BASE_URL}/admin/export`, { headers });
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getRiskLevel = (incident: Incident): string => {
    if (incident.ai_meta) {
      const riskLevel = incident.ai_meta.risk_level || incident.ai_meta.severity;
      // Ensure we return a string, handling cases where API might return non-string values
      if (riskLevel && typeof riskLevel === 'string') {
        return riskLevel;
      }
      // Convert to string if it's a number or other type
      if (riskLevel != null) {
        return String(riskLevel);
      }
    }
    return 'N/A';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar
        institutionName={institutionName}
        userRole={userRole}
        userName={userName}
      />
      <Breadcrumbs />

      {loading ? (
        <div style={styles.container}>
          <div style={styles.loading}>Loading dashboard...</div>
        </div>
      ) : error ? (
        <div style={styles.container}>
          <div style={styles.error}>Error: {error}</div>
          <button onClick={fetchIncidents} style={styles.retryButton}>
            Retry
          </button>
        </div>
      ) : (
        <div style={styles.container}>
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/admin/settings"
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-600">Manage institution</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/reporting-config"
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📝
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Reporting Config</h3>
                  <p className="text-sm text-gray-600">Customize kiosk</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/kiosk/${institutionSlug || 'demo'}`}
              target="_blank"
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📱
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Kiosk</h3>
                  <p className="text-sm text-gray-600">Test reporting form</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Existing Dashboard Content */}
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button
          onClick={handleExportCSV}
          disabled={exporting || incidents.length === 0}
          style={{
            ...styles.exportButton,
            ...(exporting || incidents.length === 0 ? styles.exportButtonDisabled : {}),
          }}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Total Incidents:</span>
          <span style={styles.statValue}>{incidents.length}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Pending:</span>
          <span style={styles.statValue}>
            {incidents.filter((i) => i.status === 'pending').length}
          </span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Assigned:</span>
          <span style={styles.statValue}>
            {incidents.filter((i) => i.status === 'assigned').length}
          </span>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Risk Level</th>
              <th style={styles.th}>Created At</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} style={styles.tableRow}>
                <td style={styles.td}>{incident.id}</td>
                <td style={styles.td}>{incident.type}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...getRiskBadgeStyle(getRiskLevel(incident)),
                    }}
                  >
                    {getRiskLevel(incident)}
                  </span>
                </td>
                <td style={styles.td}>{formatDate(incident.created_at)}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...getStatusBadgeStyle(incident.status),
                    }}
                  >
                    {incident.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {incidents.length === 0 && (
        <div style={styles.emptyState}>No incidents found</div>
      )}
        </div>
      )}
    </div>
  );
}

const getRiskBadgeStyle = (riskLevel: string) => {
  // Defensive check: ensure riskLevel is a valid string
  if (!riskLevel || typeof riskLevel !== 'string') {
    return { backgroundColor: '#f3f4f6', color: '#6b7280' };
  }

  const level = riskLevel.toLowerCase();
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
  const s = status.toLowerCase();
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

const styles = {
  container: {
    padding: '2.5rem 1.5rem',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    margin: 0,
    color: '#111827',
    letterSpacing: '-0.025em',
  } as React.CSSProperties,
  exportButton: {
    padding: '0.875rem 1.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  exportButtonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
    opacity: 0.6,
  } as React.CSSProperties,
  statsBar: {
    display: 'flex',
    gap: '1.25rem',
    marginBottom: '2.5rem',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '1.25rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
  } as React.CSSProperties,
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    flex: '1',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.9375rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em',
  } as React.CSSProperties,
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-0.025em',
  } as React.CSSProperties,
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '1.25rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  } as React.CSSProperties,
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  } as React.CSSProperties,
  th: {
    padding: '1.125rem 1.25rem',
    textAlign: 'left' as const,
    fontWeight: '700',
    color: '#374151',
    fontSize: '0.8125rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.15s ease',
  } as React.CSSProperties,
  td: {
    padding: '1.125rem 1.25rem',
    color: '#111827',
    fontSize: '0.9375rem',
  } as React.CSSProperties,
  badge: {
    padding: '0.375rem 0.875rem',
    borderRadius: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: '600',
    textTransform: 'capitalize' as const,
    display: 'inline-block',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center' as const,
    padding: '4rem',
    fontSize: '1.125rem',
    color: '#6b7280',
    fontWeight: '500',
  } as React.CSSProperties,
  error: {
    textAlign: 'center' as const,
    padding: '2rem',
    fontSize: '1rem',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderRadius: '1rem',
    marginBottom: '1.5rem',
    border: '1px solid #fecaca',
    fontWeight: '500',
  } as React.CSSProperties,
  retryButton: {
    padding: '0.875rem 1.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '4rem',
    fontSize: '1.0625rem',
    color: '#9ca3af',
    fontWeight: '500',
  } as React.CSSProperties,
};
