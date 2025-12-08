# Staff App Testing Guide

## Overview
This document outlines comprehensive testing procedures for all newly implemented features in the Staff Mobile Application.

## Test Categories

### 1. Unit Tests
Run individual component and utility function tests:

```bash
# Run all tests
npm test

# Run specific test files
npx jest comprehensive.test.js
npx jest utils/debounce.test.js
npx jest components/SearchBar.test.js

# Run with coverage
npm test -- --coverage
```

### 2. Integration Tests
Test complete user workflows:

```bash
# Run integration test suite
npx jest --testNamePattern="Integration Tests"

# Test specific workflows
npx jest --testNamePattern="incident workflow"
npx jest --testNamePattern="notification workflow"
```

### 3. Manual Testing Checklist

#### 📱 Core Functionality
- [ ] App launches without crashes
- [ ] Authentication flow works correctly
- [ ] Navigation between screens is smooth
- [ ] Network status bar appears and updates correctly

#### 🔍 Search & Pagination
- [ ] Search bar appears on incidents list
- [ ] Search query triggers after 500ms delay (debouncing)
- [ ] Search results update correctly
- [ ] Clear search button works
- [ ] Infinite scroll loads more incidents
- [ ] Loading indicators show during pagination
- [ ] Results summary displays correctly
- [ ] Filter chips scroll horizontally with indicators

#### 📋 Incident Detail Enhancements
- [ ] Timeline section shows preview with "View All" button
- [ ] Timeline modal opens with complete timeline
- [ ] Notes section shows preview with "View All" button  
- [ ] Notes modal opens with all notes
- [ ] "View More" buttons work when content exceeds preview limits

#### ✅ Confirmation Dialogs
- [ ] Assign incident shows confirmation dialog
- [ ] Status change shows confirmation with appropriate style
- [ ] Destructive actions show red confirmation buttons
- [ ] Loading states work within dialogs
- [ ] Cancel button dismisses dialogs

#### 🖼️ Profile Pictures
- [ ] Camera icon appears on avatar
- [ ] Tapping avatar opens image picker modal
- [ ] "Take Photo" requests camera permissions
- [ ] "Choose from Library" requests photo library permissions
- [ ] Permission denied shows appropriate alerts
- [ ] Selected image updates avatar
- [ ] "Remove Picture" option appears when image exists
- [ ] Remove picture confirmation works

#### 📱 Push Notifications
- [ ] Notification permissions requested on first launch
- [ ] Push token registered with backend
- [ ] Test notification button in preferences works
- [ ] Notification preferences toggle correctly
- [ ] Test notification appears on device
- [ ] Tapping notifications navigates to correct screen

#### 🌐 Network Status
- [ ] Network status bar shows when offline
- [ ] Status bar disappears when back online
- [ ] Offline indicator color and text are correct
- [ ] Network state updates in real-time

#### 📱 Modal Safe Areas
- [ ] All modals respect safe area on iOS devices
- [ ] Modal content not hidden behind notch/home indicator
- [ ] Timeline modal safe area works correctly
- [ ] Notes modal safe area works correctly
- [ ] Confirmation dialogs safe area works correctly

### 4. Device Testing Matrix

#### iOS Testing
Test on multiple iOS devices and versions:

```
📱 iPhone Models:
- iPhone 14 Pro (iOS 16+) - Notch handling
- iPhone 12 (iOS 15+) - Standard testing  
- iPhone SE (iOS 14+) - Small screen testing

🔧 iOS Specific Features:
- [ ] Safe area handling with notch
- [ ] Dynamic Type support
- [ ] VoiceOver accessibility
- [ ] 3D Touch/Haptic feedback
- [ ] Background app refresh
- [ ] Push notification permissions
```

#### Android Testing
Test on multiple Android devices and versions:

```
📱 Android Models:
- Pixel 6 (Android 12+) - Latest features
- Samsung Galaxy (Android 11+) - Popular device
- OnePlus (Android 10+) - Different OEM

🔧 Android Specific Features:
- [ ] Back button handling
- [ ] Android notification channels
- [ ] Battery optimization settings
- [ ] Different screen densities
- [ ] Custom Android themes
```

### 5. Performance Testing

#### Memory Usage
```bash
# Monitor memory usage during testing
# Use React Native debugger or Flipper

✅ Test Scenarios:
- [ ] Navigate between screens 20+ times
- [ ] Load large incident lists (100+ items)
- [ ] Open/close modals repeatedly
- [ ] Search with rapid typing
- [ ] Upload multiple profile pictures
```

