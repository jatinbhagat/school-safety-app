import { Request, Response } from 'express';
import { pool } from '../db';

interface AddNoteBody {
  note_text: string;
  note_type?: 'general' | 'action_taken' | 'follow_up' | 'resolution';
  author_name: string;
  author_role?: string;
  author_email?: string;
  is_internal?: boolean;
}

/**
 * POST /staff/incidents/:id/notes
 * Adds a staff note to an incident
 */
export async function addStaffNote(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const incidentId = parseInt(id, 10);

    if (isNaN(incidentId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid incident ID',
      });
    }

    const {
      note_text,
      note_type = 'general',
      author_name,
      author_role,
      author_email,
      is_internal = false,
    }: AddNoteBody = req.body;

    // Validate required fields
    if (!note_text || note_text.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'note_text is required and cannot be empty',
      });
    }

    if (!author_name || author_name.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'author_name is required',
      });
    }

    await client.query('BEGIN');

    // Check if incident exists
    const incidentCheck = await client.query(
      'SELECT id FROM incidents WHERE id = $1',
      [incidentId]
    );

    if (incidentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not found',
        message: 'Incident not found',
      });
    }

    // Insert staff note
    const noteQuery = `
      INSERT INTO staff_notes (
        incident_id,
        note_text,
        note_type,
        author_name,
        author_role,
        author_email,
        is_internal
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, note_text, note_type, author_name, author_role, author_email, is_internal, created_at, updated_at
    `;

    const noteResult = await client.query(noteQuery, [
      incidentId,
      note_text.trim(),
      note_type,
      author_name,
      author_role,
      author_email,
      is_internal,
    ]);

    // Create timeline event for note
    const eventQuery = `
      INSERT INTO incident_events (
        incident_id,
        event_type,
        event_description,
        event_data,
        actor_name,
        actor_role,
        actor_email,
        actor_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `;

    const eventDescription = `${author_name} added a note`;
    const eventData = {
      note_id: noteResult.rows[0].id,
      note_type,
      is_internal,
    };

    await client.query(eventQuery, [
      incidentId,
      'note_added',
      eventDescription,
      JSON.stringify(eventData),
      author_name,
      author_role,
      author_email,
      'staff',
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      note: noteResult.rows[0],
      message: 'Note added successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding staff note:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add note',
    });
  } finally {
    client.release();
  }
}
