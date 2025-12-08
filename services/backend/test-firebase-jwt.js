// Generate JWT token for testing Firebase push notifications
require('dotenv').config({ path: '.env.local' });
const { generateToken } = require('./dist/utils/jwt.js');

// Use existing admin ID from database 
const testAdmin = {
  adminId: 16, // admin@testschool.edu
  institutionId: 16, // Test School Academy  
  email: 'admin@testschool.edu',
  role: 'super_admin'
};

try {
  const token = generateToken(testAdmin);
  console.log('🔑 Generated JWT Token:');
  console.log(token);
  console.log('\n📋 Test Firebase Push Notification:');
  console.log(`curl -X POST http://localhost:3002/api/admin/test-notification \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{"title":"Test Notification","body":"Firebase integration test","token":"test-device-token"}'`);
  
} catch (error) {
  console.error('❌ Error generating token:', error);
}