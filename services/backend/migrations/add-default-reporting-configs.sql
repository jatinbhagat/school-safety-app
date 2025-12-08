-- Migration: Add Default Reporting Configurations
-- Description: Adds default category configurations for Demo, Schools, Colleges, and Corporates
-- Date: 2024-11-24
-- Version: 2.0

-- Check if tenant_reporting_config table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_reporting_config') THEN
        RAISE EXCEPTION 'tenant_reporting_config table does not exist. Please create the table first.';
    END IF;
END $$;

-- Insert Demo Configuration (UUID: 00000000-0000-0000-0000-000000000001)
INSERT INTO tenant_reporting_config (tenant_id, config) VALUES 
('00000000-0000-0000-0000-000000000001', '{
  "categories": [
    {
      "id": "general-incident",
      "name": "General Incident",
      "description": "Any type of incident or safety concern",
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
      "id": "safety-concern",
      "name": "Safety Concern",
      "description": "Safety hazards or concerns that need attention",
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
      "id": "other",
      "name": "Other",
      "description": "Any other type of incident that doesn''t fit the above categories",
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
}')
ON CONFLICT (tenant_id) DO UPDATE SET 
  config = EXCLUDED.config,
  updated_at = NOW();

-- Insert Schools Configuration (UUID: 00000000-0000-0000-0000-000000000002)
INSERT INTO tenant_reporting_config (tenant_id, config) VALUES 
('00000000-0000-0000-0000-000000000002', '{
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
}')
ON CONFLICT (tenant_id) DO UPDATE SET 
  config = EXCLUDED.config,
  updated_at = NOW();

-- Insert Colleges Configuration (UUID: 00000000-0000-0000-0000-000000000003)
INSERT INTO tenant_reporting_config (tenant_id, config) VALUES 
('00000000-0000-0000-0000-000000000003', '{
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
}')
ON CONFLICT (tenant_id) DO UPDATE SET 
  config = EXCLUDED.config,
  updated_at = NOW();

-- Insert Corporates Configuration (UUID: 00000000-0000-0000-0000-000000000004)
INSERT INTO tenant_reporting_config (tenant_id, config) VALUES 
('00000000-0000-0000-0000-000000000004', '{
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
}')
ON CONFLICT (tenant_id) DO UPDATE SET 
  config = EXCLUDED.config,
  updated_at = NOW();

-- Verification: Check that all configurations were inserted
DO $$
DECLARE
    config_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO config_count 
    FROM tenant_reporting_config 
    WHERE tenant_id IN (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002', 
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004'
    );
    
    RAISE NOTICE 'Migration completed successfully. Inserted % default reporting configurations.', config_count;
    
    IF config_count != 4 THEN
        RAISE WARNING 'Expected 4 configurations but found %. Please verify the migration.', config_count;
    END IF;
END $$;

-- Display summary of inserted configurations
SELECT 
    tenant_id,
    jsonb_array_length(config->'categories') as category_count,
    created_at,
    updated_at
FROM tenant_reporting_config 
WHERE tenant_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', 
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
)
ORDER BY tenant_id;