'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { offlineQueue, Report } from '@/lib/offline';
import { isDemoMode, simulateOfflineMode, isSimulatedOffline, getDemoImages } from '@/lib/demo';
import DemoBanner from '@/components/DemoBanner';

interface Category {
  id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
}

interface CategoryFieldConfig {
  field_key: string;
  required: boolean;
  enabled: boolean;
  order: number;
  pii?: boolean;
  help_text?: string;
  placeholder?: string;
}

interface CategoryConfig {
  id: string;
  name: string;
  description?: string;
  order: number;
  fields: CategoryFieldConfig[];
}

interface FieldDefinition {
  name: string;
  type: string;
  options?: { values?: string[] };
  pii_flag?: boolean;
  help_text?: string;
  placeholder?: string;
}

interface TenantConfig {
  categories: CategoryConfig[];
  settings?: any;
}

// Default color palette for categories
const DEFAULT_COLORS = [
  '#EF4444', '#F59E0B', '#8B5CF6', '#DC2626',
  '#06B6D4', '#10B981', '#F97316', '#6B7280',
  '#EC4899', '#14B8A6', '#F59E0B', '#8B5CF6'
];

export default function KioskPage({ params }: { params: { slug: string } }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [catalog, setCatalog] = useState<Map<string, FieldDefinition>>(new Map());
  const [loading, setLoading] = useState(true);
  const [institutionInfo, setInstitutionInfo] = useState<any>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Initialize offline queue
    offlineQueue.init();

    // Check demo mode
    setDemoMode(isDemoMode());

    // Check if user is admin
    checkAdminStatus();

    // Fetch institution and reporting config
    fetchInstitutionAndConfig();

    // Load fields catalog
    loadCatalog();

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

  const loadCatalog = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reporting/fields/catalog`);
      const data = await response.json();
      const catalogMap = new Map<string, FieldDefinition>();
      data.fields.forEach((field: FieldDefinition) => {
        catalogMap.set(field.name, field);
      });
      setCatalog(catalogMap);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  };

  const fetchInstitutionAndConfig = async () => {
    try {
      // Fetch institution by slug
      const instResponse = await fetch(`${API_BASE_URL}/api/institutions/by-slug/${params.slug}`);
      if (!instResponse.ok) {
        console.error('Failed to fetch institution');
        setLoading(false);
        return;
      }

      const instData = await instResponse.json();
      setInstitutionInfo(instData);

      // Fetch reporting config using institution slug
      const configResponse = await fetch(`${API_BASE_URL}/api/kiosk/${params.slug}/config`);

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setTenantConfig(configData.config);

        // Map categories with default colors
        const cats = configData.config.categories.map((cat: CategoryConfig, index: number) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          order: cat.order,
          color: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
        }));

        setCategories(cats.sort((a: Category, b: Category) => a.order - b.order));
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setIsAdmin(['super_admin', 'admin', 'staff'].includes(userData.role));
      }
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
  };

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
    setFormData({});
    setFormErrors({});
    setShowSuccess(false);
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setDescription('');
    setFormData({});
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    if (!selectedCategory || !tenantConfig) return false;

    const categoryConfig = tenantConfig.categories.find(c => c.id === selectedCategory);
    if (!categoryConfig) return false;

    const newErrors: Record<string, string> = {};

    for (const fieldConfig of categoryConfig.fields) {
      if (!fieldConfig.enabled) continue;

      const value = formData[fieldConfig.field_key];
      const fieldDef = catalog.get(fieldConfig.field_key);

      if (fieldConfig.required && (!value || value === '')) {
        newErrors[fieldConfig.field_key] = 'This field is required';
        continue;
      }

      // Type-specific validation
      if (value && fieldDef) {
        if (fieldDef.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[fieldConfig.field_key] = 'Invalid email address';
          }
        }

        if (fieldDef.type === 'phone') {
          const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
          if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            newErrors[fieldConfig.field_key] = 'Invalid phone number';
          }
        }
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderField = (fieldConfig: CategoryFieldConfig) => {
    const fieldDef = catalog.get(fieldConfig.field_key);
    if (!fieldDef || !fieldConfig.enabled) return null;

    const value = formData[fieldConfig.field_key] || '';
    const error = formErrors[fieldConfig.field_key];

    const handleChange = (newValue: any) => {
      setFormData({ ...formData, [fieldConfig.field_key]: newValue });
      if (error) {
        const newErrors = { ...formErrors };
        delete newErrors[fieldConfig.field_key];
        setFormErrors(newErrors);
      }
    };

    const labelClasses = 'block text-sm font-medium mb-1';
    const inputClasses = `w-full px-3 py-2 border rounded-lg transition-all ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
    }`;

    const fieldLabel = fieldConfig.field_key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <div key={fieldConfig.field_key} style={styles.formGroup}>
        <label style={styles.label}>
          {fieldLabel}
          {fieldConfig.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
          {fieldConfig.pii && (
            <span style={{
              marginLeft: '8px',
              fontSize: '0.75rem',
              backgroundColor: '#FFF7ED',
              color: '#C2410C',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              🔒 Optional PII
            </span>
          )}
        </label>

        {(fieldConfig.help_text || fieldDef.help_text) && (
          <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '8px' }}>
            {fieldConfig.help_text || fieldDef.help_text}
          </p>
        )}

        {fieldDef.type === 'textarea' && (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClasses}
            rows={4}
            placeholder={fieldConfig.placeholder || fieldDef.placeholder || ''}
            style={{
              ...styles.textarea,
              borderColor: error ? '#EF4444' : undefined,
              backgroundColor: error ? '#FEF2F2' : undefined,
            }}
          />
        )}

        {(fieldDef.type === 'text' || fieldDef.type === 'email' || fieldDef.type === 'phone') && (
          <input
            type={fieldDef.type === 'email' ? 'email' : fieldDef.type === 'phone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={fieldConfig.placeholder || fieldDef.placeholder || ''}
            style={{
              ...styles.textarea,
              height: 'auto',
              borderColor: error ? '#EF4444' : undefined,
              backgroundColor: error ? '#FEF2F2' : undefined,
            }}
          />
        )}

        {fieldDef.type === 'select' && (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              ...styles.textarea,
              height: 'auto',
              borderColor: error ? '#EF4444' : undefined,
              backgroundColor: error ? '#FEF2F2' : undefined,
            }}
          >
            <option value="">Select...</option>
            {fieldDef.options?.values?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {fieldDef.type === 'boolean' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleChange(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.875rem' }}>Yes</span>
          </label>
        )}

        {fieldDef.type === 'date' && (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              ...styles.textarea,
              height: 'auto',
              borderColor: error ? '#EF4444' : undefined,
              backgroundColor: error ? '#FEF2F2' : undefined,
            }}
          />
        )}

        {error && (
          <p style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '4px' }}>
            {error}
          </p>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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
        // Try to send directly with dynamic fields
        const response = await fetch('http://localhost:3001/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            schoolSlug: report.schoolSlug,
            category: report.category,
            description: report.description,
            dynamic_fields: formData,
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

  if (loading) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ fontSize: '18px', color: '#666' }}>No reporting categories configured</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Demo Banner */}
      {demoMode && <DemoBanner />}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <Logo size="md" />
        </div>
        <h1 style={styles.title}>{institutionInfo?.institution_name || 'School Safety Reporting'}</h1>
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
        {categories.map((category) => (
          <button
            key={category.id}
            style={{
              ...styles.categoryButton,
              backgroundColor: category.color,
            }}
            onClick={() => handleCategoryClick(category.id)}
            title={category.description}
          >
            {category.name}
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
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </h2>

                <form onSubmit={handleSubmit}>
                  {(() => {
                    const categoryConfig = tenantConfig?.categories.find(c => c.id === selectedCategory);
                    if (!categoryConfig) {
                      return (
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
                      );
                    }

                    // Render configured fields
                    const enabledFields = categoryConfig.fields
                      .filter(f => f.enabled)
                      .sort((a, b) => a.order - b.order);

                    if (enabledFields.length === 0) {
                      // Fallback to description if no fields configured
                      return (
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
                      );
                    }

                    return (
                      <>
                        {enabledFields.map(field => renderField(field))}
                      </>
                    );
                  })()}

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

      {/* Floating Admin Button */}
      {isAdmin && (
        <Link
          href="/admin/reporting-config"
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
          title="Admin Settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}

// Modern inline styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2.5rem 1.5rem',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: '3.5rem',
  } as React.CSSProperties,
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2.75rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 0.75rem 0',
    letterSpacing: '-0.025em',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1.125rem',
    color: '#6b7280',
    margin: '0 0 1.5rem 0',
    fontWeight: '500',
  } as React.CSSProperties,
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: 'white',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  } as React.CSSProperties,
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5)',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  categoryButton: {
    padding: '3.5rem 2.5rem',
    fontSize: '1.375rem',
    fontWeight: '700',
    color: 'white',
    border: 'none',
    borderRadius: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  } as React.CSSProperties,
  modal: {
    backgroundColor: 'white',
    borderRadius: '1.5rem',
    padding: '2.5rem',
    maxWidth: '540px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#111827',
    marginTop: 0,
    marginBottom: '1.75rem',
    letterSpacing: '-0.025em',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '1.75rem',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.625rem',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    lineHeight: '1.5',
    border: '1.5px solid #d1d5db',
    borderRadius: '0.75rem',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  cancelButton: {
    padding: '0.875rem 1.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  submitButton: {
    padding: '0.875rem 1.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  successMessage: {
    textAlign: 'center' as const,
    padding: '2.5rem',
  } as React.CSSProperties,
  checkmark: {
    fontSize: '4.5rem',
    color: '#10b981',
    marginBottom: '1.25rem',
    lineHeight: '1',
  } as React.CSSProperties,
  successTitle: {
    fontSize: '1.625rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 0.75rem 0',
    letterSpacing: '-0.025em',
  } as React.CSSProperties,
  successText: {
    fontSize: '1.0625rem',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6',
  } as React.CSSProperties,
  demoControls: {
    backgroundColor: '#fffbeb',
    border: '2px solid #fbbf24',
    borderRadius: '1rem',
    padding: '1.75rem',
    marginBottom: '2rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem auto',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  demoControlsTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#78350f',
    margin: '0 0 1.25rem 0',
  } as React.CSSProperties,
  demoButtonGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  demoButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6b7280',
    border: 'none',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,
  attachmentPreview: {
    marginTop: '1rem',
    padding: '0.875rem 1rem',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.9375rem',
    color: '#374151',
    border: '1px solid #e5e7eb',
  } as React.CSSProperties,
  removeAttachment: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    transition: 'color 0.2s ease',
  } as React.CSSProperties,
  demoNote: {
    fontSize: '0.9375rem',
    color: '#7c3aed',
    marginTop: '1rem',
    fontWeight: '600',
  } as React.CSSProperties,
};
