import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  getIncidentDetail,
  assignIncident,
  addIncidentNote,
  updateIncidentStatus,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import TimelineModal from '../components/TimelineModal';
import NotesModal from '../components/NotesModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { NetworkStatusBar } from '../utils/networkUtils';

export default function IncidentDetail({ route, navigation }) {
  const { incidentId } = route.params;
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Action states
  const [assigning, setAssigning] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  // Modals
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Confirmation dialogs
  const [confirmationDialog, setConfirmationDialog] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmStyle: 'primary',
    loading: false
  });

  useEffect(() => {
    fetchIncidentDetail();
  }, []);

  const fetchIncidentDetail = async () => {
    try {
      setError(null);
      const data = await getIncidentDetail(incidentId);

      setIncident(data.incident);
      setTimeline(data.timeline || []);
      setNotes(data.notes || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch incident detail:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncidentDetail();
  };

  const handleAssignToMe = () => {
    setConfirmationDialog({
      visible: true,
      title: 'Assign Incident',
      message: `Are you sure you want to assign incident #${incidentId} to yourself? This will mark you as responsible for handling this case.`,
      onConfirm: confirmAssignToMe,
      confirmStyle: 'primary',
      loading: false
    });
  };

  const confirmAssignToMe = async () => {
    try {
      setConfirmationDialog(prev => ({ ...prev, loading: true }));
      await assignIncident(incidentId);
      setConfirmationDialog({ visible: false, title: '', message: '', onConfirm: null, confirmStyle: 'primary', loading: false });
      Alert.alert('Success', 'Incident assigned to you');
      fetchIncidentDetail(); // Refresh data
    } catch (error) {
      setConfirmationDialog(prev => ({ ...prev, loading: false }));
      Alert.alert('Error', error.message);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      setAddingNote(true);
      await addIncidentNote(incidentId, noteText.trim());
      setNoteText('');
      setShowNoteModal(false);
      Alert.alert('Success', 'Note added successfully');
      fetchIncidentDetail(); // Refresh data
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setAddingNote(false);
    }
  };

  const handleChangeStatus = () => {
    if (!selectedStatus) {
      Alert.alert('Error', 'Please select a status');
      return;
    }

    if (selectedStatus === incident.status) {
      setShowStatusModal(false);
      return;
    }

    const isDestructive = selectedStatus === 'closed' || selectedStatus === 'resolved';
    
    setShowStatusModal(false);
    setConfirmationDialog({
      visible: true,
      title: 'Change Status',
      message: `Are you sure you want to change the status to "${selectedStatus.replace('_', ' ')}"?${
        isDestructive ? ' This action may limit further modifications to the incident.' : ''
      }`,
      onConfirm: confirmChangeStatus,
      confirmStyle: isDestructive ? 'destructive' : 'primary',
      loading: false
    });
  };

  const confirmChangeStatus = async () => {
    try {
      setConfirmationDialog(prev => ({ ...prev, loading: true }));
      await updateIncidentStatus(incidentId, selectedStatus);
      setConfirmationDialog({ visible: false, title: '', message: '', onConfirm: null, confirmStyle: 'primary', loading: false });
      Alert.alert('Success', 'Status updated successfully');
      fetchIncidentDetail(); // Refresh data
    } catch (error) {
      setConfirmationDialog(prev => ({ ...prev, loading: false }));
      Alert.alert('Error', error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return '#FF9500';
      case 'in_progress':
        return '#007AFF';
      case 'resolved':
        return '#34C759';
      case 'closed':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchIncidentDetail}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Incident not found</Text>
      </View>
    );
  }

  const aiMeta = incident.ai_meta || {};
  const severity = aiMeta.severity || 'medium';
  const canTakeActions = incident.status !== 'closed';

  return (
    <View style={styles.container}>
      <NetworkStatusBar />
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.idText}>#{incident.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) }]}>
            <Text style={styles.statusText}>{incident.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* False Report Warning */}
        {incident.flagged_as_false && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Flagged as False Report</Text>
            <Text style={styles.warningText}>Reason: {incident.false_report_reason}</Text>
            {incident.false_report_confirmed && (
              <Text style={styles.warningConfirmed}>✓ Confirmed by Super Admin</Text>
            )}
          </View>
        )}

        {/* AI Analysis */}
        {aiMeta.severity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Analysis</Text>
            <View style={styles.aiCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Severity:</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(severity) }]}>
                  <Text style={styles.severityText}>{severity.toUpperCase()}</Text>
                </View>
              </View>
              {aiMeta.tags && (
                <View style={styles.tagContainer}>
                  {aiMeta.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{incident.description || 'No description'}</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{incident.category || 'N/A'}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowBorder]}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{incident.class_section || 'N/A'}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowBorder]}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(incident.created_at).toLocaleString()}
            </Text>
          </View>
          {incident.updated_at !== incident.created_at && (
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Updated:</Text>
              <Text style={styles.detailValue}>
                {new Date(incident.updated_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        {timeline.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setShowTimelineModal(true)}
            >
              <Text style={styles.sectionTitle}>Timeline ({timeline.length})</Text>
              <Text style={styles.sectionAction}>View All ›</Text>
            </TouchableOpacity>
            {timeline.slice(0, 3).map((event, index) => (
              <View key={event.id || index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineEvent}>
                    {event.event_description || event.title || event.description}
                  </Text>
                  <Text style={styles.timelineActor}>
                    {event.actor_name || event.user?.name} • {event.actor_role || 'Staff'}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {new Date(event.created_at || event.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
            {timeline.length > 3 && (
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={() => setShowTimelineModal(true)}
              >
                <Text style={styles.viewMoreText}>
                  View {timeline.length - 3} more events
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setShowNotesModal(true)}
            >
              <Text style={styles.sectionTitle}>Notes ({notes.length})</Text>
              <Text style={styles.sectionAction}>View All ›</Text>
            </TouchableOpacity>
            {notes.slice(0, 2).map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <Text style={styles.noteText} numberOfLines={2}>
                  {note.note_text || note.text || note.content}
                </Text>
                <Text style={styles.noteAuthor}>
                  — {note.author_name || note.author?.name || 'Staff'} • {new Date(note.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
            {notes.length > 2 && (
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={() => setShowNotesModal(true)}
              >
                <Text style={styles.viewMoreText}>
                  View {notes.length - 2} more notes
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Actions */}
        {canTakeActions && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => setShowNoteModal(true)}
            >
              <Text style={styles.actionButtonText}>✍️ Add Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                setSelectedStatus(incident.status);
                setShowStatusModal(true);
              }}
            >
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                🔄 Change Status
              </Text>
            </TouchableOpacity>

            {incident.status !== 'in_progress' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.assignButton]}
                onPress={handleAssignToMe}
              >
                <Text style={[styles.actionButtonText, styles.assignButtonText]}>
                  👤 Assign to Me
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Add Note Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Enter your note..."
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNoteText('');
                  setShowNoteModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, addingNote && styles.disabled]}
                onPress={handleAddNote}
                disabled={addingNote}
              >
                {addingNote ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Note</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Change Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Status</Text>
            <View style={styles.statusOptions}>
              {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedStatus === status && styles.statusOptionSelected,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      selectedStatus === status && styles.statusOptionTextSelected,
                    ]}
                  >
                    {status.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleChangeStatus}
              >
                <Text style={styles.submitButtonText}>Update Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Timeline Modal */}
      <TimelineModal 
        visible={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        timeline={timeline}
      />

      {/* Notes Modal */}
      <NotesModal 
        visible={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        notes={notes}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={confirmationDialog.visible}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={() => setConfirmationDialog({ visible: false, title: '', message: '', onConfirm: null, confirmStyle: 'primary', loading: false })}
        confirmStyle={confirmationDialog.confirmStyle}
        loading={confirmationDialog.loading}
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  idText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
  },
  warningConfirmed: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  viewMoreButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  aiCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#1976D2',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineEvent: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  timelineActor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: '#999',
  },
  noteCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  noteAuthor: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  assignButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  assignButtonText: {
    color: '#34C759',
  },
  disabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  noteInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusOptions: {
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  statusOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
