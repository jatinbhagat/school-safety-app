'use client';

import { useState, useEffect } from 'react';
import { offlineQueue, Report } from '@/lib/offline';
import { isDemoMode, simulateOfflineMode, isSimulatedOffline, getDemoImages } from '@/lib/demo';
import DemoBanner from '@/components/DemoBanner';

interface Category {
  id: string;
  label: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'bullying', label: 'Bullying', color: '#EF4444' },
  { id: 'harassment', label: 'Harassment', color: '#F59E0B' },
  { id: 'cyberbullying', label: 'Cyberbullying', color: '#8B5CF6' },
  { id: 'physical', label: 'Physical', color: '#DC2626' },
  { id: 'mental_stress', label: 'Mental Stress', color: '#06B6D4' },
  { id: 'academic_pressure', label: 'Academic Pressure', color: '#10B981' },
  { id: 'cheating', label: 'Cheating', color: '#F97316' },
  { id: 'general', label: 'General', color: '#6B7280' },
];

export default function KioskPage({ params }: { params: { slug: string } }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  useEffect(() => {
    // Initialize offline queue
    offlineQueue.init();

    // Check demo mode
    setDemoMode(isDemoMode());

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);
    setSimulatedOffline(isSimulatedOffline());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulatedOffline = () => {
    const newState = !simulatedOffline;
    setSimulatedOffline(newState);
    simulateOfflineMode(newState);
    setIsOnline(!newState);
  };

  const attachSampleImage = () => {
    const demoImages = getDemoImages();
    const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
    setAttachedImage(randomImage);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setDescription('');
    setShowSuccess(false);
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const report: Report = {
      schoolSlug: demoMode ? 'demo-school' : params.slug,
      category: selectedCategory!,
      description: description.trim() || undefined,
      timestamp: Date.now(),
    };

    const effectiveOnline = isOnline && !simulatedOffline;

    try {
      if (effectiveOnline) {
        // Try to send directly
        const response = await fetch('http://localhost:3001/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            schoolSlug: report.schoolSlug,
            category: report.category,
            description: report.description,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit report');
        }

        console.log('Report submitted successfully');

        // Demo mode: show toast
        if (demoMode) {
          setTimeout(() => {
            alert(
              '✅ AI triage suggestion sent!\n\nCheck the Admin Dashboard to see:\n• Incident details\n• AI routing suggestion\n• Assignment options'
            );
          }, 1000);
        }
      } else {
        // Offline - enqueue for later
        await offlineQueue.enqueueReport(report);
        console.log('Report queued for later sync');
      }

      setShowSuccess(true);
      setAttachedImage(null); // Clear attachment
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);

      // If online submission failed, queue it
      if (effectiveOnline) {
        console.log('Online submission failed, queuing for later');
        await offlineQueue.enqueueReport(report);
        setShowSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Demo Banner */}
      {demoMode && <DemoBanner />}

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>School Safety Reporting</h1>
        <p style={styles.subtitle}>{params.slug}</p>
        <div style={styles.statusBadge}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: isOnline ? '#10B981' : '#EF4444',
            }}
          />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Demo Controls */}
      {demoMode && (
        <div style={styles.demoControls}>
          <h3 style={styles.demoControlsTitle}>Demo Tools</h3>
          <div style={styles.demoButtonGroup}>
            <button
              onClick={toggleSimulatedOffline}
              style={{
                ...styles.demoButton,
                backgroundColor: simulatedOffline ? '#EF4444' : '#6B7280',
              }}
            >
              {simulatedOffline ? '📡 Go Online' : '📴 Simulate Offline'}
            </button>
            <button onClick={attachSampleImage} style={styles.demoButton}>
              📎 Attach Sample Image
            </button>
          </div>
          {attachedImage && (
            <div style={styles.attachmentPreview}>
              <span>📷 Sample image attached</span>
              <button
                onClick={() => setAttachedImage(null)}
                style={styles.removeAttachment}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Grid */}
      <div style={styles.grid}>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            style={{
              ...styles.categoryButton,
              backgroundColor: category.color,
            }}
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedCategory && (
        <div style={styles.modalOverlay} onClick={handleClose}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {showSuccess ? (
              <div style={styles.successMessage}>
                <div style={styles.checkmark}>✓</div>
                <h2 style={styles.successTitle}>Report Submitted!</h2>
                <p style={styles.successText}>
                  {isOnline && !simulatedOffline
                    ? 'Your report has been sent.'
                    : 'Your report will be sent when connection is restored.'}
                </p>
                {demoMode && (
                  <p style={styles.demoNote}>
                    💡 In demo mode - check Admin Dashboard to see this incident
                  </p>
                )}
              </div>
            ) : (
              <>
                <h2 style={styles.modalTitle}>
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Additional Details (Optional)
                    </label>
                    <textarea
                      style={styles.textarea}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide any additional information..."
                      rows={4}
                    />
                  </div>

                  <div style={styles.buttonGroup}>
                    <button
                      type="button"
                      style={styles.cancelButton}
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.submitButton}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styles for simplicity
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
    padding: '2rem',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: '3rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: '0 0 0.5rem 0',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1.25rem',
    color: '#6B7280',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'white',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  categoryButton: {
    padding: '3rem 2rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 0,
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  buttonGroup: {
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
  submitButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#3B82F6',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  successMessage: {
    textAlign: 'center' as const,
    padding: '2rem',
  } as React.CSSProperties,
  checkmark: {
    fontSize: '4rem',
    color: '#10B981',
    marginBottom: '1rem',
  } as React.CSSProperties,
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: '0 0 0.5rem 0',
  } as React.CSSProperties,
  successText: {
    fontSize: '1rem',
    color: '#6B7280',
    margin: 0,
  } as React.CSSProperties,
  demoControls: {
    backgroundColor: '#FEF3C7',
    border: '2px solid #F59E0B',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '2rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem auto',
  } as React.CSSProperties,
  demoControlsTitle: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: '#92400E',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  demoButtonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  demoButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6B7280',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  attachmentPreview: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#374151',
  } as React.CSSProperties,
  removeAttachment: {
    background: 'transparent',
    border: 'none',
    color: '#6B7280',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
  } as React.CSSProperties,
  demoNote: {
    fontSize: '0.875rem',
    color: '#8B5CF6',
    marginTop: '1rem',
    fontWeight: '500',
  } as React.CSSProperties,
};
