'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_DATA } from '@/lib/demo';
import DemoBanner from '@/components/DemoBanner';

interface Location {
  id: string;
  name: string;
  incidents: number;
  x: number;
  y: number;
}

export default function HeatmapDemoPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [maxIncidents, setMaxIncidents] = useState(0);

  useEffect(() => {
    // Load demo heatmap data
    const heatmapData = DEMO_DATA.heatmap.locations;
    setLocations(heatmapData);

    // Find max incidents for color scaling
    const max = Math.max(...heatmapData.map((loc) => loc.incidents));
    setMaxIncidents(max);
  }, []);

  const getColorIntensity = (incidents: number): string => {
    if (maxIncidents === 0) return '#E5E7EB';

    const intensity = incidents / maxIncidents;

    if (intensity > 0.8) return '#DC2626'; // High - Red
    if (intensity > 0.6) return '#EF4444'; // Medium-High - Light Red
    if (intensity > 0.4) return '#F59E0B'; // Medium - Orange
    if (intensity > 0.2) return '#FBBF24'; // Medium-Low - Yellow
    return '#10B981'; // Low - Green
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
  };

  return (
    <div style={styles.container}>
      <DemoBanner />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={() => router.push('/admin/demo')} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>🗺️</span>
            Incident Heatmap Demo
          </h1>
          <p style={styles.subtitle}>
            Visualize incident hotspots across your school campus
          </p>
        </div>
      </header>

      {/* Stats Overview */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {locations.reduce((sum, loc) => sum + loc.incidents, 0)}
          </div>
          <div style={styles.statLabel}>Total Incidents</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{locations.length}</div>
          <div style={styles.statLabel}>Monitored Locations</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {locations.find((loc) => loc.incidents === maxIncidents)?.name || 'N/A'}
          </div>
          <div style={styles.statLabel}>Highest Activity</div>
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div style={styles.heatmapContainer}>
        <h2 style={styles.sectionTitle}>Campus Heatmap</h2>
        <div style={styles.heatmapGrid}>
          {locations.map((location) => (
            <div
              key={location.id}
              style={{
                ...styles.heatmapCell,
                gridColumn: location.x + 1,
                gridRow: location.y + 1,
                backgroundColor: getColorIntensity(location.incidents),
              }}
              onClick={() => handleLocationClick(location)}
            >
              <div style={styles.cellContent}>
                <div style={styles.cellName}>{location.name}</div>
                <div style={styles.cellIncidents}>{location.incidents}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          <div style={styles.legendTitle}>Incident Frequency</div>
          <div style={styles.legendItems}>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: '#10B981' }}
              />
              <span>Low (0-20%)</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: '#FBBF24' }}
              />
              <span>Medium-Low (20-40%)</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: '#F59E0B' }}
              />
              <span>Medium (40-60%)</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: '#EF4444' }}
              />
              <span>Medium-High (60-80%)</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{ ...styles.legendColor, backgroundColor: '#DC2626' }}
              />
              <span>High (80-100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details */}
      {selectedLocation && (
        <div style={styles.detailsCard}>
          <div style={styles.detailsHeader}>
            <h3 style={styles.detailsTitle}>{selectedLocation.name}</h3>
            <button
              onClick={() => setSelectedLocation(null)}
              style={styles.closeButton}
            >
              ✕
            </button>
          </div>
          <div style={styles.detailsContent}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Incidents:</span>
              <span style={styles.detailValue}>{selectedLocation.incidents}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Severity:</span>
              <span
                style={{
                  ...styles.detailValue,
                  color: getColorIntensity(selectedLocation.incidents),
                  fontWeight: 'bold',
                }}
              >
                {selectedLocation.incidents / maxIncidents > 0.6
                  ? 'High'
                  : selectedLocation.incidents / maxIncidents > 0.3
                  ? 'Medium'
                  : 'Low'}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Recommended Action:</span>
              <span style={styles.detailValue}>
                {selectedLocation.incidents / maxIncidents > 0.6
                  ? 'Increase monitoring & implement targeted intervention'
                  : selectedLocation.incidents / maxIncidents > 0.3
                  ? 'Schedule regular check-ins'
                  : 'Continue current prevention efforts'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div style={styles.insightsCard}>
        <h3 style={styles.insightsTitle}>📊 Key Insights</h3>
        <ul style={styles.insightsList}>
          <li>
            <strong>Cafeteria</strong> shows highest incident count - consider
            increasing supervision during lunch periods
          </li>
          <li>
            <strong>Parking Lot</strong> requires attention - recommend installing
            additional cameras
          </li>
          <li>
            <strong>Library</strong> maintains low incident rate - replicate best
            practices
          </li>
          <li>
            Overall trend shows incidents concentrated in common areas during peak
            hours
          </li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    padding: '2rem',
  } as React.CSSProperties,
  header: {
    marginBottom: '2rem',
  } as React.CSSProperties,
  headerContent: {} as React.CSSProperties,
  backButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    marginBottom: '1rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 0.5rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  titleIcon: {
    fontSize: '2rem',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1rem',
    color: '#6B7280',
    margin: 0,
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  } as React.CSSProperties,
  statCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.875rem',
    color: '#6B7280',
  } as React.CSSProperties,
  heatmapContainer: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 1.5rem 0',
  } as React.CSSProperties,
  heatmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(6, 1fr)',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    minHeight: '400px',
  } as React.CSSProperties,
  heatmapCell: {
    borderRadius: '0.5rem',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  cellContent: {
    textAlign: 'center' as const,
    color: 'white',
  } as React.CSSProperties,
  cellName: {
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,
  cellIncidents: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,
  legend: {
    borderTop: '1px solid #E5E7EB',
    paddingTop: '1.5rem',
  } as React.CSSProperties,
  legendTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  legendItems: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#6B7280',
  } as React.CSSProperties,
  legendColor: {
    width: '1rem',
    height: '1rem',
    borderRadius: '0.25rem',
  } as React.CSSProperties,
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
  } as React.CSSProperties,
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  } as React.CSSProperties,
  detailsTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  } as React.CSSProperties,
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#6B7280',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
  } as React.CSSProperties,
  detailsContent: {} as React.CSSProperties,
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid #F3F4F6',
  } as React.CSSProperties,
  detailLabel: {
    fontSize: '0.875rem',
    color: '#6B7280',
    fontWeight: '500',
  } as React.CSSProperties,
  detailValue: {
    fontSize: '0.875rem',
    color: '#111827',
  } as React.CSSProperties,
  insightsCard: {
    backgroundColor: '#EFF6FF',
    border: '2px solid #3B82F6',
    borderRadius: '0.75rem',
    padding: '1.5rem',
  } as React.CSSProperties,
  insightsTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1E40AF',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  insightsList: {
    margin: 0,
    paddingLeft: '1.5rem',
    color: '#1E3A8A',
    lineHeight: '1.75',
  } as React.CSSProperties,
};
