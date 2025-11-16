# Staff App

A React Native mobile application built with Expo for school staff to manage and respond to safety incidents.

## Features

- **Incidents List**: View all reported incidents with status, type, and priority
- **Incident Details**: View detailed information about each incident
- **Assign to Me**: Staff can assign incidents to themselves for handling
- **Pull to Refresh**: Refresh the incidents list to get the latest data
- **Real-time Status Updates**: Local state updates after assigning incidents

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Backend API running on `http://localhost:3001` (or configured API base URL)

## Installation

1. Navigate to the staff-app directory:
   ```bash
   cd services/staff-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The app connects to the backend API. The base URL is configured in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://localhost:3001"
    }
  }
}
```

To change the API URL, update the `apiBaseUrl` value in `app.json`.

## Running the App

Start the Expo development server:

```bash
npm start
```

Or use the shorthand:

```bash
expo start
```

This will open the Expo DevTools in your browser. From there, you can:

- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Scan the QR code with the Expo Go app on your physical device

### Platform-specific commands:

```bash
# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## Project Structure

```
staff-app/
├── api/
│   └── client.js          # API client for backend communication
├── screens/
│   ├── IncidentsList.js   # List of all incidents
│   └── IncidentDetail.js  # Detailed view of a single incident
├── App.js                 # Main app component with navigation
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## API Endpoints Used

- `GET /incidents` - Fetch all incidents
- `POST /incidents/:id/assign` - Assign an incident to the current user

## Troubleshooting

### Cannot connect to backend

- Ensure the backend server is running on `http://localhost:3001`
- If running on a physical device, update the `apiBaseUrl` in `app.json` to use your computer's IP address instead of `localhost`
- For Android emulator, you may need to use `10.0.2.2` instead of `localhost`

### Dependencies issues

If you encounter dependency issues, try:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Notes

- The app uses React Navigation for screen navigation
- State management is handled with React hooks (useState, useEffect)
- Error handling includes user-friendly alerts and retry options
- The UI follows iOS design guidelines with custom styling
