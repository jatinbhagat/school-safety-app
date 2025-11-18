'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

interface StaffNote {
  id: number | string;
  note_text: string;
  note_type: 'general' | 'action_taken' | 'follow_up' | 'resolution';
  author_name: string;
  author_role?: string;
  is_internal?: boolean;
  created_at: string;
  updated_at: string;
}

interface StaffNotesProps {
  notes: StaffNote[];
  onAddNote?: (noteText: string, noteType: string) => void;
  canAddNotes?: boolean;
}

export function StaffNotes({ notes, onAddNote, canAddNotes = true }: StaffNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'action_taken' | 'follow_up' | 'resolution'>('general');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !onAddNote) return;

    setIsAdding(true);
    try {
      await onAddNote(newNote.trim(), noteType);
      setNewNote('');
      setNoteType('general');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'action_taken':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'follow_up':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'resolution':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getNoteTypeLabel = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      {canAddNotes && onAddNote && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Note
          </label>

          <div className="mb-3">
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="general">General Note</option>
              <option value="action_taken">Action Taken</option>
              <option value="follow_up">Follow-Up Needed</option>
              <option value="resolution">Resolution Note</option>
            </select>
          </div>

          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note here..."
            rows={3}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={!newNote.trim() || isAdding}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? 'Adding...' : '💬 Add Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <p>No notes yet</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {note.author_name}
                  </span>
                  {note.author_role && (
                    <span className="text-xs text-gray-500">
                      ({note.author_role})
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getNoteTypeColor(note.note_type)}`}>
                    {getNoteTypeLabel(note.note_type)}
                  </span>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </span>
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {note.note_text}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
