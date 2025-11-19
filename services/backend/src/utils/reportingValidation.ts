/**
 * Reporting Configuration Validation Utility
 *
 * Validates dynamic field submissions against tenant configuration.
 * Ensures type safety, required fields, PII controls, and security.
 */

import { pool } from '../db';

export interface FieldDefinition {
  id?: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'date' | 'file' | 'phone' | 'email';
  options?: { values?: string[] };
  required_by_default?: boolean;
  pii_flag?: boolean;
  help_text?: string;
  placeholder?: string;
}

export interface CategoryFieldConfig {
  field_key: string;
  required: boolean;
  enabled: boolean;
  order: number;
  pii?: boolean;
  default_value?: any;
  placeholder?: string;
  help_text?: string;
}

export interface CategoryConfig {
  id: string;
  name: string;
  description?: string;
  order: number;
  fields: CategoryFieldConfig[];
}

export interface TenantConfig {
  categories: CategoryConfig[];
  settings?: {
    allow_anonymous?: boolean;
    require_reporter_type?: boolean;
    max_attachments?: number;
    pii_enabled_globally?: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitizedFields?: Record<string, any>;
}

/**
 * Fetch field definitions from catalog
 */
export async function getFieldDefinitions(): Promise<Map<string, FieldDefinition>> {
  const result = await pool.query('SELECT * FROM reporting_fields_catalog');
  const map = new Map<string, FieldDefinition>();

  for (const row of result.rows) {
    map.set(row.name, {
      id: row.id,
      name: row.name,
      type: row.type,
      options: row.options,
      required_by_default: row.required_by_default,
      pii_flag: row.pii_flag,
      help_text: row.help_text,
      placeholder: row.placeholder,
    });
  }

  return map;
}

/**
 * Fetch tenant reporting config
 */
export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  const result = await pool.query(
    'SELECT config FROM tenant_reporting_config WHERE tenant_id = $1',
    [tenantId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].config as TenantConfig;
}

/**
 * Get default tenant config (fallback)
 */
export async function getDefaultTenantConfig(): Promise<TenantConfig | null> {
  // Use demo tenant as default
  const demoTenantId = '00000000-0000-0000-0000-000000000001';
  return getTenantConfig(demoTenantId);
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic international format)
 */
function isValidPhone(phone: string): boolean {
  // Accept various formats: +1234567890, (123) 456-7890, etc.
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate date format (ISO 8601)
 */
function isValidDate(date: string): boolean {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Sanitize text input (prevent XSS, injection)
 */
function sanitizeText(text: string): string {
  // Basic sanitization - remove null bytes, trim whitespace
  return text.replace(/\0/g, '').trim();
}

/**
 * Validate a single field value against its definition
 */
function validateFieldValue(
  fieldKey: string,
  value: any,
  fieldDef: FieldDefinition,
  fieldConfig: CategoryFieldConfig
): ValidationError | null {
  // Check if required
  if (fieldConfig.required && (value === null || value === undefined || value === '')) {
    return {
      field: fieldKey,
      message: `Field "${fieldKey}" is required`,
      code: 'REQUIRED_FIELD_MISSING',
    };
  }

  // Skip validation if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Type-specific validation
  switch (fieldDef.type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" must be a string`,
          code: 'INVALID_TYPE',
        };
      }
      // Check length
      if (fieldDef.type === 'text' && value.length > 500) {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" exceeds maximum length of 500 characters`,
          code: 'EXCEEDS_MAX_LENGTH',
        };
      }
      if (fieldDef.type === 'textarea' && value.length > 5000) {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" exceeds maximum length of 5000 characters`,
          code: 'EXCEEDS_MAX_LENGTH',
        };
      }
      break;

    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" must be a valid email address`,
          code: 'INVALID_EMAIL',
        };
      }
      break;

    case 'phone':
      if (typeof value !== 'string' || !isValidPhone(value)) {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" must be a valid phone number`,
          code: 'INVALID_PHONE',
        };
      }
      break;

    case 'date':
      if (typeof value !== 'string' || !isValidDate(value)) {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" must be a valid date (ISO 8601 format)`,
          code: 'INVALID_DATE',
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" must be a boolean`,
          code: 'INVALID_TYPE',
        };
      }
      break;

    case 'select':
      if (typeof value !== 'string') {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" must be a string`,
          code: 'INVALID_TYPE',
        };
      }
      // Validate against allowed options
      if (fieldDef.options?.values && !fieldDef.options.values.includes(value)) {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" has invalid option. Allowed: ${fieldDef.options.values.join(', ')}`,
          code: 'INVALID_OPTION',
        };
      }
      break;

    case 'multiselect':
      if (!Array.isArray(value)) {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" must be an array`,
          code: 'INVALID_TYPE',
        };
      }
      // Validate each option
      if (fieldDef.options?.values) {
        for (const item of value) {
          if (!fieldDef.options.values.includes(item)) {
            return {
              field: fieldKey,
              message: `Field "${fieldKey}" has invalid option "${item}". Allowed: ${fieldDef.options.values.join(', ')}`,
              code: 'INVALID_OPTION',
            };
          }
        }
      }
      break;

    case 'file':
      // File validation handled separately (presigned URLs)
      if (!Array.isArray(value) && typeof value !== 'object') {
        return {
          field: fieldKey,
          message: `Field "${fieldKey}" must be an array or object`,
          code: 'INVALID_TYPE',
        };
      }
      break;
  }

  return null;
}

