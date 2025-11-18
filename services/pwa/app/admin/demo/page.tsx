'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { enableDemoMode, resetDemoData } from '@/lib/demo';
import DemoTour from '@/components/DemoTour';

interface DemoTile {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

const DEMO_TILES: DemoTile[] = [
  {
    id: 'kiosk',
    title: 'Kiosk Walkthrough',
    description: 'Experience the student-facing anonymous reporting kiosk with offline capabilities',
    icon: '📱',
    route: '/kiosk/demo-school?demo=true',
    color: '#3B82F6',
  },
  {
    id: 'triage',
    title: 'Incident Triage & Routing',
    description: 'See AI-powered incident routing and assignment recommendations',
    icon: '🎯',
    route: '/admin/triage-demo?demo=true',
    color: '#8B5CF6',
  },
  {
    id: 'heatmap',
    title: 'Heatmap & Trends',
    description: 'Visualize incident hotspots and identify patterns across locations',
    icon: '🗺️',
    route: '/admin/heatmap-demo?demo=true',
    color: '#EF4444',
  },
  {
    id: 'safety-score',
    title: 'Safety Score',
    description: 'View comprehensive safety metrics and component breakdowns',
    icon: '📊',
    route: '/admin/safety-score-demo?demo=true',
    color: '#10B981',
  },
  {
    id: 'micro-guides',
    title: 'Micro-Guides',
    description: 'Manage rotating educational content for the kiosk interface',
    icon: '💡',
    route: '/admin/micro-guides-demo?demo=true',
    color: '#F59E0B',
  },
  {
    id: 'full-tour',
    title: 'Full Guided Tour',
    description: 'Complete walkthrough of all features with interactive guides',
    icon: '🎓',
    route: '/admin/demo?tour=true&demo=true',
    color: '#06B6D4',
  },
];

export default function AdminDemoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [startTour, setStartTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true after component mounts on client
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if tour should auto-start
    const tourParam = searchParams?.get('tour');
    if (tourParam === 'true') {
      setStartTour(true);
    }
  }, [searchParams]);

  const handleTileClick = (tile: DemoTile) => {
    // Special handling for Full Guided Tour - just start the tour instead of navigating
    if (tile.id === 'full-tour') {
      setStartTour(true);
      return;
    }

    // Enable demo mode if not already enabled
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('demo_mode', 'true');
      } catch (error) {
        console.error('Error enabling demo mode:', error);
      }
    }

    router.push(tile.route);
  };

  const handleReset = () => {
    setIsResetting(true);
    resetDemoData();

    setTimeout(() => {
      setIsResetting(false);
      setShowResetConfirm(false);
      alert('Demo data has been reset successfully!');
    }, 500);
  };

  const handleRunFullDemo = async () => {
    // Enable demo mode
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('demo_mode', 'true');
      } catch (error) {
        console.error('Error enabling demo mode:', error);
      }
    }

    // Try to call demo runner API
    try {
      const response = await fetch('/api/demo-run', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Demo runner response:', data);

        // Open kiosk in new tab
        window.open('/kiosk/demo-school?demo=true', '_blank');

        // Start tour
        router.push('/admin/demo?tour=true&demo=true');
      } else {
        // Fallback: just open kiosk and show instructions
        window.open('/kiosk/demo-school?demo=true', '_blank');
        alert(
          'Demo Mode Activated!\n\n' +
            '1. Use the kiosk tab to submit a demo report\n' +
            '2. Return here to see it in the admin dashboard\n' +
            '3. Explore each demo tile for specific features'
        );
      }
    } catch (error) {
      // Fallback
      window.open('/kiosk/demo-school?demo=true', '_blank');
      alert(
        'Demo Mode Activated!\n\n' +
          '1. Use the kiosk tab to submit a demo report\n' +
          '2. Return here to see it in the admin dashboard\n' +
          '3. Explore each demo tile for specific features'
      );
    }
  };

  return (
    <div style={styles.container}>
      {/* Demo Tour - Only render on client to avoid hydration errors */}
      {mounted && <DemoTour autoStart={startTour} onComplete={() => setStartTour(false)} />}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>🎭</span>
            Demo Command Center
          </h1>
          <p style={styles.subtitle}>
            Interactive demonstrations of the School Safety App features
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            data-tour="run-demo"
            onClick={handleRunFullDemo}
            style={styles.primaryButton}
          >
            ▶️ Run Full Demo
          </button>
          <button
            onClick={() => router.push('/admin')}
            style={styles.secondaryButton}
          >
            ← Back to Admin
          </button>
        </div>
      </header>

      {/* Demo Tiles Grid */}
      <div data-tour="demo-tiles" style={styles.grid}>
        {DEMO_TILES.map((tile) => (
          <div
            key={tile.id}
            data-tour={`${tile.id}-tile`}
            style={{
              ...styles.tile,
              borderLeft: `4px solid ${tile.color}`,
            }}
            onClick={() => handleTileClick(tile)}
          >
            <div style={styles.tileIcon}>{tile.icon}</div>
            <h2 style={styles.tileTitle}>{tile.title}</h2>
            <p style={styles.tileDescription}>{tile.description}</p>
            <button
              style={{
                ...styles.tileButton,
                backgroundColor: tile.color,
              }}
            >
              Run Demo
            </button>
          </div>
        ))}

        {/* Reset Demo Tile */}
        <div
          style={{
            ...styles.tile,
            borderLeft: '4px solid #6B7280',
          }}
        >
          <div style={styles.tileIcon}>🔄</div>
          <h2 style={styles.tileTitle}>Demo Reset</h2>
          <p style={styles.tileDescription}>
            Clear all demo data and start fresh
          </p>
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              ...styles.tileButton,
              backgroundColor: '#6B7280',
            }}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset Demo'}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowResetConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Reset Demo Data?</h2>
            <p style={styles.modalText}>
              This will clear all demo incidents, settings, and tour progress.
              This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button onClick={handleReset} style={styles.confirmButton}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <h3 style={styles.footerTitle}>Quick Start Guide</h3>
          <ol style={styles.footerList}>
            <li>Click "Run Full Demo" for an automated walkthrough</li>
            <li>Or select individual demo tiles to explore specific features</li>
            <li>Demo mode keeps all data isolated from production</li>
            <li>Use "Demo Reset" to clear and start over</li>
          </ol>
        </div>
      </footer>
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
    marginBottom: '3rem',
  } as React.CSSProperties,
  headerContent: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 0.5rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  } as React.CSSProperties,
  titleIcon: {
    fontSize: '2.5rem',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1.125rem',
    color: '#6B7280',
    margin: 0,
  } as React.CSSProperties,
  headerActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  primaryButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#8B5CF6',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s',
  } as React.CSSProperties,
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  } as React.CSSProperties,
  tile: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column' as const,
  } as React.CSSProperties,
  tileIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  tileTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 0.75rem 0',
  } as React.CSSProperties,
  tileDescription: {
    fontSize: '0.875rem',
    color: '#6B7280',
    lineHeight: '1.5',
    margin: '0 0 1.5rem 0',
    flex: 1,
  } as React.CSSProperties,
  tileButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  footer: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  footerContent: {} as React.CSSProperties,
  footerTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  footerList: {
    margin: 0,
    paddingLeft: '1.5rem',
    color: '#4B5563',
    lineHeight: '1.75',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modal: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  modalText: {
    fontSize: '1rem',
    color: '#6B7280',
    lineHeight: '1.5',
    margin: '0 0 1.5rem 0',
  } as React.CSSProperties,
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  cancelButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: '#E5E7EB',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  confirmButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#EF4444',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
};
