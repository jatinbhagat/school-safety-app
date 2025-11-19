import { Request, Response } from 'express';
import { pool } from '../db';
import { validatePassword, hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateVerificationToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';

/**
 * POST /api/auth/verify-email
 * Verify email and set password
 */
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Missing token or password',
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.message,
      });
    }

    // Find admin with this verification token
    const result = await pool.query(
      `SELECT a.*, i.institution_name, i.url_slug
       FROM institution_admins a
       JOIN institutions i ON i.id = a.institution_id
       WHERE a.verification_token = $1
         AND a.verification_token_expires_at > NOW()
         AND a.email_verified = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
      });
    }

    const admin = result.rows[0];

    // Hash password
    const passwordHash = await hashPassword(password);

    // Update admin: mark verified, set password, clear token
    await pool.query(
      `UPDATE institution_admins
       SET email_verified = true,
           password_hash = $1,
           verification_token = NULL,
           verification_token_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, admin.id]
    );

    // Generate JWT token
    const jwtToken = generateToken({
      adminId: admin.id,
      institutionId: admin.institution_id,
      email: admin.email,
      role: admin.role,
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(admin.email, admin.institution_name, admin.url_slug);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
      accessToken: jwtToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        institution: {
          id: admin.institution_id,
          name: admin.institution_name,
          urlSlug: admin.url_slug,
        },
      },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find admin
    const result = await pool.query(
      `SELECT a.*, i.institution_name, i.url_slug, i.is_active as institution_active
       FROM institution_admins a
       JOIN institutions i ON i.id = a.institution_id
       WHERE a.email = $1 AND a.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const admin = result.rows[0];

    // Check if email is verified
    if (!admin.email_verified) {
      return res.status(403).json({
        error: 'Email not verified. Please check your email for verification link.',
      });
    }

    // Check if institution is active
    if (!admin.institution_active) {
      return res.status(403).json({
        error: 'Your institution account is inactive. Please contact support.',
      });
    }

    // Compare password
    const passwordMatch = await comparePassword(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const jwtToken = generateToken({
      adminId: admin.id,
      institutionId: admin.institution_id,
      email: admin.email,
      role: admin.role,
    });

    // Update last login
    await pool.query(
      'UPDATE institution_admins SET last_login_at = NOW() WHERE id = $1',
      [admin.id]
    );

    res.json({
      success: true,
      accessToken: jwtToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        institution: {
          id: admin.institution_id,
          name: admin.institution_name,
          urlSlug: admin.url_slug,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find admin
    const result = await pool.query(
      'SELECT id, email FROM institution_admins WHERE email = $1 AND is_active = true',
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const admin = result.rows[0];

    // Generate reset token
    const resetToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token
    await pool.query(
      `UPDATE institution_admins
       SET reset_token = $1, reset_token_expires_at = $2
       WHERE id = $3`,
      [resetToken, expiresAt, admin.id]
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(admin.email, resetToken);
    } catch (error) {
      console.error('Failed to send reset email:', error);
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Find admin with token
    const result = await pool.query(
      `SELECT id FROM institution_admins
       WHERE reset_token = $1
         AND reset_token_expires_at > NOW()
         AND is_active = true`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const admin = result.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear token
    await pool.query(
      `UPDATE institution_admins
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, admin.id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

/**
 * GET /api/auth/me
 * Get current user info (authenticated)
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await pool.query(
      `SELECT a.id, a.name, a.email, a.role, a.phone,
              i.id as institution_id, i.institution_name, i.url_slug,
              i.logo_url, i.brand_color
       FROM institution_admins a
       JOIN institutions i ON i.id = a.institution_id
       WHERE a.id = $1`,
      [req.admin.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      institution: {
        id: user.institution_id,
        name: user.institution_name,
        urlSlug: user.url_slug,
        logoUrl: user.logo_url,
        brandColor: user.brand_color,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
}
