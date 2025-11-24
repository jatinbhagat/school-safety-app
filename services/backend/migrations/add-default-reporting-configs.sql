-- Migration: Add Default Reporting Configurations
-- Description: Adds default category configurations for Demo, Schools, Colleges, and Corporates
-- Date: 2024-11-24
-- Version: 1.0

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
      "id": "bullying-harassment",
      "name": "Bullying & Harassment",
      "description": "Physical, verbal, or cyberbullying incidents",
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
      "id": "academic-misconduct",
      "name": "Academic Misconduct",
      "description": "Cheating, plagiarism, and other academic integrity issues",
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
      "id": "violence-threats",
      "name": "Violence & Threats",
      "description": "Physical altercations, threats, and aggressive behavior",
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
      "id": "drugs-alcohol",
      "name": "Drugs & Alcohol",
      "description": "Substance abuse incidents on school property",
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
      "id": "property-damage",
      "name": "Property Damage",
      "description": "Vandalism or damage to school property",
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
      "description": "General safety hazards or concerns",
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
      "id": "weapons",
      "name": "Weapons",
      "description": "Weapons brought to school or weapon-related incidents",
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
      "id": "other-incident",
      "name": "Other Incident",
      "description": "Any other school-related incident that does not fit the above categories",
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
      "id": "harassment-discrimination",
      "name": "Harassment & Discrimination",
      "description": "Sexual harassment, discriminatory behavior, and hostile environment",
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
      "id": "academic-integrity",
      "name": "Academic Integrity",
      "description": "Cheating, plagiarism, research misconduct, and academic dishonesty",
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
      "id": "campus-safety",
      "name": "Campus Safety",
      "description": "Safety hazards, emergency situations, and security concerns",
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
      "id": "substance-abuse",
      "name": "Substance Abuse",
      "description": "Drug and alcohol incidents on campus",
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
      "id": "violence-threats",
      "name": "Violence & Threats",
      "description": "Physical violence, threats, and aggressive behavior",
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
      "id": "property-theft",
      "name": "Property & Theft",
      "description": "Theft, vandalism, and damage to campus property",
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
      "id": "mental-health-crisis",
      "name": "Mental Health Crisis",
      "description": "Mental health emergencies requiring immediate attention",
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
      "id": "faculty-staff-misconduct",
      "name": "Faculty/Staff Misconduct",
      "description": "Inappropriate behavior or misconduct by faculty or staff members",
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
      "id": "research-ethics",
      "name": "Research Ethics",
      "description": "Research misconduct, ethical violations, and compliance issues",
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
      "id": "other-incident",
      "name": "Other Incident",
      "description": "Any other campus incident that does not fit the above categories",
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
      "description": "Sexual harassment, hostile work environment, and inappropriate behavior",
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
      "id": "safety-violations",
      "name": "Safety Violations",
      "description": "OSHA violations, unsafe working conditions, and accident reporting",
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
      "id": "fraud-ethics",
      "name": "Fraud & Ethics",
      "description": "Financial misconduct, embezzlement, and ethical violations",
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
      "description": "Age, race, gender, disability, or other discriminatory practices",
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
      "id": "security-incidents",
      "name": "Security Incidents",
      "description": "Data breaches, unauthorized access, and security policy violations",
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
      "id": "property-damage",
      "name": "Property Damage",
      "description": "Damage to company property, equipment, or facilities",
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
      "id": "other-incident",
      "name": "Other Incident",
      "description": "Any other workplace incident that does not fit the above categories",
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