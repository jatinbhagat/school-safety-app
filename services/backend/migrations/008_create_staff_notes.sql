-- Migration 008: Create staff_notes table
-- Stores notes added by staff members on incidents

-- =====================================================
-- Table: staff_notes
-- Stores staff notes and comments on incidents
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_notes (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL,                 -- Foreign key to incidents table

  -- Note content
  note_text TEXT NOT NULL,                      -- The actual note content

  -- Author information
  author_name VARCHAR(255) NOT NULL,            -- Name of staff member who added note
  author_role VARCHAR(100),                     -- Role of staff member (counselor, admin, etc.)
  author_email VARCHAR(255),                    -- Email of staff member

  -- Metadata
  is_internal BOOLEAN DEFAULT false,            -- True if note is internal-only (not shared with student)
  note_type VARCHAR(50) DEFAULT 'general'       -- Type: 'general', 'action_taken', 'follow_up', 'resolution'
    CHECK (note_type IN ('general', 'action_taken', 'follow_up', 'resolution')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Foreign key to incidents table
ALTER TABLE staff_notes
  ADD CONSTRAINT fk_staff_notes_incident
  FOREIGN KEY (incident_id)
  REFERENCES incidents(id)
  ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_staff_notes_incident_id ON staff_notes(incident_id);
CREATE INDEX idx_staff_notes_created_at ON staff_notes(created_at DESC);
CREATE INDEX idx_staff_notes_author_email ON staff_notes(author_email);

-- Comments for documentation
COMMENT ON TABLE staff_notes IS 'Staff notes and comments on incidents';
COMMENT ON COLUMN staff_notes.note_text IS 'The actual note/comment content';
COMMENT ON COLUMN staff_notes.is_internal IS 'Whether note is for internal staff use only';
COMMENT ON COLUMN staff_notes.note_type IS 'Category of note: general, action_taken, follow_up, or resolution';
