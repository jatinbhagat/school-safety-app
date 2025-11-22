-- Migration: False Report Management
-- Description: Add infrastructure for detecting, flagging, and managing false reports

-- Add false report tracking columns to incidents table
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS flagged_as_false BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS false_report_reason VARCHAR(100),
  ADD COLUMN IF NOT EXISTS false_report_notes TEXT,
  ADD COLUMN IF NOT EXISTS false_report_marked_by INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS false_report_marked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS false_report_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS false_report_confirmed_by INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS false_report_confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reporter_fingerprint VARCHAR(64);

CREATE INDEX idx_incidents_flagged_false ON incidents(flagged_as_false) WHERE flagged_as_false = true;
CREATE INDEX idx_incidents_reporter_fingerprint ON incidents(reporter_fingerprint);

-- Table: false_report_disputes
-- Allows reporters to dispute false report flags
CREATE TABLE IF NOT EXISTS false_report_disputes (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  dispute_reason TEXT NOT NULL,
  submitted_by VARCHAR(100) DEFAULT 'reporter',
  contact_info TEXT,
  evidence_attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'upheld', 'overturned')),
  reviewed_by INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_disputes_incident ON false_report_disputes(incident_id);
CREATE INDEX idx_disputes_status ON false_report_disputes(status);
CREATE INDEX idx_disputes_created ON false_report_disputes(created_at DESC);

-- Table: reporter_reputation
-- Privacy-preserving reputation tracking based on fingerprints
CREATE TABLE IF NOT EXISTS reporter_reputation (
  id SERIAL PRIMARY KEY,
  reporter_fingerprint VARCHAR(64) NOT NULL,
  institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
  total_reports INTEGER DEFAULT 0,
  false_reports INTEGER DEFAULT 0,
  verified_reports INTEGER DEFAULT 0,
  reputation_score NUMERIC(3,2) DEFAULT 1.00 CHECK (reputation_score >= 0 AND reputation_score <= 1),
  first_report_at TIMESTAMP WITH TIME ZONE,
  last_report_at TIMESTAMP WITH TIME ZONE,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_by INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reporter_fingerprint, institution_id)
);

CREATE INDEX idx_reporter_rep_fingerprint ON reporter_reputation(reporter_fingerprint);
CREATE INDEX idx_reporter_rep_institution ON reporter_reputation(institution_id);
CREATE INDEX idx_reporter_rep_blocked ON reporter_reputation(is_blocked) WHERE is_blocked = true;
CREATE INDEX idx_reporter_rep_score ON reporter_reputation(reputation_score);

-- Table: blocked_reporters
-- Fast lookup for blocked reporters
CREATE TABLE IF NOT EXISTS blocked_reporters (
  id SERIAL PRIMARY KEY,
  fingerprint VARCHAR(64) NOT NULL,
  institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
  blocked_by INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unblocked_at TIMESTAMP WITH TIME ZONE,
  unblocked_by INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(fingerprint, institution_id)
);

CREATE INDEX idx_blocked_reporters_fingerprint ON blocked_reporters(fingerprint);
CREATE INDEX idx_blocked_reporters_active ON blocked_reporters(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE false_report_disputes IS 'Allows reporters to dispute false report flags with evidence';
COMMENT ON TABLE reporter_reputation IS 'Anonymized reputation tracking based on device fingerprints';
COMMENT ON TABLE blocked_reporters IS 'Fast lookup table for blocked reporters by fingerprint';
COMMENT ON COLUMN incidents.reporter_fingerprint IS 'SHA-256 hash of IP + User Agent for spam detection';
COMMENT ON COLUMN reporter_reputation.reputation_score IS 'Score from 0.00 to 1.00, calculated from report accuracy';
