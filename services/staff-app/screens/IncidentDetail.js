import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { assignIncident } from '../api/client';

export default function IncidentDetail({ route, navigation }) {
  const { incident } = route.params;
  const [currentIncident, setCurrentIncident] = useState(incident);
  const [assigning, setAssigning] = useState(false);

  const handleAssignToMe = async () => {
    try {
      setAssigning(true);
      const updatedIncident = await assignIncident(currentIncident.id);

      // Update local state with the response
      setCurrentIncident({
        ...currentIncident,
        status: 'assigned',
        assigned_to: updatedIncident.assigned_to || 'me',
        assigned_at: new Date().toISOString(),
      });

      Alert.alert(
        'Success',
        'Incident has been assigned to you',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to assign incident: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FF9500';
      case 'assigned':
        return '#007AFF';
      case 'resolved':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const canAssign = currentIncident.status?.toLowerCase() !== 'assigned' &&
                    currentIncident.status?.toLowerCase() !== 'resolved';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.idText}>Incident #{currentIncident.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentIncident.status) }]}>
            <Text style={styles.statusText}>{currentIncident.status}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {currentIncident.description || 'No description provided'}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{currentIncident.type}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Priority:</Text>
            <Text style={styles.detailValue}>{currentIncident.priority || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{currentIncident.location || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reported By:</Text>
            <Text style={styles.detailValue}>{currentIncident.reporter_name || 'Anonymous'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(currentIncident.created_at).toLocaleString()}
            </Text>
          </View>

          {currentIncident.assigned_to && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned To:</Text>
              <Text style={styles.detailValue}>{currentIncident.assigned_to}</Text>
            </View>
          )}

          {currentIncident.assigned_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned At:</Text>
              <Text style={styles.detailValue}>
                {new Date(currentIncident.assigned_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Assign Button */}
        {canAssign && (
          <TouchableOpacity
            style={[styles.assignButton, assigning && styles.assignButtonDisabled]}
            onPress={handleAssignToMe}
            disabled={assigning}
          >
            {assigning ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.assignButtonText}>Assign to Me</Text>
            )}
          </TouchableOpacity>
        )}

        {!canAssign && (
          <View style={styles.assignedNotice}>
            <Text style={styles.assignedNoticeText}>
              This incident is already {currentIncident.status?.toLowerCase()}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  idText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  assignButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  assignButtonDisabled: {
    opacity: 0.6,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  assignedNotice: {
    backgroundColor: '#E5E5EA',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  assignedNoticeText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
