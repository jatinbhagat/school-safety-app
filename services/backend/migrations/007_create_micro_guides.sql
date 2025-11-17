-- Migration: Create micro_guides table
-- Description: Stores generated micro-guides for safety topics

CREATE TABLE IF NOT EXISTS micro_guides (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  tags VARCHAR(255)[] DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 60,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by enabled status
CREATE INDEX idx_micro_guides_enabled ON micro_guides(enabled);

-- Index for searching by tags (GIN index for array operations)
CREATE INDEX idx_micro_guides_tags ON micro_guides USING GIN(tags);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_micro_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_micro_guides_timestamp
  BEFORE UPDATE ON micro_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_micro_guides_updated_at();
