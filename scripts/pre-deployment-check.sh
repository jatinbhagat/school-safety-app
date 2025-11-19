#!/bin/bash
# Pre-Deployment Checklist Script
# Verifies that everything is ready for AWS deployment

set -e

echo "================================================"
echo "School Safety App - Pre-Deployment Check"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Check if in correct directory
if [ ! -f "README.md" ] || [ ! -d "services" ]; then
    check_fail "Not in project root directory"
    exit 1
fi
check_pass "In correct directory"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        check_pass "Node.js version: $(node -v)"
    else
        check_warn "Node.js version $(node -v) is old. Recommended: v20+"
    fi
else
    check_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    check_pass "npm installed: $(npm -v)"
else
    check_fail "npm not installed"
fi

# Check backend
echo ""
echo "Checking Backend..."
if [ -f "services/backend/package.json" ]; then
    check_pass "Backend package.json exists"

    if [ -d "services/backend/node_modules" ]; then
        check_pass "Backend dependencies installed"
    else
        check_warn "Backend dependencies not installed (run: cd services/backend && npm install)"
    fi

    if [ -f "services/backend/src/server.ts" ]; then
        check_pass "Backend source files exist"
    else
        check_fail "Backend source files missing"
    fi
else
    check_fail "Backend package.json not found"
fi

# Check PWA
echo ""
echo "Checking PWA..."
if [ -f "services/pwa/package.json" ]; then
    check_pass "PWA package.json exists"

    if [ -d "services/pwa/node_modules" ]; then
        check_pass "PWA dependencies installed"
    else
        check_warn "PWA dependencies not installed (run: cd services/pwa && npm install)"
    fi

    if [ -f "services/pwa/next.config.js" ]; then
        check_pass "Next.js config exists"
    else
        check_warn "Next.js config not found"
    fi
else
    check_fail "PWA package.json not found"
fi

# Check Docker
echo ""
echo "Checking Docker (optional)..."
if command -v docker &> /dev/null; then
    check_pass "Docker installed: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
else
    check_warn "Docker not installed (optional, but recommended)"
fi

# Check AWS CLI
echo ""
echo "Checking AWS CLI (optional)..."
if command -v aws &> /dev/null; then
    check_pass "AWS CLI installed: $(aws --version | cut -d' ' -f1)"

    if aws sts get-caller-identity &> /dev/null; then
        check_pass "AWS credentials configured"
    else
        check_warn "AWS credentials not configured (run: aws configure)"
    fi
else
    check_warn "AWS CLI not installed (optional for manual deployment)"
fi

# Check deployment files
echo ""
echo "Checking deployment configuration..."
if [ -f "amplify.yml" ]; then
    check_pass "Amplify config exists"
else
    check_fail "amplify.yml not found"
fi

if [ -f ".env.production.template" ]; then
    check_pass "Environment template exists"
else
    check_warn ".env.production.template not found"
fi

if [ -f "services/backend/Dockerfile" ]; then
    check_pass "Backend Dockerfile exists"
else
    check_warn "Backend Dockerfile not found"
fi

# Check Git
echo ""
echo "Checking Git..."
if command -v git &> /dev/null; then
    check_pass "Git installed"

    if git rev-parse --git-dir > /dev/null 2>&1; then
        check_pass "Git repository initialized"

        BRANCH=$(git rev-parse --abbrev-ref HEAD)
        check_pass "Current branch: $BRANCH"

        if [ -n "$(git status --porcelain)" ]; then
            check_warn "Uncommitted changes detected"
        else
            check_pass "No uncommitted changes"
        fi
    else
        check_fail "Not a git repository"
    fi
else
    check_fail "Git not installed"
fi

# Summary
echo ""
echo "================================================"
echo "Pre-Deployment Check Summary"
echo "================================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $WARNINGS warning(s)${NC}"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}Ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT_GUIDE.md"
    echo "2. Prepare your AWS account"
    echo "3. Run deployment scripts or follow manual steps"
    exit 0
else
    echo -e "${RED}Please fix errors before deploying${NC}"
    exit 1
fi
