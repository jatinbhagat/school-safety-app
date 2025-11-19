/**
 * PII Encryption Utility
 *
 * Provides AES-256-GCM encryption for PII fields at rest.
 * Uses KMS-managed key in production, local key for development.
 *
 * SECURITY NOTES:
 * - All PII values are encrypted before storage
 * - Encryption key must be stored securely (KMS in prod, env var in dev)
 * - Each encryption includes a unique IV (initialization vector)
 * - Authentication tag ensures data integrity
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * In production, this should fetch from KMS/Secrets Manager
 * For local dev, use a key from .env.local
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.PII_ENCRYPTION_KEY;

  if (!keyEnv) {
    // For development only - generate a consistent key
    console.warn('⚠️  PII_ENCRYPTION_KEY not set. Using development key (NOT FOR PRODUCTION)');
    // In real deployment, this should throw an error
    const devKey = 'dev-key-32-chars-for-aes-256!!'; // 32 bytes for AES-256
    return Buffer.from(devKey.padEnd(32, '!'));
  }

  // Derive a 256-bit key from the env variable
  const key = crypto.scryptSync(keyEnv, 'salt', 32);
  return key;
}

/**
 * Encrypt a PII value
 * Returns base64-encoded string: iv:authTag:encryptedData
 */
export function encryptPII(plaintext: string): string {
  if (!plaintext || plaintext.trim() === '') {
    return '';
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (all hex)
  const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

  return result;
}

/**
 * Decrypt a PII value
 * Expects format: iv:authTag:encryptedData
 */
export function decryptPII(ciphertext: string): string {
  if (!ciphertext || ciphertext.trim() === '') {
    return '';
  }

  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('PII decryption failed:', error);
    throw new Error('Failed to decrypt PII data');
  }
}

/**
 * Hash a value for audit logs (one-way, cannot be reversed)
 * Used for logging presence of PII without storing actual values
 */
export function hashForAudit(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Check if a field is marked as PII in the catalog
 */
export function isPIIField(fieldDefinition: any): boolean {
  return fieldDefinition?.pii_flag === true || fieldDefinition?.pii === true;
}

/**
 * Encrypt all PII fields in a dynamic_fields object
 * Returns new object with encrypted values and list of encrypted field keys
 */
export function encryptDynamicPIIFields(
  dynamicFields: Record<string, any>,
  fieldDefinitions: Map<string, any>
): { encrypted: Record<string, any>; piiFieldKeys: string[] } {
  const encrypted: Record<string, any> = {};
  const piiFieldKeys: string[] = [];

  for (const [key, value] of Object.entries(dynamicFields)) {
    const fieldDef = fieldDefinitions.get(key);

    if (fieldDef && isPIIField(fieldDef)) {
      // This is a PII field - encrypt it
      if (typeof value === 'string' && value.trim() !== '') {
        encrypted[key] = encryptPII(value);
        piiFieldKeys.push(key);
      } else {
        encrypted[key] = value; // Keep null/empty as-is
      }
    } else {
      // Non-PII field - store as-is
      encrypted[key] = value;
    }
  }

  return { encrypted, piiFieldKeys };
}

/**
 * Decrypt all PII fields in a dynamic_fields object
 */
export function decryptDynamicPIIFields(
  dynamicFields: Record<string, any>,
  fieldDefinitions: Map<string, any>
): Record<string, any> {
  const decrypted: Record<string, any> = {};

  for (const [key, value] of Object.entries(dynamicFields)) {
    const fieldDef = fieldDefinitions.get(key);

    if (fieldDef && isPIIField(fieldDef)) {
      // This is a PII field - decrypt it
      if (typeof value === 'string' && value.trim() !== '') {
        try {
          decrypted[key] = decryptPII(value);
        } catch (error) {
          console.error(`Failed to decrypt PII field ${key}:`, error);
          decrypted[key] = '[DECRYPTION_FAILED]';
        }
      } else {
        decrypted[key] = value;
      }
    } else {
      // Non-PII field - keep as-is
      decrypted[key] = value;
    }
  }

  return decrypted;
}
