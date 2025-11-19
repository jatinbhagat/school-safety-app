import nodemailer from 'nodemailer';

// AWS SES configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@safelynotify.com';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via AWS SES
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send verification email to admin
 */
export async function sendVerificationEmail(email: string, token: string, institutionName: string): Promise<void> {
  const verificationUrl = `${APP_URL}/auth/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: `Verify your SafelyNotify.com account - ${institutionName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Welcome to SafelyNotify.com!</h1>
        <p>Thank you for creating an account for <strong>${institutionName}</strong>.</p>
        <p>Please verify your email address by clicking the button below:</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p style="color: #6B7280; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 40px;">
          This link will expire in 24 hours.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your SafelyNotify.com password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Password Reset Request</h1>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to reset your password:</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #6B7280; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 40px;">
          This link will expire in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

/**
 * Send welcome email after successful onboarding
 */
export async function sendWelcomeEmail(email: string, institutionName: string, urlSlug: string): Promise<void> {
  const kioskUrl = `${APP_URL}/kiosk/${urlSlug}`;
  const adminUrl = `${APP_URL}/admin`;

  await sendEmail({
    to: email,
    subject: `Welcome to SafelyNotify.com - ${institutionName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">🎉 Welcome to SafelyNotify.com!</h1>
        <p>Congratulations! Your institution <strong>${institutionName}</strong> is now set up.</p>

        <h2 style="color: #3B82F6; margin-top: 30px;">Your Institution URLs:</h2>
        <ul style="line-height: 1.8;">
          <li><strong>Kiosk URL:</strong> <a href="${kioskUrl}">${kioskUrl}</a></li>
          <li><strong>Admin Dashboard:</strong> <a href="${adminUrl}">${adminUrl}</a></li>
        </ul>

        <h2 style="color: #3B82F6; margin-top: 30px;">Next Steps:</h2>
        <ol style="line-height: 1.8;">
          <li>Log in to your admin dashboard</li>
          <li>Upload your institution logo</li>
          <li>Generate QR code for your kiosk</li>
          <li>Test the kiosk reporting system</li>
          <li>Invite staff members</li>
        </ol>

        <p style="margin-top: 40px;">
          <a href="${adminUrl}"
             style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 40px 0;">
        <p style="color: #6B7280; font-size: 14px;">
          Need help? Contact us at <a href="mailto:support@safelynotify.com">support@safelynotify.com</a>
        </p>
      </div>
    `,
  });
}
