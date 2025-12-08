/**
 * Production Configuration Validation
 * 
 * Validates all required environment variables at startup to ensure
 * the application fails fast if critical configuration is missing.
 * Prevents runtime failures and ensures production readiness.
 * 
 * SAFETY FEATURES:
 * - Fail-fast startup validation
 * - Environment-specific requirements
 * - No default values for production secrets
 * - Detailed validation error reporting
 */

interface ConfigRequirement {
  key: string;
  required: boolean;
  environments?: string[];
  description: string;
  sensitive?: boolean;
  validator?: (value: string) => boolean;
  defaultValue?: string;
}

const CONFIG_REQUIREMENTS: ConfigRequirement[] = [
  {
    key: 'NODE_ENV',
    required: true,
    description: 'Node.js environment (development, production, test)',
    validator: (value) => ['development', 'production', 'test'].includes(value),
  },
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    sensitive: true,
    validator: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
  },
  {
    key: 'JWT_SECRET',
    required: true,
    environments: ['production'],
    description: 'JWT signing secret (required in production)',
    sensitive: true,
    validator: (value) => value.length >= 32 && value !== 'dev-secret-change-in-production',
  },
  {
    key: 'PII_ENCRYPTION_KEY',
    required: true,
    environments: ['production'],
    description: 'PII encryption key (required in production)',
    sensitive: true,
    validator: (value) => value.length >= 16,
  },
  {
    key: 'SENDGRID_API_KEY',
    required: false,
    description: 'SendGrid API key for email notifications',
    sensitive: true,
  },
  {
    key: 'TWILIO_ACCOUNT_SID',
    required: false,
    description: 'Twilio Account SID for SMS notifications',
    sensitive: true,
  },
  {
    key: 'TWILIO_AUTH_TOKEN',
    required: false,
    description: 'Twilio Auth Token for SMS notifications',
    sensitive: true,
  },
  {
    key: 'FIREBASE_PROJECT_ID',
    required: false,
    description: 'Firebase project ID for push notifications',
  },
  {
    key: 'FIREBASE_SERVICE_ACCOUNT_KEY',
    required: false,
    description: 'Firebase service account JSON for push notifications',
    sensitive: true,
  },
  {
    key: 'AWS_ACCESS_KEY_ID',
    required: false,
    description: 'AWS access key for S3 file storage',
    sensitive: true,
  },
  {
    key: 'AWS_SECRET_ACCESS_KEY',
    required: false,
    description: 'AWS secret key for S3 file storage',
    sensitive: true,
  },
  {
    key: 'AWS_S3_BUCKET',
    required: false,
    description: 'AWS S3 bucket name for file uploads',
  },
  {
    key: 'AWS_S3_REGION',
    required: false,
    description: 'AWS S3 region',
    defaultValue: 'us-east-1',
  },
  {
    key: 'UPLOADS_DIR',
    required: false,
    description: 'Local uploads directory path',
    defaultValue: './uploads',
  },
  {
    key: 'STAFF_TOKEN',
    required: false,
    description: 'Legacy staff authentication token',
    sensitive: true,
  },
  {
    key: 'PORT',
    required: false,
    description: 'Server port number',
    defaultValue: '3001',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 && parseInt(value) < 65536,
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  invalid: string[];
}

/**
 * Validate all environment variables according to requirements
 */
export function validateEnvironmentConfig(): ValidationResult {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];
  const invalid: string[] = [];

  console.log(`🔍 Validating environment configuration for: ${nodeEnv}`);

  for (const requirement of CONFIG_REQUIREMENTS) {
    const { key, required, environments, description, validator, defaultValue, sensitive } = requirement;
    const value = process.env[key];

    // Check if this requirement applies to current environment
    const appliesToEnv = !environments || environments.includes(nodeEnv);
    
    if (!appliesToEnv) continue;

    // Check if required value is missing
    if (required && !value) {
      const errorMsg = `❌ MISSING: ${key} - ${description}`;
      errors.push(errorMsg);
      missing.push(key);
      console.error(errorMsg);
      continue;
    }

    // Check if value exists but is invalid
    if (value && validator && !validator(value)) {
      const errorMsg = `❌ INVALID: ${key} - ${description}`;
      errors.push(errorMsg);
      invalid.push(key);
      console.error(errorMsg);
      continue;
    }

    // Set default value if missing and not required
    if (!value && defaultValue) {
      process.env[key] = defaultValue;
      console.log(`✅ DEFAULT: ${key} = ${defaultValue}`);
      continue;
    }

    // Warn about missing optional values that might be needed
    if (!value && !required) {
      const warningMsg = `⚠️  OPTIONAL: ${key} not set - ${description}`;
      warnings.push(warningMsg);
      console.warn(warningMsg);
      continue;
    }

    // Log successful validation (without sensitive values)
    if (value) {
      const displayValue = sensitive ? '[REDACTED]' : value;
      console.log(`✅ VALID: ${key} = ${displayValue}`);
    }
  }

  const valid = errors.length === 0;

  // Summary
  console.log('\n📊 Environment Validation Summary:');
  console.log(`   ✅ Valid: ${valid ? 'YES' : 'NO'}`);
  console.log(`   ❌ Errors: ${errors.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}`);
  
  return {
    valid,
    errors,
    warnings,
    missing,
    invalid,
  };
}

/**
 * Validate configuration and exit if critical errors found
 */
export function validateConfigOrExit(): void {
  const result = validateEnvironmentConfig();

  if (!result.valid) {
    console.error('\n🚨 CRITICAL CONFIGURATION ERRORS DETECTED:');
    result.errors.forEach(error => console.error(error));
    
    console.error('\n💡 To fix these errors:');
    console.error('   1. Create or update your .env.local file');
    console.error('   2. Set all required environment variables');
    console.error('   3. Restart the application');
    
    console.error('\n🛑 Application startup ABORTED due to configuration errors.');
    process.exit(1);
  }

  console.log('\n✅ All critical configuration validated successfully!');
}

/**
 * Get configuration value with fallback and validation
 */
export function getConfigValue(
  key: string, 
  fallback?: string,
  required: boolean = false
): string {
  const value = process.env[key];
  
  if (!value && required) {
    throw new Error(`Required configuration ${key} is missing`);
  }
  
  return value || fallback || '';
}

/**
 * Check if application is running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if application is running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get database configuration with validation
 */
export function getDatabaseConfig(): {
  url: string;
  ssl: boolean;
} {
  const databaseUrl = getConfigValue('DATABASE_URL', undefined, true);
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  return {
    url: databaseUrl,
    ssl: isProduction, // Enable SSL in production
  };
}