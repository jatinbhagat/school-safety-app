'use client';

import { useEffect, useState } from 'react';

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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  useEffect(() => {
    fetchIncidents();
  }, []);

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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading incidents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
        <button onClick={fetchIncidents} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
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
  );
}

const getRiskBadgeStyle = (riskLevel: string) => {
  // Defensive check: ensure riskLevel is a valid string
  if (!riskLevel || typeof riskLevel !== 'string') {
    return { backgroundColor: '#e9ecef', color: '#495057' };
  }

  const level = riskLevel.toLowerCase();
  if (level === 'high' || level === 'critical') {
    return { backgroundColor: '#fee', color: '#c00' };
  }
  if (level === 'medium' || level === 'moderate') {
    return { backgroundColor: '#fef3cd', color: '#856404' };
  }
  if (level === 'low') {
    return { backgroundColor: '#d4edda', color: '#155724' };
  }
  return { backgroundColor: '#e9ecef', color: '#495057' };
};

const getStatusBadgeStyle = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'pending') {
    return { backgroundColor: '#fff3cd', color: '#856404' };
  }
  if (s === 'assigned') {
    return { backgroundColor: '#cfe2ff', color: '#084298' };
  }
  if (s === 'resolved') {
    return { backgroundColor: '#d1e7dd', color: '#0f5132' };
  }
  return { backgroundColor: '#e9ecef', color: '#495057' };
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#1a1a1a',
  } as React.CSSProperties,
  exportButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  exportButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  statsBar: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  } as React.CSSProperties,
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.875rem',
    color: '#666',
    fontWeight: '500',
  } as React.CSSProperties,
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1a1a1a',
  } as React.CSSProperties,
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  } as React.CSSProperties,
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
  } as React.CSSProperties,
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#495057',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  tableRow: {
    borderBottom: '1px solid #dee2e6',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  td: {
    padding: '1rem',
    color: '#212529',
  } as React.CSSProperties,
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'capitalize',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.125rem',
    color: '#666',
  } as React.CSSProperties,
  error: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1rem',
    color: '#c00',
    backgroundColor: '#fee',
    borderRadius: '8px',
    marginBottom: '1rem',
  } as React.CSSProperties,
  retryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1rem',
    color: '#999',
  } as React.CSSProperties,
};
