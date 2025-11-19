import { Request, Response } from 'express';
import { pool } from '../db';
import { generateToken, generateVerificationToken } from '../utils/jwt';
import { sendVerificationEmail } from '../utils/email';
import { validatePassword, hashPassword } from '../utils/password';

/**
 * POST /api/onboarding/check-slug
 * Check if URL slug is available
 */
export async function checkSlug(req: Request, res: Response) {
  try {
    const { slug } = req.body;

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        error: 'Invalid slug format. Only lowercase letters, numbers, and hyphens allowed',
      });
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
      `${slug}-college`,
    ];

    res.json({
      available,
      slug,
      suggestedAlternatives,
    });
  } catch (error) {
    console.error('Check slug error:', error);
    res.status(500).json({ error: 'Failed to check slug availability' });
  }
}

/**
 * POST /api/onboarding/start
 * Initialize onboarding and create institution record
 */
export async function startOnboarding(req: Request, res: Response) {
  try {
    const {
      institutionType,
      institutionName,
      location,
      email,
      contactName,
      phone,
    } = req.body;

    // Validate required fields
    if (!institutionType || !institutionName || !location || !email || !contactName || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['institutionType', 'institutionName', 'location', 'email', 'contactName', 'phone'],
      });
    }

    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM institutions WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'An institution with this email already exists',
      });
    }

    // Determine access type
    const isEducational = ['school', 'college', 'university'].includes(institutionType);
    const accessType = isEducational ? 'free' : 'demo_required';

    // Auto-generate URL slug from institution name
    const autoSlug = institutionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Insert institution
    const result = await pool.query(
      `INSERT INTO institutions (
        institution_name, institution_type, location,
        contact_name, email, phone, url_slug, access_type, onboarding_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, url_slug, access_type`,
      [
        institutionName,
        institutionType,
        location,
        contactName,
        email,
        phone,
        autoSlug,
        accessType,
        JSON.stringify(req.body),
      ]
    );

    const institution = result.rows[0];

    res.json({
      success: true,
      institutionId: institution.id,
      urlSlug: institution.url_slug,
      accessType: institution.access_type,
      eligibleForFree: isEducational,
      message: isEducational
        ? 'Educational institution - eligible for free access'
        : 'Please book a demo to activate your account',
    });
  } catch (error) {
    console.error('Start onboarding error:', error);
    res.status(500).json({ error: 'Failed to start onboarding' });
  }
}

/**
 * POST /api/onboarding/complete
 * Complete onboarding process
 */
export async function completeOnboarding(req: Request, res: Response) {
  try {
    const {
      institutionId,
      urlSlug,
      features,
      staffEmails,
      acceptedTerms,
      password,
    } = req.body;

    if (!institutionId || !urlSlug || !acceptedTerms || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.message,
      });
    }

    // Validate URL slug availability
    const slugCheck = await pool.query(
      'SELECT id FROM institutions WHERE url_slug = $1 AND id != $2',
      [urlSlug, institutionId]
    );

    if (slugCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'URL slug already taken',
      });
    }

    // Get institution
    const instResult = await pool.query(
      'SELECT * FROM institutions WHERE id = $1',
      [institutionId]
    );

    if (instResult.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const institution = instResult.rows[0];

    // Update institution
    await pool.query(
      `UPDATE institutions
       SET url_slug = $1, onboarding_completed = true, onboarded_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [urlSlug, institutionId]
    );

    // Create institution_features
    await pool.query(
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

    // Create staff members if provided
    if (staffEmails && Array.isArray(staffEmails)) {
      for (const email of staffEmails) {
        await pool.query(
          `INSERT INTO staff_members (institution_id, email)
           VALUES ($1, $2)
           ON CONFLICT (institution_id, email) DO NOTHING`,
          [institutionId, email]
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create primary admin account with password (skip email verification)
    const adminResult = await pool.query(
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
        true, // Skip email verification
      ]
    );

    const admin = adminResult.rows[0];

    // Generate JWT token for auto-login
    const jwtToken = generateToken({
      adminId: admin.id,
      institutionId: institutionId,
      email: admin.email,
      role: admin.role,
    });

    res.json({
      success: true,
      accessToken: jwtToken,
      institution: {
        id: institutionId,
        name: institution.institution_name,
        urlSlug,
        kioskUrl: `/kiosk/${urlSlug}`,
      },
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      message: 'Onboarding complete! Redirecting to your dashboard...',
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
}
