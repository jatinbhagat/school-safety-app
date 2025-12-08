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

export default function TimelineModal({ visible, onClose, timeline = [] }) {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'created':
        return '🔵';
      case 'assigned':
        return '👤';
      case 'status_changed':
        return '📋';
      case 'note_added':
        return '📝';
      case 'flagged':
        return '🚩';
      case 'resolved':
        return '✅';
      default:
        return '📌';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'created':
        return '#007AFF';
      case 'assigned':
        return '#34C759';
      case 'status_changed':
        return '#FF9500';
      case 'note_added':
        return '#5856D6';
      case 'flagged':
        return '#FF3B30';
      case 'resolved':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const renderTimelineItem = (item, index) => (
    <View key={index} style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineIcon, { backgroundColor: getEventColor(item.type) }]}>
          <Text style={styles.timelineIconText}>{getEventIcon(item.type)}</Text>
        </View>
        {index < timeline.length - 1 && <View style={styles.timelineLine} />}
      </View>
      
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>{item.title || item.description}</Text>
          <Text style={styles.timelineTime}>{formatTimestamp(item.created_at || item.timestamp)}</Text>
        </View>
        
        {item.details && (
          <Text style={styles.timelineDetails}>{item.details}</Text>
        )}
        
        {item.user && (
          <Text style={styles.timelineUser}>by {item.user.name || item.user.email}</Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Timeline</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {timeline.length > 0 ? (
            timeline.map(renderTimelineItem)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No timeline events available</Text>
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
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconText: {
    fontSize: 14,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  timelineDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  timelineUser: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
  },
});