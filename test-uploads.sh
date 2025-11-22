#!/bin/bash

# SafelyNotify Production Upload Tests
# Simple curl-based tests for file upload functionality

# Configuration
PROD_URL="https://safelynotify.azurewebsites.net"
TEST_IMAGE="test.jpg"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SafelyNotify Production Upload Tests${NC}"
echo "==============================================="

# Test 1: Health Check
echo -e "\n${BLUE}🧪 Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$PROD_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo -e "${BLUE}Response:${NC}"
    echo "$HEALTH_RESPONSE" | sed '$ d'
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

# Test 2: Get Upload URL
echo -e "\n${BLUE}🧪 Test 2: Get Upload URL${NC}"
UPLOAD_URL_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"filename":"test-evidence.jpg","contentType":"image/jpeg"}' \
    "$PROD_URL/upload-url")

HTTP_CODE=$(echo "$UPLOAD_URL_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Upload URL obtained${NC}"
    UPLOAD_DATA=$(echo "$UPLOAD_URL_RESPONSE" | sed '$ d')
    echo -e "${BLUE}Response:${NC}"
    echo "$UPLOAD_DATA" | jq '.' 2>/dev/null || echo "$UPLOAD_DATA"
    
    # Extract upload URL and key for next test
    UPLOAD_URL=$(echo "$UPLOAD_DATA" | jq -r '.uploadUrl' 2>/dev/null)
    FILE_KEY=$(echo "$UPLOAD_DATA" | jq -r '.key' 2>/dev/null)
else
    echo -e "${RED}❌ Failed to get upload URL (HTTP $HTTP_CODE)${NC}"
    echo "$UPLOAD_URL_RESPONSE" | sed '$ d'
    exit 1
fi

# Test 3: Upload File (if test image exists)
echo -e "\n${BLUE}🧪 Test 3: File Upload to Storage${NC}"
if [ -f "$TEST_IMAGE" ]; then
    if [ "$UPLOAD_URL" != "null" ] && [ "$UPLOAD_URL" != "" ]; then
        echo "Uploading $TEST_IMAGE to pre-signed URL..."
        UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X PUT \
            -H "Content-Type: image/jpeg" \
            --data-binary @"$TEST_IMAGE" \
            "$UPLOAD_URL")
        
        HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
            echo -e "${GREEN}✅ File uploaded successfully${NC}"
        else
            echo -e "${RED}❌ File upload failed (HTTP $HTTP_CODE)${NC}"
            echo "$UPLOAD_RESPONSE" | sed '$ d'
        fi
    else
        echo -e "${YELLOW}⚠️  No upload URL available, skipping file upload${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Test image '$TEST_IMAGE' not found, skipping file upload${NC}"
    echo -e "${BLUE}ℹ️  Create a test.jpg file to test file uploads${NC}"
fi

# Test 4: Submit Report with Attachment
echo -e "\n${BLUE}🧪 Test 4: Submit Report with Attachment${NC}"
REPORT_PAYLOAD='{
  "category": "Test Upload",
  "description": "Testing file upload functionality from automated test",
  "attachments": [
    {
      "key": "'$FILE_KEY'",
      "filename": "test-evidence.jpg",
      "contentType": "image/jpeg",
      "uploadedAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
    }
  ],
  "demo": true
}'

REPORT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$REPORT_PAYLOAD" \
    "$PROD_URL/report")

HTTP_CODE=$(echo "$REPORT_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Report submitted successfully${NC}"
    REPORT_DATA=$(echo "$REPORT_RESPONSE" | sed '$ d')
    echo -e "${BLUE}Response:${NC}"
    echo "$REPORT_DATA" | jq '.' 2>/dev/null || echo "$REPORT_DATA"
else
    echo -e "${RED}❌ Report submission failed (HTTP $HTTP_CODE)${NC}"
    echo "$REPORT_RESPONSE" | sed '$ d'
fi

# Test 5: Logo Upload (requires authentication)
echo -e "\n${BLUE}🧪 Test 5: Logo Upload (Authenticated)${NC}"
if [ -n "$ADMIN_TOKEN" ] && [ -n "$INSTITUTION_ID" ] && [ -f "$TEST_IMAGE" ]; then
    echo "Testing logo upload with authentication..."
    LOGO_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -F "logo=@$TEST_IMAGE" \
        "$PROD_URL/api/institutions/$INSTITUTION_ID/logo")
    
    HTTP_CODE=$(echo "$LOGO_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Logo uploaded successfully${NC}"
        LOGO_DATA=$(echo "$LOGO_RESPONSE" | sed '$ d')
        echo -e "${BLUE}Response:${NC}"
        echo "$LOGO_DATA" | jq '.' 2>/dev/null || echo "$LOGO_DATA"
    else
        echo -e "${RED}❌ Logo upload failed (HTTP $HTTP_CODE)${NC}"
        echo "$LOGO_RESPONSE" | sed '$ d'
    fi
else
    echo -e "${YELLOW}⚠️  Skipping logo upload test${NC}"
    echo -e "${BLUE}ℹ️  To test logo upload, set ADMIN_TOKEN and INSTITUTION_ID environment variables${NC}"
    echo -e "${BLUE}ℹ️  Example: ADMIN_TOKEN=your_token INSTITUTION_ID=123 ./test-uploads.sh${NC}"
fi

echo -e "\n${BLUE}📊 Upload Tests Complete${NC}"
echo "==============================="