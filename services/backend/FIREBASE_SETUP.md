# 🔥 Firebase Push Notifications Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., `school-safety-app`)
4. Follow the setup wizard

## Step 2: Enable Cloud Messaging

1. In your Firebase project dashboard
2. Go to **Project Settings** (gear icon)
3. Click on **Cloud Messaging** tab
4. Note your **Project ID**

## Step 3: Generate Service Account Key

1. Go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. **Keep this file secure!**

## Step 4: Configure Environment

Add these to your `services/backend/.env.local`:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### Example Service Account Key Format:
```json
{
  "type": "service_account",
  "project_id": "school-safety-app-12345",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...your-key-here...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xyz@school-safety-app-12345.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

**Important:** Convert the JSON to a single line for the environment variable.

## Step 5: Test Configuration

Run this command to verify your setup:
```bash
node test-firebase.js
```

## Step 6: Available API Endpoints

Once configured, these endpoints will be available:

### Push Token Management
```
POST   /api/admin/push-token              - Register device token
DELETE /api/admin/push-token              - Remove device token
```

### Notification Preferences  
```
GET    /api/admin/notification-preferences - Get settings
PUT    /api/admin/notification-preferences - Update settings
```

### Testing
```
POST   /api/admin/test-notification        - Send test notification
```

## Step 7: Frontend Integration

Add Firebase SDK to your frontend app:

```bash
npm install firebase
```

Initialize Firebase in your frontend:
```javascript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  projectId: 'your-project-id',
  messagingSenderId: 'your-sender-id'
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Get registration token
getToken(messaging, { 
  vapidKey: 'your-vapid-key' 
}).then((token) => {
  // Send token to your backend
});
```

## Security Notes

- Never commit service account keys to git
- Store keys securely in production (Azure Key Vault, AWS Secrets Manager)
- Use different Firebase projects for dev/staging/production
- Regularly rotate service account keys

## Testing Push Notifications

1. Register a device token via API
2. Send test notification via API
3. Verify notification appears on device

Your Firebase setup is production-ready! 🚀