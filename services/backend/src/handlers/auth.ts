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
 * POST /api/auth/check-email
 * Check if email exists and return institution info
 */
export async function checkEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide an email address',
      });
    }

    // Find admin with this email
    const result = await pool.query(
      `SELECT a.id, a.email, i.institution_name, i.logo_url, i.is_active
       FROM institution_admins a
       JOIN institutions i ON i.id = a.institution_id
       WHERE a.email = $1 AND a.is_active = true`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Email not found',
        message: 'No account found with this email address',
      });
    }

    const admin = result.rows[0];

    res.json({
      exists: true,
      institutionName: admin.institution_name,
      institutionLogo: admin.logo_url,
      isActive: admin.is_active,
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      error: 'Failed to check email',
      message: 'An error occurred while checking the email',
    });
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
      `SELECT a.id, a.name, a.email, a.role, a.phone, a.created_at, a.last_login_at,
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
      created_at: user.created_at,
      last_login_at: user.last_login_at,
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

/**
 * PATCH /api/auth/profile
 * Update current user's profile
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, phone, currentPassword, newPassword } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const adminId = req.admin.adminId;
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;

    // Update name and phone
    updateFields.push(`name = $${paramCount++}`);
    updateValues.push(name);

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount++}`);
      updateValues.push(phone || null);
    }

    // Handle password update if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      // Get current password hash to verify
      const adminResult = await pool.query(
        'SELECT password_hash FROM institution_admins WHERE id = $1',
        [adminId]
      );

      if (adminResult.rows.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const admin = adminResult.rows[0];

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, admin.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      updateFields.push(`password_hash = $${paramCount++}`);
      updateValues.push(newPasswordHash);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(adminId);

    // Update the admin
    const updateQuery = `
      UPDATE institution_admins 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, email, phone, role, email_verified, last_login_at, created_at, institution_id
    `;

    const updateResult = await pool.query(updateQuery, updateValues);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const updatedAdmin = updateResult.rows[0];

    // Get institution details
    const instResult = await pool.query(
      `SELECT institution_name, url_slug, logo_url, brand_color 
       FROM institutions WHERE id = $1`,
      [updatedAdmin.institution_id]
    );

    const institution = instResult.rows[0];

    // Create audit log for profile update
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, 'update_profile', 'admin', $3, $4)`,
      [
        updatedAdmin.institution_id,
        adminId,
        adminId,
        JSON.stringify({ name, phone, passwordChanged: !!newPassword })
      ]
    );

    res.json({
      success: true,
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      phone: updatedAdmin.phone,
      role: updatedAdmin.role,
      email_verified: updatedAdmin.email_verified,
      last_login_at: updatedAdmin.last_login_at,
      created_at: updatedAdmin.created_at,
      institution: {
        id: updatedAdmin.institution_id,
        institution_name: institution?.institution_name,
        url_slug: institution?.url_slug,
        logo_url: institution?.logo_url,
        brand_color: institution?.brand_color,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