/**
 * Validate dynamic fields submission against tenant config and category
 */
export async function validateDynamicFields(
  tenantId: string | null,
  category: string,
  dynamicFields: Record<string, any>
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  try {
    // Get tenant config
    let tenantConfig: TenantConfig | null = null;
    if (tenantId) {
      tenantConfig = await getTenantConfig(tenantId);
    }

    // Fall back to default config if tenant config not found
    if (!tenantConfig) {
      tenantConfig = await getDefaultTenantConfig();
    }

    if (!tenantConfig) {
      return {
        valid: false,
        errors: [
          {
            field: '_config',
            message: 'No reporting configuration found',
            code: 'CONFIG_NOT_FOUND',
          },
        ],
      };
    }

    // Find category config
    const categoryConfig = tenantConfig.categories.find((c) => c.id === category);
    if (!categoryConfig) {
      return {
        valid: false,
        errors: [
          {
            field: 'category',
            message: `Invalid category: ${category}`,
            code: 'INVALID_CATEGORY',
          },
        ],
      };
    }

    // Get field definitions from catalog
    const fieldDefinitions = await getFieldDefinitions();

    // Build a map of enabled fields for this category
    const enabledFieldsMap = new Map<string, CategoryFieldConfig>();
    for (const fieldConfig of categoryConfig.fields) {
      if (fieldConfig.enabled) {
        enabledFieldsMap.set(fieldConfig.field_key, fieldConfig);
      }
    }

    // Check for unknown fields (security: reject unexpected fields)
    for (const fieldKey of Object.keys(dynamicFields)) {
      if (!enabledFieldsMap.has(fieldKey)) {
        errors.push({
          field: fieldKey,
          message: `Unknown or disabled field: ${fieldKey}`,
          code: 'UNKNOWN_FIELD',
        });
      }
    }

    // Validate each enabled field
    const sanitizedFields: Record<string, any> = {};

    for (const [fieldKey, fieldConfig] of enabledFieldsMap.entries()) {
      const fieldDef = fieldDefinitions.get(fieldKey);
      if (!fieldDef) {
        console.error(`Field definition not found for: ${fieldKey}`);
        continue;
      }

      const value = dynamicFields[fieldKey];

      // Check if PII field is submitted but not enabled
      if (fieldDef.pii_flag && value && !fieldConfig.pii) {
        errors.push({
          field: fieldKey,
          message: `PII field "${fieldKey}" is not enabled for collection. Cannot submit this field.`,
          code: 'PII_NOT_ENABLED',
        });
        continue;
      }

      // Validate the value
      const error = validateFieldValue(fieldKey, value, fieldDef, fieldConfig);
      if (error) {
        errors.push(error);
        continue;
      }

      // Sanitize text fields
      if (value !== null && value !== undefined) {
        if (fieldDef.type === 'text' || fieldDef.type === 'textarea' || fieldDef.type === 'email') {
          sanitizedFields[fieldKey] = sanitizeText(String(value));
        } else {
          sanitizedFields[fieldKey] = value;
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, errors: [], sanitizedFields };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      errors: [
        {
          field: '_system',
          message: 'Internal validation error',
          code: 'SYSTEM_ERROR',
        },
      ],
    };
  }
}

/**
 * Check if any field in the submission is PII
 */
export async function checkHasPII(
  dynamicFields: Record<string, any>
): Promise<boolean> {
  const fieldDefinitions = await getFieldDefinitions();

  for (const fieldKey of Object.keys(dynamicFields)) {
    const fieldDef = fieldDefinitions.get(fieldKey);
    if (fieldDef?.pii_flag && dynamicFields[fieldKey]) {
      return true;
    }
  }

  return false;
}
