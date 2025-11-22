/**
 * SendGrid Email Service
 * Handles sending emails via SendGrid API
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

class SendGridService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(config: SendGridConfig) {
    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  /**
   * Send an email via SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey || this.apiKey === 'your_sendgrid_api_key_here') {
      console.warn('⚠️ SendGrid API key not configured. Email not sent.');
      return { success: false, error: 'SendGrid not configured' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          content: [
            {
              type: 'text/plain',
              value: options.text,
            },
            ...(options.html
              ? [
                  {
                    type: 'text/html',
                    value: options.html,
                  },
                ]
              : []),
          ],
        }),
      });

      if (response.ok) {
        const messageId = response.headers.get('x-message-id');
        console.log('✅ Email sent successfully via SendGrid:', messageId);
        return { success: true, messageId: messageId || undefined };
      } else {
        const errorText = await response.text();
        console.error('❌ SendGrid error:', errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error('❌ Failed to send email via SendGrid:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplateEmail(
    to: string,
    templateKey: string,
    variables: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // This would integrate with your notification_templates table
    // For now, just a placeholder
    console.log('Sending template email:', { to, templateKey, variables });
    return { success: true };
  }
}

// Initialize SendGrid service
const sendGridConfig: SendGridConfig = {
  apiKey: process.env.SENDGRID_API_KEY || 'your_sendgrid_api_key_here',
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@safelynotify.com',
  fromName: process.env.SENDGRID_FROM_NAME || 'School Safety Alert',
};

export const sendGridService = new SendGridService(sendGridConfig);
export default sendGridService;
