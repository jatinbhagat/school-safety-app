#!/usr/bin/env node

/**
 * Production File Upload Tester for SafelyNotify
 * 
 * Tests both:
 * 1. Incident report attachments (anonymous, no auth required)
 * 2. Institution logo uploads (requires admin authentication)
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const PRODUCTION_URL = 'https://safelynotify.azurewebsites.net';
const TEST_IMAGE_PATH = './test.jpg'; // You'll need to provide this

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => console.log(color + message + colors.reset);

/**
 * Test 1: Anonymous incident report with file attachment
 */
async function testIncidentReportUpload() {
  log(colors.blue, '🧪 Testing incident report file upload...');
  
  try {
    // Step 1: Get upload URL for the file
    const uploadResponse = await fetch(`${PRODUCTION_URL}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: 'test-evidence.jpg',
        contentType: 'image/jpeg',
      }),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload URL request failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    log(colors.green, '✅ Upload URL obtained successfully');
    
    // Step 2: Upload file to the pre-signed URL (if using S3)
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      const fileBuffer = fs.readFileSync(TEST_IMAGE_PATH);
      
      const uploadFileResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: fileBuffer,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error(`File upload failed: ${uploadFileResponse.status}`);
      }
      
      log(colors.green, '✅ File uploaded to storage successfully');
    } else {
      log(colors.yellow, '⚠️  Test image not found, skipping actual file upload');
    }

    // Step 3: Submit incident report with file reference
    const reportResponse = await fetch(`${PRODUCTION_URL}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'Test Category',
        description: 'Test incident report with file attachment',
        attachments: [{
          key: uploadData.key,
          filename: 'test-evidence.jpg',
          contentType: 'image/jpeg',
          uploadedAt: new Date().toISOString(),
        }],
        demo: true, // Mark as demo to avoid polluting real data
      }),
    });

    if (!reportResponse.ok) {
      throw new Error(`Report submission failed: ${reportResponse.status}`);
    }

    const reportData = await reportResponse.json();
    log(colors.green, '✅ Incident report submitted successfully');
    log(colors.blue, `📋 Report ID: ${reportData.report_id}`);
    
    return true;
  } catch (error) {
    log(colors.red, '❌ Incident report upload test failed:');
    log(colors.red, error.message);
    return false;
  }
}

/**
 * Test 2: Institution logo upload (requires authentication)
 */
async function testLogoUpload(authToken, institutionId) {
  log(colors.blue, '🧪 Testing logo upload...');
  
  try {
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      log(colors.yellow, '⚠️  Test image not found, skipping logo upload test');
      return false;
    }

    const form = new FormData();
    form.append('logo', fs.createReadStream(TEST_IMAGE_PATH));

    const response = await fetch(`${PRODUCTION_URL}/api/institutions/${institutionId}/logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Logo upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    log(colors.green, '✅ Logo uploaded successfully');
    log(colors.blue, `🖼️  Logo URL: ${data.logoUrl}`);
    
    return true;
  } catch (error) {
    log(colors.red, '❌ Logo upload test failed:');
    log(colors.red, error.message);
    return false;
  }
}

/**
 * Test 3: Health check and basic connectivity
 */
async function testConnectivity() {
  log(colors.blue, '🧪 Testing production connectivity...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    log(colors.green, '✅ Production server is healthy');
    log(colors.blue, `📊 Database: ${data.database}`);
    
    return true;
  } catch (error) {
    log(colors.red, '❌ Connectivity test failed:');
    log(colors.red, error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log(colors.blue, '🚀 Starting SafelyNotify Production Upload Tests\n');
  
  const results = {
    connectivity: false,
    incidentUpload: false,
    logoUpload: false,
  };

  // Test 1: Basic connectivity
  results.connectivity = await testConnectivity();
  console.log();

  // Test 2: Anonymous incident report upload
  if (results.connectivity) {
    results.incidentUpload = await testIncidentReportUpload();
    console.log();
  }

  // Test 3: Logo upload (requires manual auth setup)
  const authToken = process.env.ADMIN_TOKEN;
  const institutionId = process.env.INSTITUTION_ID;
  
  if (authToken && institutionId) {
    results.logoUpload = await testLogoUpload(authToken, institutionId);
  } else {
    log(colors.yellow, '⚠️  Skipping logo upload test (no auth credentials provided)');
    log(colors.blue, 'ℹ️  To test logo upload, set ADMIN_TOKEN and INSTITUTION_ID environment variables');
  }

  // Summary
  console.log();
  log(colors.blue, '📊 Test Results Summary:');
  log(results.connectivity ? colors.green : colors.red, `   Connectivity: ${results.connectivity ? 'PASS' : 'FAIL'}`);
  log(results.incidentUpload ? colors.green : colors.red, `   Incident Upload: ${results.incidentUpload ? 'PASS' : 'FAIL'}`);
  log(results.logoUpload ? colors.green : colors.yellow, `   Logo Upload: ${results.logoUpload ? 'PASS' : 'SKIPPED'}`);

  const overallSuccess = results.connectivity && results.incidentUpload;
  log(overallSuccess ? colors.green : colors.red, `\n🎯 Overall: ${overallSuccess ? 'SUCCESS' : 'FAILED'}`);
  
  process.exit(overallSuccess ? 0 : 1);
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    log(colors.red, '💥 Test runner crashed:');
    log(colors.red, error.message);
    process.exit(1);
  });
}

module.exports = { testIncidentReportUpload, testLogoUpload, testConnectivity };