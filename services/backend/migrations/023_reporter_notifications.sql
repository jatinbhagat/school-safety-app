-- Migration: Reporter Notification System
-- Description: Enable status updates and tracking for reporters who provide contact info

-- Add notification tracking to incidents table
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS reporter_notification_preference VARCHAR(20) DEFAULT 'both' CHECK (reporter_notification_preference IN ('email', 'sms', 'both', 'none')),
  ADD COLUMN IF NOT EXISTS reporter_notification_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS reporter_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS reporter_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS reporter_notified_on_submit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reporter_last_notified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_incidents_notification_token ON incidents(reporter_notification_token) WHERE reporter_notification_token IS NOT NULL;

-- Table: reporter_notifications
-- Log of all notifications sent to reporters
CREATE TABLE IF NOT EXISTS reporter_notifications (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'report_received',
    'status_changed',
    'assigned_to_staff',
    'resolved',
    'closed',
    'flagged_as_false',
    'dispute_received'
  )),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms')),
  recipient_contact TEXT NOT NULL,
  message_subject VARCHAR(255),
  message_content TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reporter_notifs_incident ON reporter_notifications(incident_id);
CREATE INDEX idx_reporter_notifs_status ON reporter_notifications(status);
CREATE INDEX idx_reporter_notifs_type ON reporter_notifications(notification_type);
CREATE INDEX idx_reporter_notifs_created ON reporter_notifications(created_at DESC);

-- Table: notification_templates
-- Email and SMS templates for different notification types
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(50) NOT NULL UNIQUE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms')),
  subject VARCHAR(255),
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = true;

-- Insert default email templates
INSERT INTO notification_templates (template_key, channel, subject, body_template, variables) VALUES
  (
    'report_received_email',
    'email',
    'Your Safety Report Has Been Received',
    E'Thank you for submitting a safety report.\n\nReference Number: {{incident_id}}\nCategory: {{category}}\nSubmitted: {{submitted_at}}\n\nYour report is being reviewed by our safety team. We take all reports seriously and will investigate promptly.\n\nTrack your report:\n{{tracking_url}}\n\nThis is an automated message. Please do not reply to this email.',
    '["incident_id", "category", "submitted_at", "tracking_url"]'::jsonb
  ),
  (
    'status_changed_email',
    'email',
    'Update on Your Report #{{incident_id}}',
    E'Your safety report has been updated.\n\nReference Number: {{incident_id}}\nNew Status: {{new_status}}\n\nWhat this means:\n{{status_description}}\n\nView details:\n{{tracking_url}}\n\nThank you for helping keep our community safe.',
    '["incident_id", "new_status", "status_description", "tracking_url"]'::jsonb
  ),
  (
    'resolved_email',
    'email',
    'Report #{{incident_id}} Has Been Resolved',
    E'Your safety report has been resolved.\n\nReference Number: {{incident_id}}\nResolved: {{resolved_at}}\n\nYour report was investigated and appropriate action has been taken in accordance with our policies.\n\nIf you have concerns about the resolution or if the issue persists, please contact us directly or submit a new report.\n\nView full timeline:\n{{tracking_url}}\n\nThank you for your report.',
    '["incident_id", "resolved_at", "tracking_url"]'::jsonb
  ),
  (
    'flagged_false_email',
    'email',
    'Report #{{incident_id}} Requires Verification',
    E'Your report submitted on {{submitted_at}} has been flagged during our review process.\n\nReference Number: {{incident_id}}\nReason: {{flag_reason}}\n\nIf you believe this is an error or have additional evidence, you can submit a dispute:\n\n{{dispute_url}}\n\nDeadline: {{dispute_deadline}}\n\nIf we don''t hear from you, this report will be closed as unverified.',
    '["incident_id", "submitted_at", "flag_reason", "dispute_url", "dispute_deadline"]'::jsonb
  );

-- Insert default SMS templates
INSERT INTO notification_templates (template_key, channel, subject, body_template, variables) VALUES
  (
    'report_received_sms',
    'sms',
    NULL,
    'Your safety report has been received. Ref #{{incident_id}}. Track: {{tracking_url}}',
    '["incident_id", "tracking_url"]'::jsonb
  ),
  (
    'status_changed_sms',
    'sms',
    NULL,
    'Update: Report #{{incident_id}} - Status: {{new_status}}. View: {{tracking_url}}',
    '["incident_id", "new_status", "tracking_url"]'::jsonb
  ),
  (
    'resolved_sms',
    'sms',
    NULL,
    'Report #{{incident_id}} has been resolved. View details: {{tracking_url}}',
    '["incident_id", "tracking_url"]'::jsonb
  );

-- Comments
COMMENT ON TABLE reporter_notifications IS 'Log of all notifications sent to incident reporters';
COMMENT ON TABLE notification_templates IS 'Email and SMS templates with variable substitution';
COMMENT ON COLUMN incidents.reporter_notification_token IS 'Unique token for anonymous report tracking (64-char random string)';
COMMENT ON COLUMN incidents.reporter_contact_email IS 'Encrypted email address for reporter notifications';
COMMENT ON COLUMN incidents.reporter_contact_phone IS 'Encrypted phone number for reporter notifications';
