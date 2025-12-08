// Test Firebase Configuration for safely-notify project
require('dotenv').config({ path: '.env.local' });

async function testFirebaseSafelyNotify() {
  console.log('🔥 Testing Firebase Configuration for safely-notify...\n');
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  console.log('📋 Configuration Check:');
  console.log(`Project ID: ${projectId}`);
  console.log(`Service Account: ${serviceAccountKey && serviceAccountKey !== 'REPLACE_WITH_YOUR_SERVICE_ACCOUNT_JSON' ? '✅ Configured' : '❌ Needs to be replaced'}`);
  
  if (!serviceAccountKey || serviceAccountKey === 'REPLACE_WITH_YOUR_SERVICE_ACCOUNT_JSON') {
    console.log('\n❌ Please replace FIREBASE_SERVICE_ACCOUNT_KEY in .env.local with your actual service account JSON');
    console.log('💡 Download it from: Firebase Console → Project Settings → Service accounts → Generate new private key');
    return;
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    console.log(`\n✅ Service Account Details:`);
    console.log(`   Email: ${serviceAccount.client_email}`);
    console.log(`   Project: ${serviceAccount.project_id}`);
    console.log(`   Key ID: ${serviceAccount.private_key_id.substring(0, 8)}...`);
    
    // Verify project ID matches
    if (serviceAccount.project_id === 'safely-notify') {
      console.log('✅ Project ID matches: safely-notify');
    } else {
      console.log(`⚠️  Project ID mismatch: expected "safely-notify", got "${serviceAccount.project_id}"`);
    }
    
    // Try to initialize Firebase Admin
    const admin = require('firebase-admin');
    
    if (admin.apps.length > 0) {
      admin.apps.forEach(app => app.delete());
    }
    
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'safely-notify',
    });
    
    console.log('\n🎉 Firebase Admin SDK initialized successfully!');
    console.log('✅ Your safely-notify project is ready for push notifications');
    
    // Clean up
    await app.delete();
    
  } catch (error) {
    console.error('\n❌ Configuration error:', error.message);
    
    if (error.message.includes('JSON')) {
      console.log('💡 Make sure the service account key is valid JSON format');
    }
  }
}

testFirebaseSafelyNotify().catch(console.error);