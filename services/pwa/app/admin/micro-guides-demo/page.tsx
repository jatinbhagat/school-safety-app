'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_DATA } from '@/lib/demo';
import DemoBanner from '@/components/DemoBanner';

interface MicroGuide {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  priority: number;
}

export default function MicroGuidesDemoPage() {
  const router = useRouter();
  const [guides, setGuides] = useState<MicroGuide[]>(DEMO_DATA.microGuides);
  const [selectedGuide, setSelectedGuide] = useState<MicroGuide | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const toggleGuideEnabled = (id: string) => {
    setGuides(
      guides.map((guide) =>
        guide.id === id ? { ...guide, enabled: !guide.enabled } : guide
      )
    );
  };

  const handleGenerateNewGuide = () => {
    const newGuide: MicroGuide = {
      id: `guide-${Date.now()}`,
      title: 'New AI-Generated Guide',
      content:
        'This is a sample micro-guide generated using AI. It provides helpful information to students about safety resources and reporting procedures.',
      enabled: false,
      priority: guides.length + 1,
    };

    setGuides([...guides, newGuide]);
    setSelectedGuide(newGuide);
    setIsEditing(true);

    // Simulate AI generation
    setTimeout(() => {
      alert(
        '✨ AI Micro-Guide Generated!\n\n' +
          'The AI has created a new educational guide based on recent incident patterns and school policies.'
      );
    }, 1000);
  };

  const handleSaveGuide = () => {
    setIsEditing(false);
    alert('Micro-guide saved successfully!');
  };

  return (
    <div style={styles.container}>
      <DemoBanner />

      {/* Header */}
      <header style={styles.header}>
        <button onClick={() => router.push('/admin/demo')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>💡</span>
          Micro-Guides Demo
        </h1>
        <p style={styles.subtitle}>
          Manage rotating educational content for the kiosk interface
        </p>
      </header>

      {/* Actions Bar */}
      <div style={styles.actionsBar}>
        <button onClick={handleGenerateNewGuide} style={styles.primaryButton}>
          ✨ Generate New Guide (AI)
        </button>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          style={styles.secondaryButton}
        >
          {previewMode ? '📝 Edit Mode' : '👁️ Preview Mode'}
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.mainGrid}>
        {/* Guides List */}
        <div style={styles.guidesListCard}>
          <h2 style={styles.cardTitle}>
            Active Guides ({guides.filter((g) => g.enabled).length}/{guides.length})
          </h2>

          <div style={styles.guidesList}>
            {guides.map((guide) => (
              <div
                key={guide.id}
                style={{
                  ...styles.guideItem,
                  backgroundColor:
                    selectedGuide?.id === guide.id ? '#F3F4F6' : 'white',
                }}
                onClick={() => setSelectedGuide(guide)}
              >
                <div style={styles.guideHeader}>
                  <div style={styles.guideTitle}>{guide.title}</div>
                  <label style={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      checked={guide.enabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleGuideEnabled(guide.id);
                      }}
                      style={styles.toggleInput}
                    />
                    <span
                      style={{
                        ...styles.toggleSlider,
                        backgroundColor: guide.enabled ? '#10B981' : '#D1D5DB',
                      }}
                    />
                  </label>
                </div>
                <div style={styles.guidePriority}>Priority: {guide.priority}</div>
                <div style={styles.guidePreview}>
                  {guide.content.substring(0, 80)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guide Editor/Preview */}
        <div style={styles.editorCard}>
          {selectedGuide ? (
            <>
              <div style={styles.editorHeader}>
                <h2 style={styles.cardTitle}>
                  {previewMode ? 'Preview' : 'Edit Guide'}
                </h2>
                {!previewMode && (
                  <button onClick={handleSaveGuide} style={styles.saveButton}>
                    💾 Save
                  </button>
                )}
              </div>

              {previewMode ? (
                // Preview Mode
                <div style={styles.previewContainer}>
                  <div style={styles.kioskPreview}>
                    <div style={styles.kioskHeader}>
                      <div style={styles.kioskLogo}>🛡️ School Safety</div>
                      <div style={styles.kioskStatus}>Demo Kiosk</div>
                    </div>

                    <div style={styles.microGuideCard}>
                      <div style={styles.microGuideIcon}>💡</div>
                      <h3 style={styles.microGuideTitle}>{selectedGuide.title}</h3>
                      <p style={styles.microGuideContent}>{selectedGuide.content}</p>
                    </div>

                    <div style={styles.kioskNote}>
                      This card rotates every 20-30 seconds on the kiosk
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div style={styles.editorForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Title</label>
                    <input
                      type="text"
                      value={selectedGuide.title}
                      onChange={(e) =>
                        setSelectedGuide({ ...selectedGuide, title: e.target.value })
                      }
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Content</label>
                    <textarea
                      value={selectedGuide.content}
                      onChange={(e) =>
                        setSelectedGuide({ ...selectedGuide, content: e.target.value })
                      }
                      rows={6}
                      style={styles.formTextarea}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Priority</label>
                      <input
                        type="number"
                        value={selectedGuide.priority}
                        onChange={(e) =>
                          setSelectedGuide({
                            ...selectedGuide,
                            priority: parseInt(e.target.value),
                          })
                        }
                        style={styles.formInput}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Status</label>
                      <select
                        value={selectedGuide.enabled ? 'enabled' : 'disabled'}
                        onChange={(e) =>
                          setSelectedGuide({
                            ...selectedGuide,
                            enabled: e.target.value === 'enabled',
                          })
                        }
                        style={styles.formInput}
                      >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>💡</div>
              <div style={styles.emptyStateText}>
                Select a guide to edit or preview
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div style={styles.infoPanel}>
        <h3 style={styles.infoPanelTitle}>📚 About Micro-Guides</h3>
        <ul style={styles.infoPanelList}>
          <li>
            <strong>Purpose:</strong> Provide bite-sized educational content to
            students while they use the kiosk
          </li>
          <li>
            <strong>Rotation:</strong> Guides rotate every 20-30 seconds to keep
            content fresh
          </li>
          <li>
            <strong>AI Generation:</strong> Use AI to create guides based on incident
            trends and school policies
          </li>
          <li>
            <strong>Priority:</strong> Higher priority guides appear more frequently
          </li>
          <li>
            <strong>Enable/Disable:</strong> Toggle guides on/off without deleting them
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
  actionsBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '1.5rem',
    marginBottom: '2rem',
  } as React.CSSProperties,
  guidesListCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    height: 'fit-content',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  guidesList: {
    display: 'grid',
    gap: '0.75rem',
  } as React.CSSProperties,
  guideItem: {
    padding: '1rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  guideHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  guideTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111827',
  } as React.CSSProperties,
  toggleContainer: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '44px',
    height: '24px',
  } as React.CSSProperties,
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
  } as React.CSSProperties,
  toggleSlider: {
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '24px',
    transition: '0.3s',
  } as React.CSSProperties,
  guidePriority: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  guidePreview: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
  } as React.CSSProperties,
  editorCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  saveButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10B981',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  previewContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem',
  } as React.CSSProperties,
  kioskPreview: {
    width: '400px',
    backgroundColor: '#F3F4F6',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  kioskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #D1D5DB',
  } as React.CSSProperties,
  kioskLogo: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#111827',
  } as React.CSSProperties,
  kioskStatus: {
    fontSize: '0.75rem',
    color: '#6B7280',
    backgroundColor: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
  } as React.CSSProperties,
  microGuideCard: {
    backgroundColor: '#FEF3C7',
    border: '2px solid #F59E0B',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  microGuideIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  microGuideTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#92400E',
    margin: '0 0 0.75rem 0',
  } as React.CSSProperties,
  microGuideContent: {
    fontSize: '0.875rem',
    color: '#78350F',
    lineHeight: '1.5',
    margin: 0,
  } as React.CSSProperties,
  kioskNote: {
    marginTop: '1rem',
    fontSize: '0.75rem',
    color: '#6B7280',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  } as React.CSSProperties,
  editorForm: {
    display: 'grid',
    gap: '1.5rem',
  } as React.CSSProperties,
  formGroup: {
    display: 'grid',
    gap: '0.5rem',
  } as React.CSSProperties,
  formLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  } as React.CSSProperties,
  formInput: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  formTextarea: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  } as React.CSSProperties,
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  } as React.CSSProperties,
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  emptyStateIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  emptyStateText: {
    fontSize: '1rem',
    color: '#6B7280',
  } as React.CSSProperties,
  infoPanel: {
    backgroundColor: '#EFF6FF',
    border: '2px solid #3B82F6',
    borderRadius: '0.75rem',
    padding: '1.5rem',
  } as React.CSSProperties,
  infoPanelTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1E40AF',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  infoPanelList: {
    margin: 0,
    paddingLeft: '1.5rem',
    color: '#1E3A8A',
    lineHeight: '1.75',
  } as React.CSSProperties,
};
