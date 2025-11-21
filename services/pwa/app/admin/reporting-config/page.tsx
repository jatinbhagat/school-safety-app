'use client';

/**
 * Admin: Reporting Configuration Editor
 *
 * Allows tenant admins to configure incident reporting categories and dynamic fields.
 * Features:
 * - Add/remove/reorder categories
 * - Configure fields per category
 * - Enable/disable PII fields with warnings
 * - Preview kiosk form
 * - Export/import config JSON
 * - Reset to defaults
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Breadcrumbs from '@/components/Breadcrumbs';

interface FieldDefinition {
  id?: string;
  name: string;
  type: string;
  options?: { values?: string[] };
  required_by_default?: boolean;
  pii_flag?: boolean;
  help_text?: string;
  placeholder?: string;
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

interface TenantConfig {
  categories: CategoryConfig[];
  settings?: {
    allow_anonymous?: boolean;
    require_reporter_type?: boolean;
    max_attachments?: number;
    pii_enabled_globally?: boolean;
  };
}

export default function ReportingConfigEditor() {
  const router = useRouter();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<TenantConfig | null>(null);
  const [catalog, setCatalog] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showPIIWarning, setShowPIIWarning] = useState(false);
  const [piiFieldToEnable, setPIIFieldToEnable] = useState<{ categoryId: string; fieldKey: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCategoryId, setPreviewCategoryId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');
  const [institutionSlug, setInstitutionSlug] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchUserInfo();
    loadConfig();
    loadCatalog();
  }, [tenantId]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (meResponse.ok) {
        const userData = await meResponse.json();
        setUserName(userData.name || '');
        setUserRole(userData.role || '');

        // Get institution details
        const instId = userData.institution?.id || userData.institutionId;
        setInstitutionId(instId);

        const instResponse = await fetch(`${API_BASE_URL}/api/institutions/${instId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (instResponse.ok) {
          const instData = await instResponse.json();
          setInstitutionName(instData.institution_name || '');
          setInstitutionSlug(instData.url_slug || '');

          // Set tenant ID from institution
          if (!instData.tenant_id) {
            console.error('Institution missing tenant_id. Please contact support.');
            alert('Configuration error: Institution is missing tenant ID. Please contact support.');
            return;
          }
          setTenantId(instData.tenant_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };

  useEffect(() => {
    // Warn before leaving if there are unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    // Track unsaved changes
    if (config && originalConfig) {
      const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasUnsavedChanges(hasChanges);
    }
  }, [config, originalConfig]);

  const loadConfig = async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenant/${tenantId}/reporting-config`);
      const data = await response.json();
      setConfig(data.config);
      setOriginalConfig(JSON.parse(JSON.stringify(data.config))); // Deep copy
      if (data.config.categories.length > 0) {
        setActiveCategory(data.config.categories[0].id);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reporting/fields/catalog`);
      const data = await response.json();
      setCatalog(data.fields);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  };

  const validateConfig = (): string[] => {
    const errors: string[] = [];

    if (!config) {
      errors.push('Configuration is missing');
      return errors;
    }

    // Validate minimum 3 categories
    if (config.categories.length < 3) {
      errors.push('Configuration must have at least 3 categories');
    }

    // Validate each category
    config.categories.forEach((category, index) => {
      if (!category.name || category.name.trim() === '') {
        errors.push(`Category ${index + 1}: Name is required`);
      }
      if (!category.id) {
        errors.push(`Category ${index + 1}: ID is missing`);
      }
    });

    return errors;
  };

  const saveConfig = async () => {
    if (!config || !tenantId) return;

    // Validate configuration
    const errors = validateConfig();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/tenant/${tenantId}/reporting-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        setOriginalConfig(JSON.parse(JSON.stringify(config))); // Update original to match current
        setHasUnsavedChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.message}`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!config) return;

    const newCategory: CategoryConfig = {
      id: `category_${Date.now()}`,
      name: 'New Category',
      description: '',
      order: config.categories.length + 1,
      fields: [],
    };

    setConfig({
      ...config,
      categories: [...config.categories, newCategory],
    });
    setActiveCategory(newCategory.id);
  };

  const removeCategory = (categoryId: string) => {
    if (!config) return;

    // Enforce minimum 3 categories
    if (config.categories.length <= 3) {
      alert('Cannot remove category. Minimum 3 categories required.');
      return;
    }

    if (!confirm('Are you sure you want to remove this category?')) return;

    const filtered = config.categories.filter((c) => c.id !== categoryId);
    setConfig({ ...config, categories: filtered });

    if (activeCategory === categoryId && filtered.length > 0) {
      setActiveCategory(filtered[0].id);
    }
  };

  const updateCategory = (categoryId: string, updates: Partial<CategoryConfig>) => {
    if (!config) return;

    const updated = config.categories.map((c) =>
      c.id === categoryId ? { ...c, ...updates } : c
    );
    setConfig({ ...config, categories: updated });
  };

  const moveCategoryUp = (categoryId: string) => {
    if (!config) return;

    const index = config.categories.findIndex(c => c.id === categoryId);
    if (index <= 0) return; // Already at top

    const newCategories = [...config.categories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];

    // Update order numbers
    newCategories.forEach((cat, idx) => {
      cat.order = idx + 1;
    });

    setConfig({ ...config, categories: newCategories });
  };

  const moveCategoryDown = (categoryId: string) => {
    if (!config) return;

    const index = config.categories.findIndex(c => c.id === categoryId);
    if (index < 0 || index >= config.categories.length - 1) return; // Already at bottom

    const newCategories = [...config.categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];

    // Update order numbers
    newCategories.forEach((cat, idx) => {
      cat.order = idx + 1;
    });

    setConfig({ ...config, categories: newCategories });
  };

  const addFieldToCategory = (categoryId: string, fieldKey: string) => {
    if (!config) return;

    const category = config.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const fieldDef = catalog.find((f) => f.name === fieldKey);
    if (!fieldDef) return;

    const newField: CategoryFieldConfig = {
      field_key: fieldKey,
      required: fieldDef.required_by_default || false,
      enabled: true,
      order: category.fields.length + 1,
      pii: fieldDef.pii_flag || false,
    };

    // Check if PII field
    if (fieldDef.pii_flag) {
      setPIIFieldToEnable({ categoryId, fieldKey });
      setShowPIIWarning(true);
      return; // Will add after confirmation
    }

    updateCategory(categoryId, {
      fields: [...category.fields, newField],
    });
  };

  const confirmPIIFieldAddition = () => {
    if (!config || !piiFieldToEnable) return;

    const { categoryId, fieldKey } = piiFieldToEnable;
    const category = config.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const fieldDef = catalog.find((f) => f.name === fieldKey);
    if (!fieldDef) return;

    const newField: CategoryFieldConfig = {
      field_key: fieldKey,
      required: false, // PII fields default to optional
      enabled: true,
      order: category.fields.length + 1,
      pii: true,
    };

    updateCategory(categoryId, {
      fields: [...category.fields, newField],
    });

    setShowPIIWarning(false);
    setPIIFieldToEnable(null);
  };

  const removeFieldFromCategory = (categoryId: string, fieldKey: string) => {
    if (!config) return;

    const category = config.categories.find((c) => c.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      fields: category.fields.filter((f) => f.field_key !== fieldKey),
    });
  };

  const toggleFieldRequired = (categoryId: string, fieldKey: string) => {
    if (!config) return;

    const category = config.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const updated = category.fields.map((f) =>
      f.field_key === fieldKey ? { ...f, required: !f.required } : f
    );

    updateCategory(categoryId, { fields: updated });
  };

  const exportConfig = () => {
    if (!config) return;

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporting_config_${tenantId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        setConfig(imported);
        alert('Configuration imported successfully!');
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading configuration...</h1>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Failed to load configuration</h1>
        </div>
      </div>
    );
  }

  const activeConfig = config.categories.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar
        institutionName={institutionName}
        institutionSlug={institutionSlug}
        userRole={userRole}
        userName={userName}
      />
      <Breadcrumbs />

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Incident Reporting Configuration</h1>
              <p className="text-gray-600">Configure incident reporting categories and dynamic fields for your kiosk</p>
            </div>
            {hasUnsavedChanges && (
              <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Unsaved changes</span>
              </div>
            )}
            {saveSuccess && (
              <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Saved successfully!</span>
              </div>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Configuration Errors</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Institution Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-sm text-gray-600">
            <p><strong>Institution:</strong> {institutionName}</p>
            {tenantId && <p className="mt-1"><strong>Tenant ID:</strong> {tenantId}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex gap-3 flex-wrap items-center">
            <button
              onClick={saveConfig}
              disabled={saving || !hasUnsavedChanges}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex items-center gap-2 transition-all"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setPreviewCategoryId(null);
                setShowPreview(true);
              }}
              className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview Kiosk</span>
            </button>
            <div className="h-8 w-px bg-gray-300"></div>
            <button
              onClick={exportConfig}
              className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 font-medium border border-gray-300 flex items-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export</span>
            </button>
            <button
              onClick={importConfig}
              className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 font-medium border border-gray-300 flex items-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import</span>
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={() => {
                  if (confirm('Discard all unsaved changes?')) {
                    loadConfig();
                  }
                }}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 font-medium border border-gray-300 flex items-center gap-2 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Discard Changes</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Editor */}
        <div className="grid grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Categories</h2>
              <button
                onClick={addCategory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium flex items-center gap-1.5 shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Category
              </button>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {config.categories.map((category, index) => (
                <div
                  key={category.id}
                  className={`group p-3 rounded-lg cursor-pointer border-2 transition-all ${
                    activeCategory === category.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div onClick={() => setActiveCategory(category.id)} className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{category.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {category.fields.length} field{category.fields.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCategoryUp(category.id);
                        }}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCategoryDown(category.id);
                        }}
                        disabled={index === config.categories.length - 1}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Tip:</strong> Hover over categories to reorder them. Categories appear in this order on the kiosk.
              </p>
            </div>
          </div>

          {/* Category Editor */}
          <div className="col-span-2 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            {activeConfig ? (
              <>
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Category</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={activeConfig.name}
                        onChange={(e) =>
                          updateCategory(activeConfig.id, { name: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., Bullying, Violence, Theft"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description <span className="text-gray-400 text-xs font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={activeConfig.description || ''}
                        onChange={(e) =>
                          updateCategory(activeConfig.id, { description: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        rows={2}
                        placeholder="Brief description shown on the kiosk"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Form Fields</h3>
                    <span className="text-sm text-gray-500">
                      {activeConfig.fields.length} field{activeConfig.fields.length !== 1 ? 's' : ''} configured
                    </span>
                  </div>

                  {activeConfig.fields.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-600 font-medium mb-1">No fields configured</p>
                      <p className="text-sm text-gray-500">Add fields below to customize the reporting form</p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                      {activeConfig.fields.map((field) => {
                        const fieldDef = catalog.find((f) => f.name === field.field_key);
                        return (
                          <div key={field.field_key} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-all">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900 truncate">
                                    {field.field_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                  {field.pii && (
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-medium border border-orange-200">
                                      🔒 PII
                                    </span>
                                  )}
                                  {field.required && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md font-medium border border-red-200">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                  Type: <span className="text-gray-700">{fieldDef?.type || 'unknown'}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => toggleFieldRequired(activeConfig.id, field.field_key)}
                                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium border border-blue-200 transition-colors"
                                  title={field.required ? 'Make optional' : 'Make required'}
                                >
                                  {field.required ? 'Make Optional' : 'Make Required'}
                                </button>
                                <button
                                  onClick={() => removeFieldFromCategory(activeConfig.id, field.field_key)}
                                  className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-100 font-medium border border-red-200 transition-colors"
                                  title="Remove field"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Add Field to Form
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addFieldToCategory(activeConfig.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="border border-blue-300 rounded-lg px-4 py-2.5 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select a field to add...</option>
                      {catalog
                        .filter(f => !activeConfig.fields.find(cf => cf.field_key === f.name))
                        .map((field) => (
                          <option key={field.name} value={field.name}>
                            {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ({field.type}) {field.pii_flag ? '🔒' : ''}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-blue-700 mt-2">
                      Select from available field types. PII fields require special consent.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setPreviewCategoryId(activeConfig.id);
                      setShowPreview(true);
                    }}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center gap-2 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview Category
                  </button>
                  <button
                    onClick={() => removeCategory(activeConfig.id)}
                    className="bg-red-50 text-red-700 px-5 py-2.5 rounded-lg hover:bg-red-100 font-medium border border-red-200 flex items-center gap-2 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Category
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Select a category to edit or create a new one
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PII Warning Modal */}
      {showPIIWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <h3 className="text-xl font-bold mb-4 text-orange-600">⚠️ Enabling PII Collection</h3>
            <p className="mb-4">
              Enabling this field will collect personally identifiable information. Ensure you have:
            </p>
            <ul className="list-disc list-inside mb-4 text-sm space-y-1">
              <li>Parental/employee consent (if required by law)</li>
              <li>Compliance with GDPR, COPPA, local privacy laws</li>
              <li>Data retention and deletion policies in place</li>
            </ul>
            <p className="text-sm text-gray-600 mb-6">
              PII will be encrypted at rest using AES-256-GCM.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmPIIFieldAddition}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
              >
                I Understand, Enable PII
              </button>
              <button
                onClick={() => {
                  setShowPIIWarning(false);
                  setPIIFieldToEnable(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8 overflow-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-full overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {previewCategoryId
                  ? `Preview: ${config.categories.find(c => c.id === previewCategoryId)?.name}`
                  : 'Kiosk Form Preview (All Categories)'}
              </h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewCategoryId(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            {previewCategoryId && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  This preview shows how the form will look when a user clicks the "{config.categories.find(c => c.id === previewCategoryId)?.name}" button on the kiosk.
                </p>
              </div>
            )}
            <div className="space-y-6">
              {config.categories
                .filter((category) => !previewCategoryId || category.id === previewCategoryId)
                .map((category) => (
                <div key={category.id} className="border-b pb-6">
                  <h4 className="text-lg font-bold mb-2">{category.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  <div className="space-y-3">
                    {category.fields.map((field) => {
                      const fieldDef = catalog.find((f) => f.name === field.field_key);
                      return (
                        <div key={field.field_key}>
                          <label className="block text-sm font-medium mb-1">
                            {field.field_key}
                            {field.required && <span className="text-red-500"> *</span>}
                            {field.pii && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded ml-2">
                                Optional PII — enabled by admin
                              </span>
                            )}
                          </label>
                          {fieldDef?.type === 'textarea' ? (
                            <textarea className="border rounded px-3 py-2 w-full" rows={3} disabled />
                          ) : fieldDef?.type === 'select' ? (
                            <select className="border rounded px-3 py-2 w-full" disabled>
                              <option>Select...</option>
                              {fieldDef.options?.values?.map((opt) => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="border rounded px-3 py-2 w-full"
                              placeholder={fieldDef?.placeholder}
                              disabled
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
