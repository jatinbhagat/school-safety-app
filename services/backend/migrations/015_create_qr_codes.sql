-- Migration: Create qr_codes table
-- Description: Generated QR codes for institutions (immutable)

CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    -- QR Code Data
    qr_code_url TEXT NOT NULL, -- S3 URL to QR code image
    qr_code_data TEXT NOT NULL, -- The URL encoded in QR (kiosk URL)
    qr_type TEXT DEFAULT 'kiosk' CHECK (qr_type IN ('kiosk', 'admin', 'custom')),

    -- Image Properties
    size INTEGER DEFAULT 512, -- Image size in pixels
    format TEXT DEFAULT 'png',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- One QR code per type per institution (immutable)
    UNIQUE(institution_id, qr_type)
);

-- Indexes
CREATE INDEX idx_qr_institution ON qr_codes(institution_id);
CREATE INDEX idx_qr_type ON qr_codes(qr_type);

-- Comments
COMMENT ON TABLE qr_codes IS 'Generated QR codes for institution kiosks (immutable - no regeneration)';
COMMENT ON COLUMN qr_codes.qr_code_data IS 'The kiosk URL encoded in the QR code';
COMMENT ON COLUMN qr_codes.qr_type IS 'Type of QR code: kiosk (for public reporting), admin (for staff), custom';
