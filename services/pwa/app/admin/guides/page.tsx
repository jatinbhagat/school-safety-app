'use client';

import { useEffect, useState } from 'react';

interface MicroGuide {
  id: number;
  title: string;
  body: string;
  tags: string[];
  duration_seconds: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface GenerateFormData {
  topic: string;
  tone: 'friendly' | 'professional' | 'urgent' | 'supportive';
  tags: string;
  duration_seconds: number;
}

export default function MicroGuidesAdmin() {
  const [guides, setGuides] = useState<MicroGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<GenerateFormData>({
    topic: '',
    tone: 'friendly',
    tags: '',
    duration_seconds: 60,
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/micro-guides`);
      if (!response.ok) {
        throw new Error('Failed to fetch micro-guides');
      }
      const data = await response.json();
      setGuides(data.guides || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      setError(null);

      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch(`${API_BASE_URL}/micro-guides/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          tone: formData.tone,
          tags: tags.length > 0 ? tags : [formData.topic.toLowerCase()],
          duration_seconds: formData.duration_seconds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate micro-guide');
      }

      const newGuide = await response.json();
      setGuides([newGuide, ...guides]);
      setFormData({
        topic: '',
        tone: 'friendly',
        tags: '',
        duration_seconds: 60,
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleEnabled = async (guide: MicroGuide) => {
    try {
      const response = await fetch(`${API_BASE_URL}/micro-guides/${guide.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !guide.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update guide');
      }

      const updatedGuide = await response.json();
      setGuides(
        guides.map((g) => (g.id === guide.id ? updatedGuide : g))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading micro-guides...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Micro-Guides Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.primaryButton}
        >
          {showForm ? 'Cancel' : '+ Generate New Guide'}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError(null)} style={styles.dismissButton}>
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Generate New Micro-Guide</h2>
          <form onSubmit={handleGenerateGuide}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="topic">
                Topic *
              </label>
              <input
                id="topic"
                type="text"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                placeholder="e.g., Cyberbullying prevention"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="tone">
                Tone *
              </label>
              <select
                id="tone"
                value={formData.tone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tone: e.target.value as GenerateFormData['tone'],
                  })
                }
                required
                style={styles.select}
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="urgent">Urgent</option>
                <option value="supportive">Supportive</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="tags">
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="e.g., bullying, safety, mental-health"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="duration">
                Duration (seconds)
              </label>
              <input
                id="duration"
                type="number"
                min="30"
                max="300"
                value={formData.duration_seconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_seconds: parseInt(e.target.value, 10),
                  })
                }
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              style={{
                ...styles.submitButton,
                ...(generating ? styles.submitButtonDisabled : {}),
              }}
            >
              {generating ? 'Generating...' : 'Generate Guide'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Total Guides:</span>
          <span style={styles.statValue}>{guides.length}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Enabled:</span>
          <span style={styles.statValue}>
            {guides.filter((g) => g.enabled).length}
          </span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Disabled:</span>
          <span style={styles.statValue}>
            {guides.filter((g) => !g.enabled).length}
          </span>
        </div>
      </div>

      <div style={styles.guidesGrid}>
        {guides.map((guide) => (
          <div key={guide.id} style={styles.guideCard}>
            <div style={styles.guideHeader}>
              <h3 style={styles.guideTitle}>{guide.title}</h3>
              <button
                onClick={() => handleToggleEnabled(guide)}
                style={{
                  ...styles.toggleButton,
                  ...(guide.enabled
                    ? styles.toggleButtonEnabled
                    : styles.toggleButtonDisabled),
                }}
              >
                {guide.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <p style={styles.guideBody}>{guide.body}</p>
            <div style={styles.guideMeta}>
              <div style={styles.tags}>
                {guide.tags.map((tag, idx) => (
                  <span key={idx} style={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={styles.metaInfo}>
                <span style={styles.metaText}>
                  {guide.duration_seconds}s
                </span>
                <span style={styles.metaText}>
                  Created: {formatDate(guide.created_at)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {guides.length === 0 && (
        <div style={styles.emptyState}>
          <p>No micro-guides yet</p>
          <button
            onClick={() => setShowForm(true)}
            style={styles.primaryButton}
          >
            Generate Your First Guide
          </button>
        </div>
      )}
    </div>
  );
}

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
  primaryButton: {
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
  error: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    marginBottom: '1rem',
  } as React.CSSProperties,
  dismissButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: '#c00',
    border: '1px solid #c00',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  formCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  formTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '1.5rem',
    color: '#1a1a1a',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#495057',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  submitButton: {
    width: '100%',
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
  submitButtonDisabled: {
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
  guidesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  } as React.CSSProperties,
  guideCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s',
  } as React.CSSProperties,
  guideHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '1rem',
  } as React.CSSProperties,
  guideTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: 0,
    color: '#1a1a1a',
    flex: 1,
  } as React.CSSProperties,
  toggleButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  toggleButtonEnabled: {
    backgroundColor: '#d1e7dd',
    color: '#0f5132',
  } as React.CSSProperties,
  toggleButtonDisabled: {
    backgroundColor: '#f8d7da',
    color: '#842029',
  } as React.CSSProperties,
  guideBody: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#495057',
    marginBottom: '1rem',
  } as React.CSSProperties,
  guideMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef',
  } as React.CSSProperties,
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  } as React.CSSProperties,
  tag: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#e7f3ff',
    color: '#0070f3',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  } as React.CSSProperties,
  metaInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
  } as React.CSSProperties,
  metaText: {
    fontSize: '0.75rem',
    color: '#999',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.125rem',
    color: '#666',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1rem',
    color: '#999',
  } as React.CSSProperties,
};
