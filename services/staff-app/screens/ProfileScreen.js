import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { NetworkStatusBar } from '../utils/networkUtils';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profileImage, setProfileImage] = useState(user?.profile_image || null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your profile picture.');
      return false;
    }
    return true;
  };

  const handleImagePicker = () => {
    setShowImagePicker(true);
  };

  const pickImageFromLibrary = async () => {
    setShowImagePicker(false);
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const pickImageFromCamera = async () => {
    setShowImagePicker(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a profile picture.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      setUploadingImage(true);

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('profile_image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile_image.jpg',
      });

      // TODO: Replace with actual upload endpoint
      // const response = await fetch('/api/auth/profile-image', {
      //   method: 'POST',
      //   body: formData,
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });

      // For now, just set the local image
      setProfileImage(imageUri);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture');
      console.error('Profile image upload error:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProfileImage = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProfileImage(null);
            // TODO: Send request to server to remove profile image
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </View>
    );
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
        return '#FF3B30';
      case 'admin':
        return '#007AFF';
      case 'staff':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'admin':
        return 'Administrator';
      case 'staff':
        return 'Staff Member';
      default:
        return role;
    }
  };

  return (
    <View style={styles.container}>
      <NetworkStatusBar />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handleImagePicker}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          {profileImage && (
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={removeProfileImage}
            >
              <Text style={styles.removeImageButtonText}>Remove Picture</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.name}>{user.name || 'Staff Member'}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
            <Text style={styles.roleText}>{getRoleDisplayName(user.role)}</Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Institution</Text>
              <Text style={styles.detailValue}>{user.institution?.name || 'N/A'}</Text>
            </View>

            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Role</Text>
              <Text style={styles.detailValue}>{getRoleDisplayName(user.role)}</Text>
            </View>

            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>

            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, styles.activeStatus]}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>

            {user.email_verified && (
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <Text style={styles.detailLabel}>Verified</Text>
                <Text style={[styles.detailValue, styles.verifiedStatus]}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('NotificationPreferences')}
          >
            <Text style={styles.actionButtonText}>Notification Preferences</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Change Password', 'Password change functionality coming soon!')}
          >
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <Text style={styles.imagePickerTitle}>Change Profile Picture</Text>
            
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={pickImageFromCamera}
            >
              <Text style={styles.imagePickerIcon}>📷</Text>
              <Text style={styles.imagePickerText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={pickImageFromLibrary}
            >
              <Text style={styles.imagePickerIcon}>🖼️</Text>
              <Text style={styles.imagePickerText}>Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.imagePickerOption, styles.cancelOption]}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  cameraIconText: {
    fontSize: 12,
  },
  removeImageButton: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeImageButtonText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  activeStatus: {
    color: '#34C759',
  },
  verifiedStatus: {
    color: '#34C759',
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  actionButtonArrow: {
    fontSize: 24,
    color: '#C7C7CC',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 24,
  },
  errorText: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 16,
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imagePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  imagePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  imagePickerIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  cancelOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 8,
    justifyContent: 'center',
  },
  cancelOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
});
