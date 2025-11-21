import { Request, Response } from 'express';
import { pool } from '../db';
import { generateToken, generateVerificationToken } from '../utils/jwt';
import { sendVerificationEmail } from '../utils/email';
import { validatePassword, hashPassword } from '../utils/password';

/**
 * Error codes for onboarding flow
 */
enum OnboardingErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DUPLICATE_SLUG = 'DUPLICATE_SLUG',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INSTITUTION_NOT_FOUND = 'INSTITUTION_NOT_FOUND',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Structured error response
 */
interface ErrorResponse {
  error: string;
  message: string;
  code: OnboardingErrorCode;
  details?: any;
  timestamp: string;
}

/**
 * Create structured error response
 */
function createErrorResponse(
  code: OnboardingErrorCode,
  message: string,
  details?: any
): ErrorResponse {
  return {
    error: code,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * POST /api/onboarding/check-slug
 * Check if URL slug is available
 */
export async function checkSlug(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    const { slug } = req.body;

    // Validate slug format
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json(
        createErrorResponse(
          OnboardingErrorCode.VALIDATION_ERROR,
          'Slug is required and must be a string'
        )
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json(
        createErrorResponse(
          OnboardingErrorCode.VALIDATION_ERROR,
          'Invalid slug format. Only lowercase letters, numbers, and hyphens allowed',
          { validFormat: '^[a-z0-9-]+$' }
        )
      );
    }

    if (slug.length < 3) {
      return res.status(400).json(
        createErrorResponse(
          OnboardingErrorCode.VALIDATION_ERROR,
          'Slug must be at least 3 characters long'
        )
      );
    }

    if (slug.length > 50) {
      return res.status(400).json(
        createErrorResponse(
          OnboardingErrorCode.VALIDATION_ERROR,
          'Slug must be 50 characters or less'
        )
      );
    }

    const result = await pool.query(
      'SELECT id FROM institutions WHERE url_slug = $1',
      [slug]
    );

    const available = result.rows.length === 0;

    // Generate alternatives if taken
    const suggestedAlternatives = available ? [] : [
      `${slug}-1`,
      `${slug}-school`,
      `${slug}-edu`,
    ];

    const elapsed = Date.now() - startTime;
    console.log(`[Onboarding] Slug check for "${slug}": ${available ? 'available' : 'taken'} (${elapsed}ms)`);

    res.json({
      available,
      slug,
      suggestedAlternatives,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[Onboarding] Slug check error (${elapsed}ms):`, error);

    res.status(500).json(
      createErrorResponse(
        OnboardingErrorCode.DATABASE_ERROR,
        'Failed to check slug availability. Please try again.',
        { elapsed }
      )
    );
  }
}

/**
 * POST /api/onboarding/start
 * Initialize onboarding and create institution record
 */
export async function startOnboarding(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    const {
      institutionType,
      institutionName,
      country,
      state,
      city,
      location, // Legacy field (for backward compatibility)
      email,
      contactName,
      phone,
    } = req.body;

    console.log(`[Onboarding] Starting onboarding for: ${institutionName} (${email})`);

    // Country/state validation data
    const VALID_COUNTRIES = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'IN', 'AE', 'SG', 'ID'];
    const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
    const CA_PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
    const AU_STATES = ['NSW', 'QLD', 'SA', 'TAS', 'VIC', 'WA', 'ACT', 'NT'];
    const GB_REGIONS = ['ENG', 'SCT', 'WLS', 'NIR'];
    const IN_STATES = ['AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DH', 'DL', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'LA', 'LD', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PY', 'PB', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB'];
    const AE_EMIRATES = ['AZ', 'AJ', 'DU', 'FU', 'RK', 'SH', 'UQ'];
    const ID_PROVINCES = ['AC', 'BA', 'BB', 'BT', 'BE', 'JT', 'KT', 'ST', 'GO', 'JK', 'JA', 'JI', 'KI', 'NT', 'LA', 'MA', 'KU', 'MU', 'SA', 'SB', 'PA', 'RI', 'KR', 'SG', 'KS', 'SN', 'SS', 'JB', 'KB', 'NB', 'PB', 'SR', 'SU', 'YO'];

    // Comprehensive validation
    const validationErrors: { field: string; message: string }[] = [];

    if (!institutionType || typeof institutionType !== 'string') {
      validationErrors.push({ field: 'institutionType', message: 'Institution type is required' });
    } else if (!['school', 'college', 'university', 'corporate', 'ngo'].includes(institutionType)) {
      validationErrors.push({
        field: 'institutionType',
        message: 'Invalid institution type. Must be: school, college, university, corporate, or ngo'
      });
    }

    if (!institutionName || typeof institutionName !== 'string') {
      validationErrors.push({ field: 'institutionName', message: 'Institution name is required' });
    } else if (institutionName.trim().length < 2) {
      validationErrors.push({ field: 'institutionName', message: 'Institution name must be at least 2 characters' });
    } else if (institutionName.length > 200) {
      validationErrors.push({ field: 'institutionName', message: 'Institution name must be 200 characters or less' });
    }

    // Validate country
    if (!country || typeof country !== 'string') {
      validationErrors.push({ field: 'country', message: 'Country is required' });
    } else if (!VALID_COUNTRIES.includes(country)) {
      validationErrors.push({ field: 'country', message: 'Invalid country code' });
    }

    // Validate state (required for US, CA, AU, GB, IN, AE, ID)
    if (country && ['US', 'CA', 'AU', 'GB', 'IN', 'AE', 'ID'].includes(country)) {
      if (!state || typeof state !== 'string') {
        validationErrors.push({ field: 'state', message: 'State/Province is required for this country' });
      } else {
        // Validate state code matches country
        if (country === 'US' && !US_STATES.includes(state)) {
          validationErrors.push({ field: 'state', message: 'Invalid US state code' });
        }
        if (country === 'CA' && !CA_PROVINCES.includes(state)) {
          validationErrors.push({ field: 'state', message: 'Invalid Canadian province code' });
        }
        if (country === 'AU' && !AU_STATES.includes(state)) {
          validationErrors.push({ field: 'state', message: 'Invalid Australian state code' });
        }
        if (country === 'GB' && !GB_REGIONS.includes(state)) {
          validationErrors.push({ field: 'state', message: 'Invalid UK region code' });
        }
        if (country === 'IN' && !IN_STATES.includes(state)) {
          validationErrors.push({ field: 'state', message: 'Invalid Indian state code' });
        }
        if (country === 'AE' && !AE_EMIRATES.includes(state)) {
          validationErrors.push({ field: 'state', message: 'Invalid UAE emirate code' });
        }
        if (country === 'ID' && !ID_PROVINCES.includes(state)) {
          validationErrors.push({ field: 'state', message: 'Invalid Indonesian province code' });
        }
      }
    }

    // Validate city
    if (!city || typeof city !== 'string') {
      validationErrors.push({ field: 'city', message: 'City is required' });
    } else if (city.trim().length < 2) {
      validationErrors.push({ field: 'city', message: 'City must be at least 2 characters' });
    }

    if (!email || typeof email !== 'string') {
      validationErrors.push({ field: 'email', message: 'Email address is required' });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    if (!contactName || typeof contactName !== 'string') {
      validationErrors.push({ field: 'contactName', message: 'Contact person name is required' });
    } else if (contactName.trim().length < 2) {
      validationErrors.push({ field: 'contactName', message: 'Contact name must be at least 2 characters' });
    }

    if (!phone || typeof phone !== 'string') {
      validationErrors.push({ field: 'phone', message: 'Phone number is required' });
    } else if (phone.replace(/\D/g, '').length < 10) {
      validationErrors.push({ field: 'phone', message: 'Phone number must be at least 10 digits' });
    }

    if (validationErrors.length > 0) {
      console.log(`[Onboarding] Validation failed:`, validationErrors);
      return res.status(400).json(
        createErrorResponse(
          OnboardingErrorCode.VALIDATION_ERROR,
          'Please correct the following errors',
          { errors: validationErrors }
        )
      );
    }

    // Check if email already exists
    try {
      const existing = await pool.query(
        'SELECT id, institution_name FROM institutions WHERE email = $1',
        [email]
      );

      if (existing.rows.length > 0) {
        console.log(`[Onboarding] Duplicate email detected: ${email}`);
        return res.status(409).json(
          createErrorResponse(
            OnboardingErrorCode.DUPLICATE_EMAIL,
            'An institution with this email address already exists. Please use a different email or contact support.',
            {
              existingInstitution: existing.rows[0].institution_name,
              supportEmail: 'support@safelynotify.com'
            }
          )
        );
      }
    } catch (dbError: any) {
      console.error('[Onboarding] Database error checking email:', dbError);
      throw new Error('Database connection failed while checking email');
    }

    // Determine access type
    const isEducational = ['school', 'college', 'university'].includes(institutionType);
    const accessType = isEducational ? 'free' : 'demo_required';

    // Auto-generate URL slug from institution name
    const autoSlug = institutionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50); // Limit slug length

    // Check if slug is available, if not, append a number
    let finalSlug = autoSlug;
    let slugAttempt = 1;
    let slugAvailable = false;

    while (!slugAvailable && slugAttempt <= 10) {
      try {
        const slugCheck = await pool.query(
          'SELECT id FROM institutions WHERE url_slug = $1',
          [finalSlug]
        );

        if (slugCheck.rows.length === 0) {
          slugAvailable = true;
        } else {
          finalSlug = `${autoSlug}-${slugAttempt}`;
          slugAttempt++;
        }
      } catch (dbError: any) {
        console.error('[Onboarding] Database error checking slug:', dbError);
        throw new Error('Database connection failed while checking URL slug');
      }
    }

    if (!slugAvailable) {
      return res.status(500).json(
        createErrorResponse(
          OnboardingErrorCode.INTERNAL_ERROR,
          'Unable to generate unique URL slug. Please try again or contact support.'
        )
      );
    }

    // Generate a unique tenant_id for this institution
    const tenantId = require('crypto').randomUUID();

    // Insert institution
    let institution;
    try {
      // Try new schema first (with country, state, city columns)
      const result = await pool.query(
        `INSERT INTO institutions (
          institution_name, institution_type, country, state, city, location_legacy,
          contact_name, email, phone, url_slug, access_type, tenant_id, onboarding_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, url_slug, access_type, tenant_id, created_at`,
        [
          institutionName.trim(),
          institutionType,
          country,
          state || null,
          city.trim(),
          location ? location.trim() : null, // Legacy field
          contactName.trim(),
          email.toLowerCase().trim(),
          phone.trim(),
          finalSlug,
          accessType,
          tenantId,
          JSON.stringify({
            ...req.body,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString(),
          }),
        ]
      );

      institution = result.rows[0];
    } catch (dbError: any) {
      console.error('[Onboarding] Database error creating institution:', dbError);

      // Check if it's a missing column error (migration not run)
      if (dbError.code === '42703' || dbError.message?.includes('column') || dbError.message?.includes('does not exist')) {
        return res.status(500).json(
          createErrorResponse(
            OnboardingErrorCode.DATABASE_ERROR,
            'Database schema is not up to date. Please run migrations: npm run migrate',
            {
              error: 'Missing database columns. Run: cd services/backend && npm run migrate',
              technicalDetails: dbError.message,
            }
          )
        );
      }

      // Check for specific database errors
      if (dbError.code === '23505') { // Unique constraint violation
        if (dbError.constraint === 'institutions_email_key') {
          return res.status(409).json(
            createErrorResponse(
              OnboardingErrorCode.DUPLICATE_EMAIL,
              'This email address is already registered. Please use a different email.'
            )
          );
        }
        if (dbError.constraint === 'institutions_url_slug_key') {
          return res.status(409).json(
            createErrorResponse(
              OnboardingErrorCode.DUPLICATE_SLUG,
              'This URL slug is already taken. Please try again.'
            )
          );
        }
      }

      throw new Error('Database error while creating institution record');
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Onboarding] Institution created successfully: ID=${institution.id}, Slug=${institution.url_slug} (${elapsed}ms)`);

    res.json({
      success: true,
      institutionId: institution.id,
      urlSlug: institution.url_slug,
      accessType: institution.access_type,
      eligibleForFree: isEducational,
      message: isEducational
        ? 'Educational institution - eligible for free access'
        : 'Please book a demo to activate your account',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[Onboarding] Start onboarding error (${elapsed}ms):`, error);
    console.error('Stack trace:', error.stack);

    res.status(500).json(
      createErrorResponse(
        OnboardingErrorCode.INTERNAL_ERROR,
        'Failed to start onboarding. Please try again in a moment. If the problem persists, contact support.',
        {
          elapsed,
          errorMessage: error.message,
          supportEmail: 'support@safelynotify.com'
        }
      )
    );
  }
}

/**
 * POST /api/onboarding/complete
 * Complete onboarding process
 */
export async function completeOnboarding(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    const {
      institutionId,
      urlSlug,
      features,
      staffEmails,
      acceptedTerms,
      password,
    } = req.body;

    console.log(`[Onboarding] Completing onboarding for institution ID: ${institutionId}`);

    // Comprehensive validation
    const validationErrors: { field: string; message: string }[] = [];

    if (!institutionId) {
      validationErrors.push({ field: 'institutionId', message: 'Institution ID is required' });
    }

    if (!urlSlug || typeof urlSlug !== 'string') {
      validationErrors.push({ field: 'urlSlug', message: 'URL slug is required' });
    } else if (!/^[a-z0-9-]+$/.test(urlSlug)) {
      validationErrors.push({ field: 'urlSlug', message: 'Invalid URL slug format' });
    }

    if (!acceptedTerms) {
      validationErrors.push({ field: 'acceptedTerms', message: 'You must accept the terms and conditions' });
    }

    if (!password || typeof password !== 'string') {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    }

    if (validationErrors.length > 0) {
      console.log(`[Onboarding] Complete validation failed:`, validationErrors);
      return res.status(400).json(
        createErrorResponse(
          OnboardingErrorCode.VALIDATION_ERROR,
          'Please correct the following errors',
          { errors: validationErrors }
        )
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log(`[Onboarding] Weak password detected`);
      return res.status(400).json(
        createErrorResponse(
          OnboardingErrorCode.WEAK_PASSWORD,
          passwordValidation.message || 'Password does not meet requirements',
          {
            requirements: [
              'At least 8 characters long',
              'Contains uppercase and lowercase letters',
              'Contains at least one number',
              'Contains at least one special character'
            ]
          }
        )
      );
    }

    // Validate URL slug availability
    try {
      const slugCheck = await pool.query(
        'SELECT id FROM institutions WHERE url_slug = $1 AND id != $2',
        [urlSlug, institutionId]
      );

      if (slugCheck.rows.length > 0) {
        console.log(`[Onboarding] URL slug conflict: ${urlSlug}`);
        return res.status(409).json(
          createErrorResponse(
            OnboardingErrorCode.DUPLICATE_SLUG,
            'This URL slug is already taken. Please choose a different one.'
          )
        );
      }
    } catch (dbError: any) {
      console.error('[Onboarding] Database error checking slug:', dbError);
      throw new Error('Database connection failed while validating URL slug');
    }

    // Get institution
    let institution;
    try {
      const instResult = await pool.query(
        'SELECT * FROM institutions WHERE id = $1',
        [institutionId]
      );

      if (instResult.rows.length === 0) {
        console.log(`[Onboarding] Institution not found: ID=${institutionId}`);
        return res.status(404).json(
          createErrorResponse(
            OnboardingErrorCode.INSTITUTION_NOT_FOUND,
            'Institution not found. Please start the onboarding process again.'
          )
        );
      }

      institution = instResult.rows[0];
    } catch (dbError: any) {
      console.error('[Onboarding] Database error fetching institution:', dbError);
      throw new Error('Database connection failed while fetching institution');
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update institution
      await client.query(
        `UPDATE institutions
         SET url_slug = $1, onboarding_completed = true, onboarded_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [urlSlug, institutionId]
      );

      // Create institution_features
      await client.query(
        `INSERT INTO institution_features (
          institution_id, alerts_enabled, reports_enabled,
          notifications_enabled, analytics_enabled
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (institution_id) DO UPDATE SET
          alerts_enabled = $2, reports_enabled = $3,
          notifications_enabled = $4, analytics_enabled = $5`,
        [
          institutionId,
          features?.alerts ?? true,
          features?.reports ?? true,
          features?.notifications ?? true,
          features?.analytics ?? false,
        ]
      );

      // Create tenant reporting config by cloning from demo tenant
      // Only if tenant_id exists and config doesn't already exist
      if (institution.tenant_id) {
        await client.query(
          `INSERT INTO tenant_reporting_config (tenant_id, config)
           SELECT $1, config
           FROM tenant_reporting_config
           WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
           ON CONFLICT (tenant_id) DO NOTHING`,
          [institution.tenant_id]
        );
        console.log(`[Onboarding] Created tenant config for tenant_id: ${institution.tenant_id}`);
      }

      // Copy default routing rules for this institution
      const defaultRulesResult = await client.query(
        `SELECT keyword, staff_role, priority_boost, rule_type
         FROM routing_rules
         WHERE institution_id IS NULL OR institution_id = 0
         LIMIT 20`
      );

      if (defaultRulesResult.rows.length > 0) {
        for (const rule of defaultRulesResult.rows) {
          await client.query(
            `INSERT INTO routing_rules (
              institution_id, keyword, staff_role, priority_boost, rule_type, is_active
            ) VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (institution_id, keyword, staff_role) DO NOTHING`,
            [institutionId, rule.keyword, rule.staff_role, rule.priority_boost, rule.rule_type]
          );
        }
        console.log(`[Onboarding] Copied ${defaultRulesResult.rows.length} default routing rules`);
      }

      // Create staff members if provided
      if (staffEmails && Array.isArray(staffEmails) && staffEmails.length > 0) {
        for (const email of staffEmails) {
          if (email && typeof email === 'string') {
            await client.query(
              `INSERT INTO staff_members (institution_id, email)
               VALUES ($1, $2)
               ON CONFLICT (institution_id, email) DO NOTHING`,
              [institutionId, email.toLowerCase().trim()]
            );
          }
        }
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create primary admin account with password (skip email verification)
      const adminResult = await client.query(
        `INSERT INTO institution_admins (
          institution_id, name, email, role,
          password_hash, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, role`,
        [
          institutionId,
          institution.contact_name,
          institution.email,
          'super_admin', // First admin is always super_admin
          passwordHash,
          true, // Skip email verification for now
        ]
      );

      const admin = adminResult.rows[0];

      await client.query('COMMIT');

      // Generate JWT token for auto-login
      const jwtToken = generateToken({
        adminId: admin.id,
        institutionId: institutionId,
        email: admin.email,
        role: admin.role,
      });

      const elapsed = Date.now() - startTime;
      console.log(`[Onboarding] Onboarding completed successfully: Institution ID=${institutionId}, Admin ID=${admin.id} (${elapsed}ms)`);

      res.json({
        success: true,
        accessToken: jwtToken,
        institution: {
          id: institutionId,
          name: institution.institution_name,
          urlSlug,
          kioskUrl: `/kiosk/${urlSlug}`,
          fullKioskUrl: `https://${urlSlug}.safelynotify.com`,
        },
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        message: 'Onboarding complete! Welcome to SafelyNotify.com',
        timestamp: new Date().toISOString(),
      });

      client.release();
    } catch (txError: any) {
      await client.query('ROLLBACK');
      client.release();

      console.error('[Onboarding] Transaction error:', txError);
      throw txError;
    }
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[Onboarding] Complete onboarding error (${elapsed}ms):`, error);
    console.error('Stack trace:', error.stack);

    res.status(500).json(
      createErrorResponse(
        OnboardingErrorCode.INTERNAL_ERROR,
        'Failed to complete onboarding. Please try again. If the problem persists, contact support.',
        {
          elapsed,
          errorMessage: error.message,
          supportEmail: 'support@safelynotify.com'
        }
      )
    );
  }
}
