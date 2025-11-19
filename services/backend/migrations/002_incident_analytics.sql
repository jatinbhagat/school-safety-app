-- Migration: Create incident analytics tables
-- Description: Tables for storing incident locations, tags, and pre-computed aggregates for heatmap visualization

-- Create analytics schema for separation of concerns
CREATE SCHEMA IF NOT EXISTS analytics;

-- Table: incident_locations
-- Purpose: Store spatial data for incidents to enable heatmap visualization
CREATE TABLE IF NOT EXISTS incident_locations (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    class_section TEXT,
    x_coord DECIMAL(10, 6),
    y_coord DECIMAL(10, 6),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure one location per incident
    CONSTRAINT unique_incident_location UNIQUE(incident_id)
);

-- Indexes for spatial queries
CREATE INDEX idx_incident_locations_incident_id ON incident_locations(incident_id);
CREATE INDEX idx_incident_locations_coords ON incident_locations(x_coord, y_coord);
CREATE INDEX idx_incident_locations_class_section ON incident_locations(class_section);

-- Table: incident_tags
-- Purpose: Store categorization tags for incidents (many-to-many relationship)
CREATE TABLE IF NOT EXISTS incident_tags (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent duplicate tags for the same incident
    CONSTRAINT unique_incident_tag UNIQUE(incident_id, tag)
);

-- Indexes for tag queries
CREATE INDEX idx_incident_tags_incident_id ON incident_tags(incident_id);
CREATE INDEX idx_incident_tags_tag ON incident_tags(tag);

-- Table: analytics.incident_aggregates
-- Purpose: Pre-computed daily aggregates for fast heatmap rendering
CREATE TABLE IF NOT EXISTS analytics.incident_aggregates (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    class_section TEXT,
    category TEXT,
    x_coord DECIMAL(10, 6),
    y_coord DECIMAL(10, 6),
    incident_count INTEGER DEFAULT 0 NOT NULL,
    recurrence_count INTEGER DEFAULT 0 NOT NULL,
    severity_avg DECIMAL(4, 2),
    status_breakdown JSONB,
    last_computed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint for aggregation key
    CONSTRAINT unique_daily_aggregate UNIQUE(date, class_section, category, x_coord, y_coord)
);

-- Indexes for analytics queries
CREATE INDEX idx_aggregates_date ON analytics.incident_aggregates(date DESC);
CREATE INDEX idx_aggregates_class_section ON analytics.incident_aggregates(class_section);
CREATE INDEX idx_aggregates_category ON analytics.incident_aggregates(category);
CREATE INDEX idx_aggregates_coords ON analytics.incident_aggregates(x_coord, y_coord);

-- Comments for documentation
COMMENT ON SCHEMA analytics IS 'Schema for pre-computed analytics and aggregated data';

COMMENT ON TABLE incident_locations IS 'Spatial location data for incidents to enable heatmap visualization';
COMMENT ON COLUMN incident_locations.incident_id IS 'Foreign key reference to incidents table';
COMMENT ON COLUMN incident_locations.class_section IS 'Classroom or section identifier';
COMMENT ON COLUMN incident_locations.x_coord IS 'X coordinate (longitude or map position)';
COMMENT ON COLUMN incident_locations.y_coord IS 'Y coordinate (latitude or map position)';

COMMENT ON TABLE incident_tags IS 'Flexible tagging system for incident categorization';
COMMENT ON COLUMN incident_tags.incident_id IS 'Foreign key reference to incidents table';
COMMENT ON COLUMN incident_tags.tag IS 'Tag name (e.g., "recurring", "urgent", "resolved")';

COMMENT ON TABLE analytics.incident_aggregates IS 'Pre-computed daily aggregates for heatmap performance';
COMMENT ON COLUMN analytics.incident_aggregates.date IS 'Aggregation date (daily granularity)';
COMMENT ON COLUMN analytics.incident_aggregates.class_section IS 'Classroom/section filter';
COMMENT ON COLUMN analytics.incident_aggregates.category IS 'Incident category filter';
COMMENT ON COLUMN analytics.incident_aggregates.incident_count IS 'Total number of incidents for this aggregate';
COMMENT ON COLUMN analytics.incident_aggregates.recurrence_count IS 'Number of recurring incidents (based on similar location/category)';
COMMENT ON COLUMN analytics.incident_aggregates.severity_avg IS 'Average severity score (from AI metadata)';
COMMENT ON COLUMN analytics.incident_aggregates.status_breakdown IS 'JSON object with status counts {open: N, resolved: N, ...}';
COMMENT ON COLUMN analytics.incident_aggregates.last_computed_at IS 'Timestamp of last ETL computation';
