/**
 * Twilio SMS Service
 * Handles sending SMS messages via Twilio API
 */

interface SMSOptions {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  message: string;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromPhone: string;
}

class TwilioService {
  private accountSid: string;
  private authToken: string;
  private fromPhone: string;

  constructor(config: TwilioConfig) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.fromPhone = config.fromPhone;
  }

  /**
   * Send an SMS via Twilio
   */
  async sendSMS(options: SMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accountSid || this.accountSid === 'your_twilio_account_sid_here') {
      console.warn('⚠️ Twilio not configured. SMS not sent.');
      return { success: false, error: 'Twilio not configured' };
    }

    // Validate phone number format
    if (!options.to.startsWith('+')) {
      return { success: false, error: 'Phone number must be in E.164 format (e.g., +1234567890)' };
    }

    try {
      // Twilio API endpoint
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      // Create Basic Auth credentials
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      // Prepare form data
      const formData = new URLSearchParams();
      formData.append('To', options.to);
      formData.append('From', this.fromPhone);
      formData.append('Body', options.message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SMS sent successfully via Twilio:', data.sid);
        return { success: true, messageId: data.sid };
      } else {
        const errorData = await response.json();
        console.error('❌ Twilio error:', errorData);
        return { success: false, error: errorData.message || 'Failed to send SMS' };
      }
    } catch (error) {
      console.error('❌ Failed to send SMS via Twilio:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Validate a phone number is in correct format
   */
  validatePhoneNumber(phone: string): boolean {
    // Basic E.164 validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }
}

// Initialize Twilio service
const twilioConfig: TwilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid_here',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token_here',
  fromPhone: process.env.TWILIO_FROM_PHONE || '+15555555555',
};

export const twilioService = new TwilioService(twilioConfig);
export default twilioService;
