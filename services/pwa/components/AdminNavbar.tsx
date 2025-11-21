'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';

interface AdminNavbarProps {
  institutionName?: string;
  institutionSlug?: string;
  userRole?: string;
  userName?: string;
}

export default function AdminNavbar({ institutionName, institutionSlug, userRole, userName }: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/routing-rules', label: 'Routing Rules', icon: '🎯' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    { href: '/admin/reporting-config', label: 'Reporting Config', icon: '📝' },
    { href: '/admin/guides', label: 'Guides', icon: '📚' },
    ...(institutionSlug ? [{ href: `/kiosk/${institutionSlug}`, label: 'View Kiosk', icon: '📱', external: true }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
    };

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  return (
    <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center gap-3 group">
              <Logo size="md" />
              <div className="hidden md:block">
                <div className="text-lg font-bold text-gray-900">
                  {institutionName || 'Admin Portal'}
                </div>
                <div className="text-xs text-gray-500">Dashboard</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2
                  ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* User Dropdown (Desktop) */}
            <div className="hidden md:block relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {userName ? userName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-sm font-semibold text-gray-900">
                    {userName || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {userRole || 'super_admin'}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span>⚙️</span>
                      <span>Settings</span>
                    </div>
                  </Link>
                  <Link
                    href="/admin/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span>👤</span>
                      <span>Profile</span>
                    </div>
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <div className="flex items-center gap-3">
                      <span>🚪</span>
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  block px-4 py-3 rounded-lg font-medium text-sm transition-all
                  ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}

            <hr className="my-4 border-gray-200" />

            {/* User Info */}
            <div className="px-4 py-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold">
                  {userName ? userName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {userName || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {userRole || 'super_admin'}
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/admin/profile"
              className="block px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <span>👤</span>
                <span>Profile</span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50"
            >
              <div className="flex items-center gap-3">
                <span>🚪</span>
                <span>Logout</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
