'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    if (!pathname || pathname === '/admin') {
      return [{ label: 'Dashboard', href: '/admin' }];
    }

    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', href: '/admin' }];

    // Map path segments to readable labels
    const labelMap: Record<string, string> = {
      'admin': 'Dashboard',
      'settings': 'Settings',
      'reporting-config': 'Reporting Config',
      'guides': 'Guides',
      'demo': 'Demo',
      'profile': 'Profile',
      'safety-score-demo': 'Safety Score',
      'staff-response-demo': 'Staff Response',
      'micro-guides-demo': 'Micro Guides',
      'triage-demo': 'Triage',
      'heatmap-demo': 'Heatmap',
      'incidents': 'Incidents',
    };

    // Special handling for incidents routes
    if (pathname.includes('/admin/incidents/')) {
      // For individual incident pages, just show Dashboard > Incident Detail
      const incidentId = pathname.split('/').pop();
      breadcrumbs.push({
        label: `Incident #${incidentId}`,
        href: pathname, // Current page, will be rendered as non-link
      });
      return breadcrumbs;
    }

    let currentPath = '';
    for (let i = 0; i < paths.length; i++) {
      const segment = paths[i];
      currentPath += `/${segment}`;

      // Skip 'admin' in breadcrumbs (already added as Dashboard)
      if (segment === 'admin') continue;

      breadcrumbs.push({
        label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on dashboard
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <div key={crumb.href} className="flex items-center gap-2">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}

                {isLast ? (
                  <span className="font-semibold text-gray-900">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
