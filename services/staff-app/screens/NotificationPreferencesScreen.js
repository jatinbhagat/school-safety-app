import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { 
  getNotificationPreferences, 
  updateNotificationPreference, 
  sendTestNotification 
} from '../api/client';
import { NetworkStatusBar } from '../utils/networkUtils';

export default function NotificationPreferencesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [preferences, setPreferences] = useState({
    incident_assigned: { enabled: true, channels: ['push'] },
    incident_status_changed: { enabled: true, channels: ['push'] },
    new_incident_created: { enabled: true, channels: ['push'] },
    high_priority_incident: { enabled: true, channels: ['push'] },
    dispute_submitted: { enabled: true, channels: ['push'] },
  });

  const notificationTypes = [
    {
      key: 'incident_assigned',
      title: 'Incident Assigned',
      description: 'When an incident is assigned to you',
    },
    {
      key: 'incident_status_changed',
      title: 'Status Changes',
      description: 'When incident status is updated',
    },
    {
      key: 'new_incident_created',
      title: 'New Incidents',
      description: 'When a new incident is reported',
    },
    {
      key: 'high_priority_incident',
      title: 'High Priority Alerts',
      description: 'When a high-severity incident is reported',
    },
    {
      key: 'dispute_submitted',
      title: 'Dispute Submitted',
      description: 'When a reporter disputes a false report flag (Super Admin only)',
    },
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const data = await getNotificationPreferences();

      // Convert array to object keyed by notification_type
      const prefsObject = {};
      data.preferences.forEach(pref => {
        prefsObject[pref.notification_type] = {
          enabled: pref.enabled,
          channels: typeof pref.channels === 'string' ? JSON.parse(pref.channels) : pref.channels,
        };
      });

      // Merge with defaults
      setPreferences(prev => ({ ...prev, ...prefsObject }));
    } catch (error) {
      console.error('Error fetching preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = async (type) => {
    try {
      setSaving(true);
      const currentEnabled = preferences[type]?.enabled ?? true;
      const newEnabled = !currentEnabled;

      // Optimistic update
      setPreferences(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          enabled: newEnabled,
        },
      }));

      // Update on server
      await updateNotificationPreference(type, newEnabled, ['push']);
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update notification preference');

      // Revert optimistic update
      fetchPreferences();
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestNotification = async () => {
    setSendingTest(true);
    try {
      await sendTestNotification();
      Alert.alert('Success', 'Test notification sent successfully!');
    } catch (error) {
      Alert.alert('Error', `Failed to send test notification: ${error.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NetworkStatusBar />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <Text style={styles.headerSubtitle}>
          Choose which notifications you want to receive
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>

        {notificationTypes.map(type => (
          <View key={type.key} style={styles.preferenceItem}>
            <View style={styles.preferenceTextContainer}>
              <Text style={styles.preferenceTitle}>{type.title}</Text>
              <Text style={styles.preferenceDescription}>{type.description}</Text>
            </View>
            <Switch
              value={preferences[type.key]?.enabled ?? true}
              onValueChange={() => toggleNotification(type.key)}
              disabled={saving}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={preferences[type.key]?.enabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
        ))}
      </View>

      {/* Test Notification Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        <View style={styles.testSection}>
          <Text style={styles.testDescription}>
            Send a test notification to verify your settings are working properly.
          </Text>
          <TouchableOpacity
            style={[styles.testButton, sendingTest && styles.testButtonDisabled]}
            onPress={handleSendTestNotification}
            disabled={sendingTest}
          >
            {sendingTest ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.testButtonText}>📱 Send Test Notification</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Tip: Critical safety alerts cannot be disabled and will always be delivered regardless of your preferences.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  testSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  testDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
