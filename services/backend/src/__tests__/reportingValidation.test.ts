/**
 * Unit Tests: Reporting Validation
 *
 * Tests dynamic field validation logic, PII controls, and security checks.
 *
 * NOTE: To run these tests, install Jest types:
 *   npm install --save-dev jest @types/jest ts-jest
 *   npm test
 */

import { validateDynamicFields, checkHasPII } from '../utils/reportingValidation';
import { pool } from '../db';

// Mock database pool
jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const mockPool = pool as jest.Mocked<typeof pool>;

// Mock field definitions (catalog)
const mockFieldDefinitions = [
  {
    name: 'reporter_type',
    type: 'select',
    options: { values: ['Student', 'Teacher', 'Staff'] },
    required_by_default: true,
    pii_flag: false,
  },
  {
    name: 'description',
    type: 'textarea',
    options: null,
    required_by_default: true,
    pii_flag: false,
  },
  {
    name: 'contact_email',
    type: 'email',
    options: null,
    required_by_default: false,
    pii_flag: true,
  },
  {
    name: 'contact_phone',
    type: 'phone',
    options: null,
    required_by_default: false,
    pii_flag: true,
  },
  {
    name: 'location',
    type: 'text',
    options: null,
    required_by_default: false,
    pii_flag: false,
  },
  {
    name: 'urgency_level',
    type: 'select',
    options: { values: ['Low', 'Medium', 'High', 'Emergency'] },
    required_by_default: false,
    pii_flag: false,
  },
];

// Mock tenant config
const mockTenantConfig = {
  categories: [
    {
      id: 'bullying',
      name: 'Bullying',
      order: 1,
      fields: [
        { field_key: 'reporter_type', required: true, enabled: true, order: 1 },
        { field_key: 'description', required: true, enabled: true, order: 2 },
        { field_key: 'location', required: false, enabled: true, order: 3 },
      ],
    },
    {
      id: 'harassment',
      name: 'Harassment',
      order: 2,
      fields: [
        { field_key: 'reporter_type', required: true, enabled: true, order: 1 },
        { field_key: 'description', required: true, enabled: true, order: 2 },
        { field_key: 'contact_email', required: false, enabled: true, order: 3, pii: true },
      ],
    },
    {
      id: 'physical',
      name: 'Physical Incident',
      order: 3,
      fields: [
        { field_key: 'reporter_type', required: true, enabled: true, order: 1 },
        { field_key: 'description', required: true, enabled: true, order: 2 },
        { field_key: 'urgency_level', required: true, enabled: true, order: 3 },
        { field_key: 'contact_phone', required: false, enabled: false, order: 4, pii: true },
      ],
    },
  ],
  settings: {
    allow_anonymous: true,
    pii_enabled_globally: false,
  },
};

describe('Reporting Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDynamicFields', () => {
    it('should validate required fields successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any) // tenant config
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any); // field catalog

      const result = await validateDynamicFields('demo', 'bullying', {
        reporter_type: 'Student',
        description: 'This is a bullying incident',
        location: 'Playground',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedFields).toEqual({
        reporter_type: 'Student',
        description: 'This is a bullying incident',
        location: 'Playground',
      });
    });

    it('should reject missing required field', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'bullying', {
        reporter_type: 'Student',
        // description is missing but required
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'description',
          code: 'REQUIRED_FIELD_MISSING',
        })
      );
    });

    it('should reject PII field when not enabled', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'physical', {
        reporter_type: 'Student',
        description: 'Fell down stairs',
        urgency_level: 'High',
        contact_phone: '+1234567890', // PII field disabled in config
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'contact_phone',
          code: 'PII_NOT_ENABLED',
        })
      );
    });

    it('should accept PII field when enabled', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'harassment', {
        reporter_type: 'Teacher',
        description: 'Harassment incident',
        contact_email: 'teacher@school.edu',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedFields?.contact_email).toBe('teacher@school.edu');
    });

    it('should reject unknown fields', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'bullying', {
        reporter_type: 'Student',
        description: 'Incident',
        unknown_field: 'This field does not exist',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'unknown_field',
          code: 'UNKNOWN_FIELD',
        })
      );
    });

    it('should reject invalid email format', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'harassment', {
        reporter_type: 'Student',
        description: 'Incident',
        contact_email: 'not-a-valid-email',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'contact_email',
          code: 'INVALID_EMAIL',
        })
      );
    });

    it('should reject invalid select option', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'bullying', {
        reporter_type: 'InvalidType', // Not in allowed values
        description: 'Incident',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'reporter_type',
          code: 'INVALID_OPTION',
        })
      );
    });

    it('should reject invalid category', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'invalid_category', {
        reporter_type: 'Student',
        description: 'Incident',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'category',
          code: 'INVALID_CATEGORY',
        })
      );
    });

    it('should sanitize text input', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'bullying', {
        reporter_type: 'Student',
        description: '  Description with extra spaces  \0null byte',
        location: '  Classroom 3A  ',
      });

      expect(result.valid).toBe(true);
      expect(result.sanitizedFields?.description).toBe('Description with extra spaces  null byte');
      expect(result.sanitizedFields?.location).toBe('Classroom 3A');
    });

    it('should handle empty optional fields', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ config: mockTenantConfig }] } as any)
        .mockResolvedValueOnce({ rows: mockFieldDefinitions } as any);

      const result = await validateDynamicFields('demo', 'bullying', {
        reporter_type: 'Student',
        description: 'Incident',
        location: '', // Optional field, empty
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('checkHasPII', () => {
    beforeEach(() => {
      mockPool.query.mockResolvedValue({ rows: mockFieldDefinitions } as any);
    });

    it('should return true when PII fields present', async () => {
      const hasPII = await checkHasPII({
        reporter_type: 'Student',
        description: 'Incident',
        contact_email: 'student@school.edu',
      });

      expect(hasPII).toBe(true);
    });

    it('should return false when no PII fields', async () => {
      const hasPII = await checkHasPII({
        reporter_type: 'Student',
        description: 'Incident',
        location: 'Playground',
      });

      expect(hasPII).toBe(false);
    });

    it('should return false when PII field is empty', async () => {
      const hasPII = await checkHasPII({
        reporter_type: 'Student',
        description: 'Incident',
        contact_email: '',
      });

      expect(hasPII).toBe(false);
    });
  });
});
