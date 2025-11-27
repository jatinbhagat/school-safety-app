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
    category?: string;
  } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');
  const [institutionSlug, setInstitutionSlug] = useState<string>('');
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    riskLevel: '',
    category: '',
    dateRange: '',
    searchTerm: ''
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchUserAndInstitution();
    fetchIncidents();
  }, []);

  // Apply filters whenever incidents or filters change
  useEffect(() => {
    applyFilters();
  }, [incidents, filters]);

  const applyFilters = () => {
    let filtered = [...incidents];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(incident => 
        incident.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Filter by risk level
    if (filters.riskLevel) {
      filtered = filtered.filter(incident => {
        const riskLevel = getRiskLevel(incident).toLowerCase();
        return riskLevel === filters.riskLevel.toLowerCase();
      });
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(incident => 
        incident.type.toLowerCase().includes(filters.category.toLowerCase()) ||
        incident.ai_meta?.category?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.dateRange) {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(incident => 
        new Date(incident.created_at) >= cutoffDate
      );
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(incident => 
        incident.type.toLowerCase().includes(searchLower) ||
        incident.status.toLowerCase().includes(searchLower) ||
        incident.id.toString().includes(searchLower) ||
        getRiskLevel(incident).toLowerCase().includes(searchLower)
      );
    }

    setFilteredIncidents(filtered);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      riskLevel: '',
      category: '',
      dateRange: '',
      searchTerm: ''
    });
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

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
      const institutionId = userData.institution?.id || userData.institutionId;
      const instResponse = await fetch(`${API_BASE_URL}/api/institutions/${institutionId}`, {
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
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/incidents`, { headers });
      
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch incidents');
      }
      
      const data = await response.json();
      setIncidents(data);
      
      console.log(`[Security] Loaded ${data.length} incidents for current institution`);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };

      // Use the secure export endpoint (we'll need to create this)
      const response = await fetch(`${API_BASE_URL}/api/admin/export`, { headers });
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents-export-${institutionName || 'institution'}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('[Security] Exported incidents CSV for current institution only');
    } catch (err) {
      console.error('Export error:', err);
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getRiskLevel = (incident: Incident): string => {
    // First try the ai_meta fields
    if (incident.ai_meta) {
      const riskLevel = incident.ai_meta.risk_level || incident.ai_meta.severity;
      // Ensure we return a string, handling cases where API might return non-string values
      if (riskLevel && typeof riskLevel === 'string' && riskLevel.toLowerCase() !== 'null') {
        return riskLevel;
      }
      // Convert to string if it's a number or other type
      if (riskLevel != null && riskLevel !== 'null') {
        return String(riskLevel);
      }
    }

    // Fallback: Estimate risk level based on incident type
    const type = incident.type?.toLowerCase() || '';
    
    // High risk keywords
    if (type.includes('weapon') || type.includes('violence') || type.includes('assault') || 
        type.includes('threat') || type.includes('emergency') || type.includes('fight')) {
      return 'High';
    }
    
    // Medium risk keywords  
    if (type.includes('bullying') || type.includes('harassment') || type.includes('drug') || 
        type.includes('vandalism') || type.includes('intimidation') || type.includes('discrimination')) {
      return 'Medium';
    }
    
    // Low risk keywords
    if (type.includes('theft') || type.includes('property') || type.includes('noise') || 
        type.includes('parking') || type.includes('minor') || type.includes('suggestion')) {
      return 'Low';
    }
    
    // Default for unknown types
    return 'Medium';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar
        institutionName={institutionName}
        institutionSlug={institutionSlug}
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

      {/* Filters */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search incidents..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => updateFilter('riskLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="bullying">Bullying</option>
              <option value="violence">Violence</option>
              <option value="drugs">Drugs</option>
              <option value="weapon">Weapons</option>
              <option value="harassment">Harassment</option>
              <option value="vandalism">Vandalism</option>
              <option value="theft">Theft</option>
              <option value="safety">Safety Concern</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.status || filters.riskLevel || filters.category || filters.dateRange || filters.searchTerm) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                Status: {filters.status}
                <button
                  onClick={() => updateFilter('status', '')}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >×</button>
              </span>
            )}
            {filters.riskLevel && (
              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                Risk: {filters.riskLevel}
                <button
                  onClick={() => updateFilter('riskLevel', '')}
                  className="ml-1 text-red-500 hover:text-red-700"
                >×</button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Category: {filters.category}
                <button
                  onClick={() => updateFilter('category', '')}
                  className="ml-1 text-green-500 hover:text-green-700"
                >×</button>
              </span>
            )}
            {filters.dateRange && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                Date: {filters.dateRange}
                <button
                  onClick={() => updateFilter('dateRange', '')}
                  className="ml-1 text-purple-500 hover:text-purple-700"
                >×</button>
              </span>
            )}
            {filters.searchTerm && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                Search: {filters.searchTerm}
                <button
                  onClick={() => updateFilter('searchTerm', '')}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >×</button>
              </span>
            )}
          </div>
        )}
      </div>

      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Total Incidents:</span>
          <span style={styles.statValue}>{incidents.length}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Showing:</span>
          <span style={styles.statValue}>{filteredIncidents.length}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Pending:</span>
          <span style={styles.statValue}>
            {filteredIncidents.filter((i) => i.status === 'pending').length}
          </span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Assigned:</span>
          <span style={styles.statValue}>
            {filteredIncidents.filter((i) => i.status === 'assigned').length}
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
            {filteredIncidents.map((incident) => (
              <tr 
                key={incident.id} 
                style={{
                  ...styles.tableRow,
                  cursor: 'pointer'
                }}
                className="hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/admin/incidents/${incident.id}`)}
              >
                <td style={{...styles.td, color: '#3b82f6', fontWeight: '600'}}>
                  #{incident.id}
                </td>
                <td style={styles.td}>
                  {incident.type}
                  {incident.ai_meta?.category && (
                    <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '2px'}}>
                      {incident.ai_meta.category}
                    </div>
                  )}
                </td>
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
        <div style={styles.emptyState}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>No incidents yet</div>
            <div style={{ fontSize: '1rem', color: '#6b7280' }}>Get started by testing your kiosk or waiting for reports to come in.</div>
          </div>
          <Link
            href={`/kiosk/${institutionSlug || 'demo'}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span>📱</span>
            Test Kiosk & Add Incident
          </Link>
        </div>
      )}

      {incidents.length > 0 && filteredIncidents.length === 0 && (
        <div style={styles.emptyState}>
          No incidents match the current filters. Try adjusting your search criteria.
        </div>
      )}
        </div>
      )}
    </div>
  );
}

const getRiskBadgeStyle = (riskLevel: string) => {
  // Defensive check: ensure riskLevel is a valid string
  if (!riskLevel || typeof riskLevel !== 'string') {
    return { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' };
  }

  const level = riskLevel.toLowerCase();
  
  // Critical/High risk - Red
  if (level === 'high' || level === 'critical') {
    return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
  }
  
  // Medium/Moderate risk - Orange/Yellow
  if (level === 'medium' || level === 'moderate') {
    return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
  }
  
  // Low risk - Green
  if (level === 'low') {
    return { backgroundColor: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' };
  }
  
  // N/A or unknown - Light blue to distinguish from unassigned gray
  if (level === 'n/a' || level === 'na' || level === 'null' || level === 'unknown') {
    return { backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #c7d2fe' };
  }
  
  // Default fallback - Gray
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
