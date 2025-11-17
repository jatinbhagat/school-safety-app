/**
 * Demo Mode Utilities
 * Provides functions to detect and manage demo mode across the application
 */

export interface DemoConfig {
  enabled: boolean;
  schoolSlug: string;
  demoUserId?: string;
}

/**
 * Check if demo mode is enabled via query param or localStorage
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check query param ?demo=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true') {
    return true;
  }

  // Check localStorage flag
  try {
    const demoFlag = localStorage.getItem('demo_mode');
    return demoFlag === 'true';
  } catch (error) {
    console.error('Error reading demo mode from localStorage:', error);
    return false;
  }
}

/**
 * Enable demo mode in localStorage
 */
export function enableDemoMode(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('demo_mode', 'true');
    // Reload to apply demo mode
    window.location.reload();
  } catch (error) {
    console.error('Error enabling demo mode:', error);
  }
}

/**
 * Disable demo mode
 */
export function disableDemoMode(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('demo_mode');
    // Remove query param if present
    const url = new URL(window.location.href);
    url.searchParams.delete('demo');
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('Error disabling demo mode:', error);
  }
}

/**
 * Get demo configuration
 */
export function getDemoConfig(): DemoConfig {
  return {
    enabled: isDemoMode(),
    schoolSlug: 'demo-school',
    demoUserId: 'demo-user-001',
  };
}

/**
 * Get demo data for various scenarios
 */
export const DEMO_DATA = {
  school: {
    id: 'demo-school-001',
    slug: 'demo-school',
    name: 'Demo High School',
  },

  incidents: [
    {
      id: 'demo-inc-001',
      category: 'bullying',
      description: 'Student being bullied in cafeteria',
      timestamp: Date.now() - 3600000,
      status: 'pending',
      severity: 'high',
      location: 'Cafeteria',
    },
    {
      id: 'demo-inc-002',
      category: 'harassment',
      description: 'Verbal harassment in hallway',
      timestamp: Date.now() - 7200000,
      status: 'triaged',
      severity: 'medium',
      location: 'Hallway A',
    },
    {
      id: 'demo-inc-003',
      category: 'cyberbullying',
      description: 'Online harassment on social media',
      timestamp: Date.now() - 10800000,
      status: 'assigned',
      severity: 'high',
      location: 'Online',
    },
  ],

  heatmap: {
    locations: [
      { id: 'cafeteria', name: 'Cafeteria', incidents: 12, x: 2, y: 3 },
      { id: 'hallway-a', name: 'Hallway A', incidents: 8, x: 1, y: 2 },
      { id: 'hallway-b', name: 'Hallway B', incidents: 5, x: 3, y: 2 },
      { id: 'gym', name: 'Gymnasium', incidents: 7, x: 0, y: 4 },
      { id: 'library', name: 'Library', incidents: 3, x: 4, y: 1 },
      { id: 'parking', name: 'Parking Lot', incidents: 9, x: 1, y: 5 },
      { id: 'bathroom-1', name: 'Bathroom 1st Floor', incidents: 6, x: 2, y: 1 },
      { id: 'classroom-block', name: 'Classroom Block', incidents: 4, x: 3, y: 3 },
    ],
  },

  safetyScore: {
    overall: 72,
    components: [
      { name: 'Response Time', score: 85, weight: 0.25 },
      { name: 'Incident Resolution', score: 78, weight: 0.30 },
      { name: 'Prevention Programs', score: 65, weight: 0.20 },
      { name: 'Student Engagement', score: 60, weight: 0.15 },
      { name: 'Staff Training', score: 70, weight: 0.10 },
    ],
    trend: 'improving',
    previousScore: 68,
  },

  triageRouting: {
    suggestion: {
      role: 'School Counselor',
      confidence: 0.87,
      rationale: 'This incident involves emotional distress and requires counseling support. The reported behavior patterns suggest peer conflict that would benefit from mediation.',
      alternativeRoles: [
        { role: 'Assistant Principal', confidence: 0.65 },
        { role: 'Social Worker', confidence: 0.71 },
      ],
    },
  },

  microGuides: [
    {
      id: 'guide-001',
      title: 'What to do if you witness bullying',
      content: 'If you see someone being bullied, report it immediately using this kiosk. Your report is anonymous and helps keep everyone safe.',
      enabled: true,
      priority: 1,
    },
    {
      id: 'guide-002',
      title: 'Mental health resources available',
      content: 'Our school counselors are here to help. You can request a confidential meeting anytime.',
      enabled: true,
      priority: 2,
    },
    {
      id: 'guide-003',
      title: 'Cyberbullying awareness',
      content: 'Online harassment is just as serious as in-person bullying. Report any concerning online behavior.',
      enabled: true,
      priority: 3,
    },
  ],
};

/**
 * Simulate network offline mode for demo
 */
export function simulateOfflineMode(offline: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('demo_offline_mode', offline ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting offline mode:', error);
  }
}

/**
 * Check if in simulated offline mode
 */
export function isSimulatedOffline(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem('demo_offline_mode') === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Get demo images for attachments
 */
export function getDemoImages(): string[] {
  return [
    '/demo/sample-image-1.jpg',
    '/demo/sample-image-2.jpg',
    '/demo/sample-image-3.jpg',
  ];
}

/**
 * Reset all demo data
 */
export function resetDemoData(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear demo-related localStorage items
    localStorage.removeItem('demo_offline_mode');
    localStorage.removeItem('demo_incidents');
    localStorage.removeItem('demo_tour_completed');

    console.log('Demo data reset successfully');
  } catch (error) {
    console.error('Error resetting demo data:', error);
  }
}
