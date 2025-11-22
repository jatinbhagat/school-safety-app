-- Migration: Push Notification Infrastructure
-- Description: Add tables for push notifications, device tokens, and notification preferences

-- Table: push_notification_tokens
-- Stores device tokens for push notifications (FCM/Expo)
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES institution_admins(id) ON DELETE CASCADE,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  token TEXT NOT NULL,
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, token)
);

CREATE INDEX idx_push_tokens_admin ON push_notification_tokens(admin_id);
CREATE INDEX idx_push_tokens_active ON push_notification_tokens(is_active) WHERE is_active = true;

-- Table: notification_preferences
-- User preferences for different types of notifications
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES institution_admins(id) ON DELETE CASCADE,

  -- Notification channels
  enable_push BOOLEAN DEFAULT true,
  enable_email BOOLEAN DEFAULT true,
  enable_sms BOOLEAN DEFAULT false,

  -- Incident notifications
  notify_new_incident BOOLEAN DEFAULT true,
  notify_high_urgency BOOLEAN DEFAULT true,
  notify_assigned_to_me BOOLEAN DEFAULT true,
  notify_status_change BOOLEAN DEFAULT true,
  notify_new_comment BOOLEAN DEFAULT true,

  -- False report notifications
  notify_marked_false BOOLEAN DEFAULT true,
  notify_dispute_submitted BOOLEAN DEFAULT true,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id)
);

CREATE INDEX idx_notification_prefs_admin ON notification_preferences(admin_id);

-- Table: notification_delivery_log
-- Track notification delivery and engagement
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,
  incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notif_log_admin ON notification_delivery_log(admin_id);
CREATE INDEX idx_notif_log_incident ON notification_delivery_log(incident_id);
CREATE INDEX idx_notif_log_status ON notification_delivery_log(status);
CREATE INDEX idx_notif_log_created ON notification_delivery_log(created_at DESC);

-- Create default notification preferences for existing admins
INSERT INTO notification_preferences (admin_id)
SELECT id FROM institution_admins
ON CONFLICT (admin_id) DO NOTHING;

-- Comments
COMMENT ON TABLE push_notification_tokens IS 'Stores device tokens for push notifications via FCM/Expo';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification channels and types';
COMMENT ON TABLE notification_delivery_log IS 'Audit log for notification delivery and engagement tracking';
