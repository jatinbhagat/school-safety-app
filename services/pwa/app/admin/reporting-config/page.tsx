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
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [catalog, setCatalog] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState('demo');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showPIIWarning, setShowPIIWarning] = useState(false);
  const [piiFieldToEnable, setPIIFieldToEnable] = useState<{ categoryId: string; fieldKey: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadConfig();
    loadCatalog();
  }, [tenantId]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/tenant/${tenantId}/reporting-config`);
      const data = await response.json();
      setConfig(data.config);
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
      const response = await fetch('http://localhost:3001/api/reporting/fields/catalog');
      const data = await response.json();
      setCatalog(data.fields);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/tenant/${tenantId}/reporting-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token
        },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reporting Configuration Editor</h1>
          <p className="text-gray-600">Configure incident reporting categories and dynamic fields</p>
        </div>

        {/* Tenant Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Tenant ID</label>
          <input
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="border rounded px-3 py-2 w-64"
            placeholder="Enter tenant ID or 'demo'"
          />
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Preview Kiosk Form
            </button>
            <button
              onClick={exportConfig}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Export JSON
            </button>
            <button
              onClick={importConfig}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Import JSON
            </button>
            <button
              onClick={loadConfig}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Reset to Saved
            </button>
          </div>
        </div>

        {/* Main Editor */}
        <div className="grid grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Categories</h2>
              <button
                onClick={addCategory}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {config.categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 rounded cursor-pointer border-2 ${
                    activeCategory === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-gray-500">{category.fields.length} fields</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Editor */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6">
            {activeConfig ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Category Name</label>
                  <input
                    type="text"
                    value={activeConfig.name}
                    onChange={(e) =>
                      updateCategory(activeConfig.id, { name: e.target.value })
                    }
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={activeConfig.description || ''}
                    onChange={(e) =>
                      updateCategory(activeConfig.id, { description: e.target.value })
                    }
                    className="border rounded px-3 py-2 w-full"
                    rows={2}
                  />
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-2">Fields</h3>
                  <div className="space-y-2 mb-4">
                    {activeConfig.fields.map((field) => {
                      const fieldDef = catalog.find((f) => f.name === field.field_key);
                      return (
                        <div key={field.field_key} className="border rounded p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {field.field_key}
                                {field.pii && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    PII
                                  </span>
                                )}
                                {field.required && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    Required
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">{fieldDef?.type}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleFieldRequired(activeConfig.id, field.field_key)}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Toggle Required
                              </button>
                              <button
                                onClick={() =>
                                  removeFieldFromCategory(activeConfig.id, field.field_key)
                                }
                                className="text-sm text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Add Field</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addFieldToCategory(activeConfig.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="">Select a field to add...</option>
                      {catalog.map((field) => (
                        <option key={field.name} value={field.name}>
                          {field.name} ({field.type}) {field.pii_flag ? '🔒 PII' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => removeCategory(activeConfig.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mt-4"
                >
                  Delete Category
                </button>
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
              <h3 className="text-2xl font-bold">Kiosk Form Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-6">
              {config.categories.map((category) => (
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
  );
}
