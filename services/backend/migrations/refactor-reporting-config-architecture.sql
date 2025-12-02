-- Migration: Refactor Reporting Configuration Architecture
-- Description: Replace complex tenant system with simple institution-type based templates
-- Date: 2024-11-25
-- Version: 1.0

-- Phase 1: Create new clean architecture tables

-- 1. Institution types table (max ~10 rows, templates)
CREATE TABLE institution_types (
    id SERIAL PRIMARY KEY,
    type_key VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    default_config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Institution-specific configs (sparse table, only when customized)
CREATE TABLE institution_configs (
    institution_id UUID PRIMARY KEY REFERENCES institutions(id) ON DELETE CASCADE,
    custom_config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Add type_id to institutions table
ALTER TABLE institutions ADD COLUMN type_id INTEGER REFERENCES institution_types(id);

-- Phase 2: Seed institution types with templates

-- School template
INSERT INTO institution_types (type_key, display_name, default_config) VALUES 
('school', 'Schools', '{
  "categories": [
    {
      "id": "bullying-physical-safety",
      "name": "Bullying & Physical Safety",
      "description": "Physical bullying, fights, and safety incidents",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "harassment-verbal-behaviour",
      "name": "Harassment (Verbal/Behaviour)",
      "description": "Verbal harassment, inappropriate behavior, and verbal abuse",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "cyber-safety-online-issues",
      "name": "Cyber Safety & Online Issues",
      "description": "Cyberbullying, online harassment, and digital safety concerns",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "discrimination",
      "name": "Discrimination",
      "description": "Discrimination based on race, gender, religion, or other factors",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "sexual-safety",
      "name": "Sexual Safety",
      "description": "Sexual harassment, inappropriate touching, and sexual misconduct",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "mental-emotional-wellbeing",
      "name": "Mental & Emotional Wellbeing",
      "description": "Mental health concerns, emotional distress, and wellbeing issues",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "teacher-staff-misconduct",
      "name": "Teacher/Staff Misconduct",
      "description": "Inappropriate behavior or misconduct by teachers or staff members",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "general-feedback-concerns",
      "name": "General Feedback / Concerns",
      "description": "General feedback, suggestions, or concerns about school environment",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    }
  ],
  "settings": {
    "allow_anonymous": true,
    "require_email": false,
    "notification_emails": []
  }
}');

-- College template
INSERT INTO institution_types (type_key, display_name, default_config) VALUES 
('college', 'Colleges & Universities', '{
  "categories": [
    {
      "id": "ragging-bullying",
      "name": "Ragging or Bullying",
      "description": "Ragging, bullying, and peer harassment incidents",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "harassment-misconduct",
      "name": "Harassment & Misconduct",
      "description": "Sexual harassment, discriminatory behavior, and misconduct",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "cyber-safety-online-issues",
      "name": "Cyber Safety & Online Issues",
      "description": "Cyberbullying, online harassment, and digital safety concerns",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "discrimination",
      "name": "Discrimination",
      "description": "Discrimination based on race, gender, religion, caste, or other factors",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "sexual-misconduct",
      "name": "Sexual Misconduct",
      "description": "Sexual harassment, assault, and inappropriate sexual behavior",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "mental-health-stress-support",
      "name": "Mental Health & Stress Support",
      "description": "Mental health emergencies, stress, anxiety, and counseling needs",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "faculty-administration-misconduct",
      "name": "Faculty & Administration Misconduct",
      "description": "Inappropriate behavior or misconduct by faculty and administrative staff",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "hostel-campus-infrastructure-safety",
      "name": "Hostel, Campus & Infrastructure Safety",
      "description": "Safety hazards in hostels, campus facilities, and infrastructure issues",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "academic-integrity-ethics",
      "name": "Academic Integrity & Ethics",
      "description": "Cheating, plagiarism, research misconduct, and academic dishonesty",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    }
  ],
  "settings": {
    "allow_anonymous": true,
    "require_email": false,
    "notification_emails": []
  }
}');

-- Corporate template
INSERT INTO institution_types (type_key, display_name, default_config) VALUES 
('corporate', 'Corporates', '{
  "categories": [
    {
      "id": "workplace-harassment",
      "name": "Workplace Harassment",
      "description": "Workplace bullying, verbal harassment, and hostile work environment",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "sexual-harassment",
      "name": "Sexual Harassment",
      "description": "Sexual harassment, inappropriate advances, and sexual misconduct",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "discrimination",
      "name": "Discrimination",
      "description": "Age, race, gender, disability, religion, or other discriminatory practices",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "cyber-safety-online-issues",
      "name": "Cyber Safety & Online Issues",
      "description": "Data breaches, cyberbullying, online harassment, and digital security issues",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "mental-health-burnout-wellbeing",
      "name": "Mental Health, Burnout & Wellbeing",
      "description": "Work stress, burnout, mental health concerns, and employee wellbeing",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "manager-leadership-misconduct",
      "name": "Manager/Leadership Misconduct",
      "description": "Inappropriate behavior, abuse of power, and misconduct by managers or leaders",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "fraud-corruption-ethical-violations",
      "name": "Fraud, Corruption & Ethical Violations",
      "description": "Financial misconduct, embezzlement, bribery, and ethical violations",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "infrastructure-general-issues",
      "name": "Infrastructure, General Issues",
      "description": "Workplace safety, equipment issues, facility problems, and general concerns",
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    }
  ],
  "settings": {
    "allow_anonymous": true,
    "require_email": false,
    "notification_emails": []
  }
}');

-- Phase 3: Assign type_id to existing institutions (default to corporate for now)
-- Note: You may need to manually update these based on actual institution data
UPDATE institutions 
SET type_id = (SELECT id FROM institution_types WHERE type_key = 'corporate')
WHERE type_id IS NULL;

-- Phase 4: Drop old tenant system (clean slate - no backward compatibility)
DROP TABLE IF EXISTS tenant_reporting_config;

-- Phase 5: Create indexes for performance
CREATE INDEX idx_institution_configs_institution_id ON institution_configs(institution_id);
CREATE INDEX idx_institutions_type_id ON institutions(type_id);
CREATE INDEX idx_institution_types_type_key ON institution_types(type_key);

-- Verification: Display new architecture summary
DO $$
DECLARE
    types_count INTEGER;
    institutions_count INTEGER;
    configs_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO types_count FROM institution_types;
    SELECT COUNT(*) INTO institutions_count FROM institutions WHERE type_id IS NOT NULL;
    SELECT COUNT(*) INTO configs_count FROM institution_configs;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Institution types: %', types_count;
    RAISE NOTICE 'Institutions with types: %', institutions_count;
    RAISE NOTICE 'Custom configs: %', configs_count;
END $$;

-- Display institution types summary
SELECT 
    id,
    type_key,
    display_name,
    jsonb_array_length(default_config->'categories') as category_count,
    created_at
FROM institution_types 
ORDER BY id;