'use client';

/**
 * Dynamic Report Form Component
 *
 * Renders incident reporting forms dynamically based on tenant configuration.
 * Supports:
 * - Dynamic fields from catalog
 * - PII controls with visual indicators
 * - Field validation
 * - Anonymous submission
 */

import { useState, useEffect } from 'react';

interface FieldDefinition {
  name: string;
  type: string;
  options?: { values?: string[] };
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
    max_attachments?: number;
  };
}

interface DynamicReportFormProps {
  tenantId: string;
  onSubmitSuccess?: (reportId: number) => void;
  onCancel?: () => void;
}

export default function DynamicReportForm({
  tenantId,
  onSubmitSuccess,
  onCancel,
}: DynamicReportFormProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [catalog, setCatalog] = useState<Map<string, FieldDefinition>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConfig();
    loadCatalog();
  }, [tenantId]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenant/${tenantId}/reporting-config`);
      const data = await response.json();
      setConfig(data.config);
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
      const catalogMap = new Map<string, FieldDefinition>();
      data.fields.forEach((field: FieldDefinition) => {
        catalogMap.set(field.name, field);
      });
      setCatalog(catalogMap);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  };

  const getCategoryConfig = (): CategoryConfig | null => {
    if (!config || !selectedCategory) return null;
    return config.categories.find((c) => c.id === selectedCategory) || null;
  };

  const validateForm = (): boolean => {
    const categoryConfig = getCategoryConfig();
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

        if (fieldDef.type === 'select' && fieldDef.options?.values) {
          if (!fieldDef.options.values.includes(value)) {
            newErrors[fieldConfig.field_key] = 'Invalid selection';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          category: selectedCategory,
          dynamic_fields: formData,
          demo: tenantId === 'demo',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({});
        setSelectedCategory(null);
        onSubmitSuccess?.(data.id);
      } else {
        const error = await response.json();
        alert(`Submission failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (fieldConfig: CategoryFieldConfig) => {
    const fieldDef = catalog.get(fieldConfig.field_key);
    if (!fieldDef || !fieldConfig.enabled) return null;

    const value = formData[fieldConfig.field_key] || '';
    const error = errors[fieldConfig.field_key];

    const handleChange = (newValue: any) => {
      setFormData({ ...formData, [fieldConfig.field_key]: newValue });
      // Clear error when user starts typing
      if (error) {
        const newErrors = { ...errors };
        delete newErrors[fieldConfig.field_key];
        setErrors(newErrors);
      }
    };

    const labelClasses = 'block text-sm font-medium mb-1';
    const inputClasses = `border rounded px-3 py-2 w-full ${error ? 'border-red-500' : 'border-gray-300'}`;

    return (
      <div key={fieldConfig.field_key} className="mb-4">
        <label className={labelClasses}>
          {fieldConfig.field_key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
          {fieldConfig.pii && (
            <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
              Optional PII — enabled by admin
            </span>
          )}
        </label>

        {fieldDef.help_text && (
          <p className="text-xs text-gray-500 mb-2">{fieldConfig.help_text || fieldDef.help_text}</p>
        )}

        {fieldDef.type === 'textarea' && (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClasses}
            rows={4}
            placeholder={fieldConfig.placeholder || fieldDef.placeholder || ''}
          />
        )}

        {(fieldDef.type === 'text' || fieldDef.type === 'email' || fieldDef.type === 'phone') && (
          <input
            type={fieldDef.type === 'email' ? 'email' : fieldDef.type === 'phone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClasses}
            placeholder={fieldConfig.placeholder || fieldDef.placeholder || ''}
          />
        )}

        {fieldDef.type === 'select' && (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClasses}
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Yes</span>
          </label>
        )}

        {fieldDef.type === 'date' && (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={inputClasses}
          />
        )}

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reporting configuration...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load reporting configuration</p>
      </div>
    );
  }

  // Category Selection View
  if (!selectedCategory) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Select a Category</h2>
        <p className="text-gray-600 mb-6">
          Choose the category that best describes your concern. Your report is anonymous.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.categories
            .sort((a, b) => a.order - b.order)
            .map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left"
              >
                <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
              </button>
            ))}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 text-gray-600 hover:text-gray-800 underline"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  // Form View
  const categoryConfig = getCategoryConfig();

  if (!categoryConfig) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Category configuration not found</p>
        <button
          onClick={() => setSelectedCategory(null)}
          className="mt-4 text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className="text-blue-600 hover:underline mb-2"
        >
          ← Back to categories
        </button>
        <h2 className="text-2xl font-bold">{categoryConfig.name}</h2>
        {categoryConfig.description && (
          <p className="text-gray-600 mt-2">{categoryConfig.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            🔒 This form is anonymous. We do not collect any identifying information unless you
            choose to provide it in optional fields marked as PII.
          </p>
        </div>

        {categoryConfig.fields
          .sort((a, b) => a.order - b.order)
          .map((fieldConfig) => renderField(fieldConfig))}

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50 flex-1"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null);
              setFormData({});
              setErrors({});
            }}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