#### Network Performance
```bash
# Test with different network conditions
# Use network throttling in dev tools

✅ Test Conditions:
- [ ] Fast WiFi (baseline performance)
- [ ] Slow 3G (3G throttling)
- [ ] Offline mode (airplane mode)
- [ ] Intermittent connectivity (toggle WiFi)
- [ ] High latency (500ms+ delay)
```

### 6. Accessibility Testing

#### Screen Reader Testing
```bash
✅ VoiceOver/TalkBack Testing:
- [ ] All interactive elements have labels
- [ ] Navigation announcements are clear
- [ ] Form fields have proper labels
- [ ] Error messages are announced
- [ ] Loading states are announced
```

#### Visual Accessibility
```bash
✅ Visual Testing:
- [ ] High contrast mode support
- [ ] Large text/Dynamic Type support
- [ ] Color blind friendly (no color-only indicators)
- [ ] Touch targets meet minimum size (44px)
- [ ] Focus indicators are visible
```

### 7. Error Handling Testing

#### Network Errors
```bash
✅ Test Scenarios:
- [ ] API timeout (simulate slow server)
- [ ] 401 Unauthorized (expired token)
- [ ] 403 Forbidden (insufficient permissions)
- [ ] 404 Not Found (deleted incident)
- [ ] 500 Server Error (backend down)
- [ ] Network unreachable (airplane mode)
```

#### Input Validation
```bash
✅ Test Scenarios:
- [ ] Empty search queries
- [ ] Very long search queries (1000+ chars)
- [ ] Special characters in search
- [ ] XSS attempt strings
- [ ] Invalid incident IDs
- [ ] Missing required fields
```

#### App State Management
```bash
✅ Test Scenarios:
- [ ] App backgrounding during API calls
- [ ] App kill/restore during workflows
- [ ] Low memory warnings
- [ ] Device rotation during modals
- [ ] Rapid navigation/back button
```

### 8. Security Testing

#### Data Protection
```bash
✅ Security Checklist:
- [ ] Sensitive data not logged to console
- [ ] No hardcoded credentials in bundle
- [ ] JWT tokens stored securely
- [ ] Profile images uploaded securely
- [ ] No sensitive data in screenshots (app switcher)
```

#### API Security
```bash
✅ API Security:
- [ ] All requests use HTTPS
- [ ] JWT tokens included in headers
- [ ] Unauthorized requests handled properly
- [ ] Rate limiting respected
- [ ] Input sanitization on frontend
```

### 9. Regression Testing

#### Previous Feature Validation
```bash
✅ Existing Features:
- [ ] Login/logout still works
- [ ] Incident creation unchanged
- [ ] Status updates still function
- [ ] User permissions respected
- [ ] Existing navigation works
```

### 10. Performance Benchmarks

#### Load Times
```bash
✅ Performance Targets:
- [ ] App launch < 3 seconds (cold start)
- [ ] Screen navigation < 500ms
- [ ] Search results < 1 second
- [ ] API calls < 2 seconds (good network)
- [ ] Image uploads < 5 seconds
```

#### User Experience Metrics
```bash
✅ UX Metrics:
- [ ] No blocking UI operations > 100ms
- [ ] Smooth 60fps animations
- [ ] Responsive touch interactions
- [ ] Loading states for operations > 200ms
- [ ] Graceful degradation on slow networks
```

## Test Environment Setup

### 1. Development Testing
```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator  
npm run android

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### 2. Production Testing
```bash
# Build production bundle
eas build --platform ios --profile production
eas build --platform android --profile production

# Install on physical devices
# Test with production API endpoints
# Verify all features work in production environment
```

## Bug Reporting Template

When reporting issues, include:

```
🐛 Bug Report

**Environment:**
- Device: [iPhone 14 Pro / Pixel 6]
- OS Version: [iOS 16.1 / Android 12]
- App Version: [1.0.0]
- Network: [WiFi / 4G / Offline]

**Steps to Reproduce:**
1. Open incidents list
2. Search for "test"
3. Tap on first result
4. Try to assign incident

**Expected Behavior:**
Confirmation dialog should appear

**Actual Behavior:**
App crashes with error

**Screenshots/Videos:**
[Attach if applicable]

**Console Logs:**
[Include relevant error logs]
```

## Testing Completion Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass  
- [ ] Manual testing checklist completed
- [ ] Performance benchmarks met
- [ ] Accessibility requirements satisfied
- [ ] Security validation completed
- [ ] Cross-platform compatibility verified
- [ ] Regression testing passed
- [ ] Production environment tested
- [ ] Bug reports resolved

## Conclusion

This comprehensive testing approach ensures that all new features work correctly, integrate seamlessly with existing functionality, and provide a high-quality user experience across different devices and network conditions.

For questions or issues with testing procedures, please refer to the development team or create an issue in the project repository.