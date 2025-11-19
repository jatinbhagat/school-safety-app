#!/bin/bash
# Backend Deployment Script for AWS Elastic Beanstalk
# This script packages and prepares the backend for deployment

set -e  # Exit on any error

echo "================================================"
echo "School Safety App - Backend Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "services/backend/package.json" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
cd services/backend
npm install

echo -e "${YELLOW}Step 2: Running TypeScript build...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Creating deployment package...${NC}"
mkdir -p ../../deploy
rm -f ../../deploy/backend-deploy.zip

# Create zip file with only necessary files
zip -r ../../deploy/backend-deploy.zip \
    dist \
    node_modules \
    package.json \
    package-lock.json \
    -x "node_modules/.cache/*" \
    -x "*.md"

echo -e "${GREEN}✓ Backend deployment package created!${NC}"
echo ""
echo "Deployment package location: deploy/backend-deploy.zip"
echo "Package size: $(du -h ../../deploy/backend-deploy.zip | cut -f1)"
echo ""
echo "Next steps:"
echo "1. Go to AWS Elastic Beanstalk Console"
echo "2. Upload deploy/backend-deploy.zip"
echo "3. Configure environment variables"
echo "4. Deploy!"
echo ""
echo -e "${GREEN}Done!${NC}"

cd ../..
