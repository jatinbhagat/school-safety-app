# Admin Dashboard

A Next.js-based admin dashboard for managing and exporting school safety incidents.

## Features

- **Incident List View**: Displays all incidents with key information
  - ID
  - Category
  - Risk Level (extracted from AI metadata)
  - Created At timestamp
  - Status

- **CSV Export**: Download all incidents as a CSV file
  - Automatic date-stamped filename
  - Includes all visible columns

- **Statistics**: Quick overview of incident counts by status

## Setup

### Prerequisites

- Node.js 18+ installed
- Backend API running on port 3001 (or configured via `NEXT_PUBLIC_API_URL`)
- Database with incidents table populated

### Installation

1. Navigate to the PWA directory:
   ```bash
   cd services/pwa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure the API URL:
   Create a `.env.local` file in `services/pwa/`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Accessing the Admin Dashboard

Once the application is running, navigate to:

```
http://localhost:3000/admin
```

## Testing

### Manual Testing Steps

1. **Start the backend server** (required for data):
   ```bash
   cd services/backend
   npm run dev
   ```

2. **Start the PWA application**:
   ```bash
   cd services/pwa
   npm run dev
   ```

3. **Access the admin dashboard**:
   - Open browser to `http://localhost:3000/admin`

4. **Verify incident list**:
   - Incidents should load and display in a table
   - Columns should show: ID, Category, Risk Level, Created At, Status
   - Statistics bar should show correct counts

5. **Test CSV Export**:
   - Click "Export CSV" button
   - A CSV file should download automatically
   - Filename format: `incidents-export-YYYY-MM-DD.csv`
   - Open the CSV and verify all columns are present
   - Verify data matches what's displayed in the table

6. **Test error handling**:
   - Stop the backend server
   - Refresh the admin page
   - Should show error message with retry button
   - Click retry button
   - Restart backend and retry should work

### API Endpoints Used

The admin dashboard uses these backend endpoints:

- `GET /incidents` - Fetches all incidents for display
- `GET /admin/export` - Downloads incidents as CSV

### Sample Test Data

If you need to populate test data, you can use the existing reporting endpoints:

```bash
# Submit a test incident
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bullying",
    "description": "Test incident",
    "class_section": "Room 101",
    "ai_meta": {
      "severity": "medium"
    }
  }'
```

## Troubleshooting

### Issue: "Failed to fetch incidents"

**Solution**:
- Ensure backend server is running on port 3001
- Check CORS settings in backend
- Verify database connection

### Issue: CSV export fails

**Solution**:
- Check browser console for errors
- Verify `/admin/export` endpoint is accessible
- Ensure backend server is running

### Issue: Risk level shows "N/A"

**Solution**:
- This is expected if `ai_meta` doesn't contain `risk_level` or `severity`
- Update incident records to include risk assessment data

## File Structure

```
services/pwa/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard component
│   ├── layout.tsx
│   └── page.tsx
├── package.json
└── ADMIN_DASHBOARD_README.md
```

## Backend Changes

This feature requires the following backend endpoint:

**New endpoint**: `GET /admin/export`
- Location: `services/backend/src/handlers/exportIncidents.ts`
- Returns: CSV file with incident data
- Format: `text/csv` with appropriate headers

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Future Enhancements

Potential improvements:
- Add filtering by date range, status, or category
- Add pagination for large datasets
- Add sorting by column headers
- Add individual incident detail view
- Add authentication/authorization
- Export filtered results only
- Add Excel (XLSX) export option
