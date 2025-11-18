-- Migration 009: Create incident_events table
-- Stores timeline events for incident tracking

-- =====================================================
-- Table: incident_events
-- Stores all events in an incident's lifecycle
-- =====================================================
CREATE TABLE IF NOT EXISTS incident_events (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL,                 -- Foreign key to incidents table

  -- Event information
  event_type VARCHAR(50) NOT NULL               -- Type of event
    CHECK (event_type IN (
      'created',                                  -- Incident initially created/reported
      'triaged',                                  -- AI triage completed
      'assigned',                                 -- Assigned to staff role/person
      'reassigned',                               -- Reassigned to different staff
      'accepted',                                 -- Staff accepted assignment
      'note_added',                               -- Staff added a note
      'status_changed',                           -- Status updated
      'escalated',                                -- Incident escalated
      'resolved',                                 -- Marked as resolved
      'closed'                                    -- Incident closed/archived
    )),

  event_description TEXT,                       -- Human-readable description of event

  -- Event metadata (flexible JSON for different event types)
  event_data JSONB,                             -- Additional event-specific data
  -- Examples:
  -- For 'assigned': { "role": "counselor", "assigned_to": "jane@school.edu" }
  -- For 'note_added': { "note_id": 123 }
  -- For 'status_changed': { "from": "open", "to": "in_progress" }

  -- Actor information (who performed this action)
  actor_name VARCHAR(255),                      -- Name of person/system that triggered event
  actor_role VARCHAR(100),                      -- Role of actor
  actor_email VARCHAR(255),                     -- Email of actor (if applicable)
  actor_type VARCHAR(50) DEFAULT 'staff'        -- 'system', 'staff', 'student', 'admin'
    CHECK (actor_type IN ('system', 'staff', 'student', 'admin')),

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Foreign key to incidents table
ALTER TABLE incident_events
  ADD CONSTRAINT fk_incident_events_incident
  FOREIGN KEY (incident_id)
  REFERENCES incidents(id)
  ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_incident_events_incident_id ON incident_events(incident_id);
CREATE INDEX idx_incident_events_created_at ON incident_events(created_at DESC);
CREATE INDEX idx_incident_events_type ON incident_events(event_type);
CREATE INDEX idx_incident_events_actor_email ON incident_events(actor_email);

-- Composite index for querying incident timeline
CREATE INDEX idx_incident_events_incident_created ON incident_events(incident_id, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE incident_events IS 'Timeline of all events in incident lifecycle';
COMMENT ON COLUMN incident_events.event_type IS 'Type of event (created, triaged, assigned, etc.)';
COMMENT ON COLUMN incident_events.event_data IS 'Flexible JSONB storage for event-specific data';
COMMENT ON COLUMN incident_events.actor_type IS 'Type of actor: system, staff, student, or admin';
