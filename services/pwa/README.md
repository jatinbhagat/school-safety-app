# School Safety PWA Kiosk

A Progressive Web App (PWA) kiosk interface for anonymous school safety reporting with offline support.

## Features

- 🎯 **Large Touch-Friendly Buttons** - Easy category selection for kiosk mode
- 📱 **Offline Support** - Reports are queued when offline and synced when connection returns
- 💾 **IndexedDB Storage** - Persistent local storage with localStorage fallback
- 🔒 **Anonymous Reporting** - No login required
- 🏫 **Multi-School Support** - Each school gets its own kiosk at `/kiosk/[school-slug]`

## Categories

The kiosk supports reporting for:
- Bullying
- Harassment
- Cyberbullying
- Physical
- Mental Stress
- Academic Pressure
- Cheating
- General

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Accessing a School Kiosk

Navigate to: `http://localhost:3000/kiosk/[school-slug]`

Example: `http://localhost:3000/kiosk/demo-school`

## Architecture

### Files

- **app/kiosk/[slug]/page.tsx** - Main kiosk interface with category buttons and modal
- **lib/offline.ts** - Offline queue management (IndexedDB + localStorage fallback)
- **app/layout.tsx** - Root layout
- **app/page.tsx** - Home page

### Offline Queue

The offline queue (`lib/offline.ts`) provides:

- `enqueueReport(report)` - Add a report to the queue
- `syncReports()` - Sync pending reports to the backend (stub implementation)
- Automatic fallback to localStorage if IndexedDB is unavailable

### API Integration

Reports are POSTed to `http://localhost:3001/report` with the following payload:

```json
{
  "schoolSlug": "demo-school",
  "category": "bullying",
  "description": "Optional details..."
}
```

If the backend is offline or the request fails, the report is automatically queued for later sync.

## Production Build

```bash
npm run build
npm start
```

## Future Enhancements

- [ ] Implement full PWA manifest and service worker
- [ ] Add `next-pwa` or `workbox` for advanced caching
- [ ] Implement automatic background sync
- [ ] Add retry logic with exponential backoff for failed syncs
- [ ] Add admin dashboard for viewing queued reports
- [ ] Implement report encryption for enhanced privacy
- [ ] Add multi-language support

## Development Notes

This is a Next.js 14 app using:
- App Router (not Pages Router)
- TypeScript
- Client-side rendering for the kiosk page
- Inline styles (can be migrated to CSS modules or Tailwind)

## Testing Offline Mode

1. Open Chrome DevTools
2. Go to Network tab
3. Select "Offline" from the throttling dropdown
4. Submit a report - it should be queued
5. Go back "Online"
6. Reports can be synced via `offlineQueue.syncReports()`

## License

MIT
