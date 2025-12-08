/**
 * Institution Configuration Handler
 * Implements new simplified configuration lookup:
 * 1. Check for custom institution config
 * 2. Fallback to institution type template
 */

import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * Simple validation interface for institution-based reporting
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate category against institution configuration
 * This replaces the complex tenant-based validation system
 */
export async function validateInstitutionCategory(
  institutionId: number, 
  category: string
): Promise<ValidationResult> {
  try {
    const client = await pool.connect();
    
    try {
      // Step 1: Check for custom institution config
      const customConfigQuery = `
        SELECT custom_config as config
        FROM institution_configs 
        WHERE institution_id = $1
      `;
      
      const customResult = await client.query(customConfigQuery, [institutionId]);
      
      let config;
      if (customResult.rows.length > 0) {
        // Use custom config
        config = customResult.rows[0].config;
      } else {
        // Step 2: Fallback to institution type template
        const templateQuery = `
          SELECT it.default_config as config
          FROM institutions i
          JOIN institution_types it ON i.type_id = it.id
          WHERE i.id = $1
        `;

        const templateResult = await client.query(templateQuery, [institutionId]);

        if (templateResult.rows.length === 0) {
          return {
            valid: false,
            error: 'No configuration found for institution'
          };
        }
        
        config = templateResult.rows[0].config;
      }
      
      // Check if category exists in configuration
      const categories = config.categories || [];
      const categoryExists = categories.some((cat: any) => cat.id === category);
      
      if (!categoryExists) {
        return {
          valid: false,
          error: `Invalid category: ${category}. Available categories: ${categories.map((c: any) => c.id).join(', ')}`
        };
      }
      
      return { valid: true };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error validating institution category:', error);
    return {
      valid: false,
      error: 'Internal validation error'
    };
  }
}

export const getInstitutionConfig = async (req: Request, res: Response) => {
  const { institutionId } = req.params;

  try {
    // Parse institution ID as integer
    const instId = parseInt(institutionId);
    if (isNaN(instId)) {
      return res.status(400).json({ 
        error: 'Invalid institution ID',
        message: 'Institution ID must be a valid number'
      });
    }

    const client = await pool.connect();

    try {
      // Step 1: Check for custom institution config
      const customConfigQuery = `
        SELECT custom_config as config
        FROM institution_configs 
        WHERE institution_id = $1
      `;
      
      const customResult = await client.query(customConfigQuery, [instId]);
      
      if (customResult.rows.length > 0) {
        // Return custom config
        return res.json({
          source: 'custom',
          config: customResult.rows[0].config
        });
      }

      // Step 2: Fallback to institution type template
      const templateQuery = `
        SELECT 
          it.default_config as config,
          it.type_key,
          it.display_name
        FROM institutions i
        JOIN institution_types it ON i.type_id = it.id
        WHERE i.id = $1
      `;

      const templateResult = await client.query(templateQuery, [instId]);

      if (templateResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Institution not found',
          message: 'No institution found with the provided ID'
        });
      }

      // Return template config
      return res.json({
        source: 'template',
        institution_type: templateResult.rows[0].type_key,
        config: templateResult.rows[0].config
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching institution config:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch institution configuration'
    });
  }
};

export const getInstitutionConfigBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    // Handle demo mode special case
    if (slug === 'demo') {
      // Return default school template for demo
      const client = await pool.connect();
      try {
        const templateQuery = `
          SELECT 
            it.default_config as config,
            it.type_key,
            it.display_name
          FROM institution_types it
          WHERE it.type_key = 'school'
        `;
        
        const templateResult = await client.query(templateQuery);
        
        if (templateResult.rows.length === 0) {
          return res.status(500).json({
            error: 'Demo configuration not available',
            message: 'School template not found for demo mode'
          });
        }
        
        return res.json({
          source: 'demo',
          institution: {
            id: 'demo',
            name: 'Demo School'
          },
          institution_type: 'school',
          config: templateResult.rows[0].config
        });
        
      } finally {
        client.release();
      }
    }

    const client = await pool.connect();

    try {
      // First, get institution ID by slug
      const institutionQuery = `
        SELECT id, institution_name, type_id
        FROM institutions 
        WHERE url_slug = $1 AND is_active = true
      `;
      
      const institutionResult = await client.query(institutionQuery, [slug]);
      
      if (institutionResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Institution not found',
          message: 'No active institution found with the provided slug'
        });
      }

      const institution = institutionResult.rows[0];
      const institutionId = institution.id;

      // Step 1: Check for custom institution config
      const customConfigQuery = `
        SELECT custom_config as config
        FROM institution_configs 
        WHERE institution_id = $1
      `;
      
      const customResult = await client.query(customConfigQuery, [institutionId]);
      
      if (customResult.rows.length > 0) {
        // Return custom config
        return res.json({
          source: 'custom',
          institution: {
            id: institutionId,
            name: institution.institution_name
          },
          config: customResult.rows[0].config
        });
      }

      // Step 2: Fallback to institution type template
      const templateQuery = `
        SELECT 
          it.default_config as config,
          it.type_key,
          it.display_name
        FROM institution_types it
        WHERE it.id = $1
      `;

      const templateResult = await client.query(templateQuery, [institution.type_id]);

      if (templateResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Configuration not found',
          message: 'No configuration template found for this institution type'
        });
      }

      // Return template config
      return res.json({
        source: 'template',
        institution: {
          id: institutionId,
          name: institution.institution_name
        },
        institution_type: templateResult.rows[0].type_key,
        config: templateResult.rows[0].config
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching institution config by slug:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch institution configuration'
    });
  }
};

export const updateInstitutionConfig = async (req: Request, res: Response) => {
  const { institutionId } = req.params;
  const { config } = req.body;

  try {
    // Parse institution ID as integer
    const instId = parseInt(institutionId);
    if (isNaN(instId)) {
      return res.status(400).json({ 
        error: 'Invalid institution ID',
        message: 'Institution ID must be a valid number'
      });
    }

    if (!config) {
      return res.status(400).json({
        error: 'Missing configuration',
        message: 'Configuration data is required'
      });
    }

    const client = await pool.connect();

    try {
      // Check if institution exists
      const institutionCheck = `
        SELECT id, institution_name FROM institutions WHERE id = $1
      `;
      const institutionResult = await client.query(institutionCheck, [instId]);
      
      if (institutionResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Institution not found',
          message: 'No institution found with the provided ID'
        });
      }

      // Upsert custom configuration
      const upsertQuery = `
        INSERT INTO institution_configs (institution_id, custom_config, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (institution_id)
        DO UPDATE SET 
          custom_config = EXCLUDED.custom_config,
          updated_at = NOW()
        RETURNING institution_id
      `;

      await client.query(upsertQuery, [instId, JSON.stringify(config)]);

      return res.json({
        success: true,
        message: 'Configuration updated successfully',
        source: 'custom'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating institution config:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update institution configuration'
    });
  }
};