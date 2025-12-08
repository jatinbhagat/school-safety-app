import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

export default function NotesModal({ visible, onClose, notes = [] }) {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderNote = (note, index) => (
    <View key={index} style={styles.noteItem}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteAuthor}>
          {note.author?.name || note.author?.email || 'Unknown User'}
        </Text>
        <Text style={styles.noteTime}>
          {formatTimestamp(note.created_at || note.timestamp)}
        </Text>
      </View>
      <Text style={styles.noteText}>{note.text || note.content || note.note}</Text>
      
      {note.type && (
        <View style={[styles.noteTypeBadge, getTypeColor(note.type)]}>
          <Text style={styles.noteTypeText}>{note.type}</Text>
        </View>
      )}
    </View>
  );

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'system':
        return { backgroundColor: '#007AFF' };
      case 'internal':
        return { backgroundColor: '#5856D6' };
      case 'user':
        return { backgroundColor: '#34C759' };
      default:
        return { backgroundColor: '#8E8E93' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notes & Comments</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {notes.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>
                {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
              </Text>
              {notes.map(renderNote)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No notes or comments yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Notes and comments will appear here as they are added
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  noteItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  noteTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  noteTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  noteTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
});