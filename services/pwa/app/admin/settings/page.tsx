'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState({
    institutionName: 'Demo School',
    urlSlug: 'demo-school',
    logoUrl: '',
    brandColor: '#3B82F6',
    features: {
      alerts: true,
      reports: true,
      notifications: true,
      analytics: true,
    },
  });

  const [admins, setAdmins] = useState([
    { id: 1, name: 'John Doe', email: 'john@demoschool.edu', role: 'Super Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@demoschool.edu', role: 'Admin' },
  ]);

  const [saved, setSaved] = useState(false);

  const updateSetting = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateFeature = (feature: keyof typeof settings.features) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }));
  };

  const handleSave = () => {
    // In a real implementation, this would save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'branding', name: 'Branding & URL', icon: '🎨' },
    { id: 'features', name: 'Features', icon: '⚙️' },
    { id: 'admins', name: 'Admin Users', icon: '👥' },
    { id: 'checklist', name: 'Onboarding Checklist', icon: '✓' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">SafelyNotify.com</Link>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Institution Settings</h1>
          <p className="text-lg text-gray-600">
            Manage your institution's branding, features, and administrative settings
          </p>
        </div>

        {/* Save Banner */}
        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fadeIn">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700 font-semibold">Settings saved successfully!</span>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="card p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all mb-1 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Branding & URL Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Branding Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Institution Display Name
                      </label>
                      <input
                        type="text"
                        value={settings.institutionName}
                        onChange={(e) => updateSetting('institutionName', e.target.value)}
                        className="input"
                        placeholder="Your Institution Name"
                      />
                      <p className="mt-1 text-sm text-gray-500">This name will appear throughout the platform</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Institution Logo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <button className="btn btn-secondary">
                            Upload Logo
                          </button>
                          <p className="mt-1 text-sm text-gray-500">
                            Recommended: Square image, at least 200x200px, PNG or JPG
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Primary Brand Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={settings.brandColor}
                          onChange={(e) => updateSetting('brandColor', e.target.value)}
                          className="w-20 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.brandColor}
                          onChange={(e) => updateSetting('brandColor', e.target.value)}
                          className="input w-32"
                          placeholder="#3B82F6"
                        />
                        <span className="text-sm text-gray-600">
                          This color will be used for buttons, links, and accents
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Public URL Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        URL Slug
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">https://</span>
                        <input
                          type="text"
                          value={settings.urlSlug}
                          onChange={(e) => updateSetting('urlSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          className="input flex-1"
                          placeholder="your-institution"
                        />
                        <span className="text-gray-600">.safelynotify.com</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Your public kiosk URL: <strong className="text-blue-600">https://{settings.urlSlug || 'your-institution'}.safelynotify.com</strong>
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-yellow-800">Important Note</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Changing your URL slug will affect all existing links and QR codes. Make sure to update any printed materials.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">Generate QR Code</h3>
                        <p className="text-sm text-gray-600">Create a QR code for easy kiosk access</p>
                      </div>
                      <button className="btn btn-secondary">
                        Generate QR
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleSave} className="btn btn-primary px-8">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Management</h2>
                  <p className="text-gray-600 mb-6">Enable or disable features for your institution</p>

                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.features.alerts}
                        onChange={() => updateFeature('alerts')}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Safety Alerts</h3>
                        <p className="text-sm text-gray-600">Send emergency notifications to staff, students, and parents</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${settings.features.alerts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {settings.features.alerts ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>

                    <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.features.reports}
                        onChange={() => updateFeature('reports')}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Incident Reporting</h3>
                        <p className="text-sm text-gray-600">Anonymous reporting kiosks for safety concerns</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${settings.features.reports ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {settings.features.reports ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>

                    <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.features.notifications}
                        onChange={() => updateFeature('notifications')}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Notifications & Announcements</h3>
                        <p className="text-sm text-gray-600">Keep your community informed with regular updates</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${settings.features.notifications ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {settings.features.notifications ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>

                    <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.features.analytics}
                        onChange={() => updateFeature('analytics')}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Analytics & Reporting</h3>
                        <p className="text-sm text-gray-600">Track incidents and monitor safety trends</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${settings.features.analytics ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {settings.features.analytics ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleSave} className="btn btn-primary px-8">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Admin Users Tab */}
            {activeTab === 'admins' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="card">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Administrator Users</h2>
                      <p className="text-gray-600">Manage who has access to your institution's admin panel</p>
                    </div>
                    <button className="btn btn-primary">
                      + Add Admin
                    </button>
                  </div>

                  <div className="space-y-3">
                    {admins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-lg">
                              {admin.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                            <p className="text-sm text-gray-600">{admin.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {admin.role}
                          </span>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Admin Permissions</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Super Admins can manage all settings and add/remove other admins</li>
                      <li>• Admins can view reports and send alerts but cannot change settings</li>
                      <li>• All actions are logged for security and compliance</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Onboarding Checklist Tab */}
            {activeTab === 'checklist' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Onboarding Checklist</h2>
                  <p className="text-gray-600 mb-6">Complete these steps to get the most out of SafelyNotify.com</p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Account Created</h3>
                        <p className="text-sm text-gray-600">Your SafelyNotify.com account is active</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Email Verified</h3>
                        <p className="text-sm text-gray-600">Your email has been confirmed</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Upload Institution Logo</h3>
                        <p className="text-sm text-gray-600 mb-2">Add your logo to customize the experience</p>
                        <button className="text-blue-600 text-sm font-semibold hover:underline">
                          Upload now →
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Invite Staff Members</h3>
                        <p className="text-sm text-gray-600 mb-2">Add staff who should have admin access</p>
                        <button className="text-blue-600 text-sm font-semibold hover:underline">
                          Invite staff →
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Test Reporting Kiosk</h3>
                        <p className="text-sm text-gray-600 mb-2">Try submitting a test incident report</p>
                        <Link href={`/kiosk/${settings.urlSlug}`} className="text-blue-600 text-sm font-semibold hover:underline">
                          Visit kiosk →
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Schedule Guided Tour</h3>
                        <p className="text-sm text-gray-600 mb-2">Learn all features with a guided walkthrough</p>
                        <button className="text-blue-600 text-sm font-semibold hover:underline">
                          Start tour →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
