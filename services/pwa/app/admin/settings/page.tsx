'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Admin {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  email_verified: boolean;
  last_login_at?: string;
  created_at: string;
}

interface Institution {
  id: number;
  institution_name: string;
  url_slug: string;
  logo_url?: string;
  brand_color?: string;
  alerts_enabled: boolean;
  reports_enabled: boolean;
  notifications_enabled: boolean;
  analytics_enabled: boolean;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  const [settings, setSettings] = useState({
    institutionName: '',
    urlSlug: '',
    logoUrl: '',
    brandColor: '#3B82F6',
    features: {
      alerts: true,
      reports: true,
      notifications: true,
      analytics: false,
    },
  });

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin',
  });

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fetch institution and admin data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Get current user to get institution ID
      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!meResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await meResponse.json();
      const instId = userData.institution?.id;
      setInstitutionId(instId);
      setUserName(userData.name || '');
      setUserRole(userData.role || '');

      // Fetch institution details
      const instResponse = await fetch(`${API_BASE_URL}/api/institutions/${instId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!instResponse.ok) {
        throw new Error('Failed to fetch institution data');
      }

      const instData: Institution = await instResponse.json();

      setSettings({
        institutionName: instData.institution_name || '',
        urlSlug: instData.url_slug || '',
        logoUrl: instData.logo_url || '',
        brandColor: instData.brand_color || '#3B82F6',
        features: {
          alerts: instData.alerts_enabled ?? true,
          reports: instData.reports_enabled ?? true,
          notifications: instData.notifications_enabled ?? true,
          analytics: instData.analytics_enabled ?? false,
        },
      });

      // Fetch admins
      const adminsResponse = await fetch(`${API_BASE_URL}/api/institutions/${instId}/admins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!adminsResponse.ok) {
        throw new Error('Failed to fetch admins');
      }

      const adminsData: Admin[] = await adminsResponse.json();
      setAdmins(adminsData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!institutionId) return;

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      if (activeTab === 'branding') {
        // Save branding settings
        const response = await fetch(`${API_BASE_URL}/api/institutions/${institutionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            institutionName: settings.institutionName,
            brandColor: settings.brandColor,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save settings');
        }
      } else if (activeTab === 'features') {
        // Save feature toggles
        const response = await fetch(`${API_BASE_URL}/api/institutions/${institutionId}/features`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            alerts: settings.features.alerts,
            reports: settings.features.reports,
            notifications: settings.features.notifications,
            analytics: settings.features.analytics,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save features');
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!institutionId) return;

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/institutions/${institutionId}/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newAdmin),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add admin');
      }

      const result = await response.json();

      // Add the new admin to the list
      setAdmins([...admins, result.admin]);

      // Reset form and close modal
      setNewAdmin({ name: '', email: '', phone: '', role: 'admin' });
      setShowAddAdminModal(false);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Add admin error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !institutionId) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      alert('Please upload a PNG, JPG, or SVG file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${API_BASE_URL}/api/institutions/${institutionId}/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const result = await response.json();
      updateSetting('logoUrl', result.logoUrl);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateQR = async () => {
    if (!institutionId) return;

    try {
      setGeneratingQR(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/institutions/${institutionId}/qr-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'kiosk',
          size: 512,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const result = await response.json();
      setQrCodeUrl(result.qrCodeUrl);

      // Download the QR code
      const link = document.createElement('a');
      link.href = result.qrCodeUrl;
      link.download = `${settings.urlSlug}-qr-code.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setGeneratingQR(false);
    }
  };

  const formatRole = (role: string) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Admin';
    if (role === 'staff') return 'Staff';
    return role;
  };

  const tabs = [
    { id: 'branding', name: 'Branding & URL', icon: '🎨' },
    { id: 'features', name: 'Features', icon: '⚙️' },
    { id: 'admins', name: 'Admin Users', icon: '👥' },
    { id: 'checklist', name: 'Onboarding Checklist', icon: '✓' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar
        institutionName={settings.institutionName}
        userRole={userRole}
        userName={userName}
      />
      <Breadcrumbs />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Institution Settings</h1>
          <p className="text-lg text-gray-600">
            Manage your institution's branding, features, and administrative settings
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-semibold">{error}</span>
          </div>
        )}

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
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <button
                            onClick={triggerFileInput}
                            disabled={uploading}
                            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploading ? 'Uploading...' : 'Upload Logo'}
                          </button>
                          <p className="mt-1 text-sm text-gray-500">
                            Recommended: Square image, at least 200x200px, PNG or JPG (max 5MB)
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
                          disabled
                          className="input flex-1 bg-gray-100 cursor-not-allowed"
                          placeholder="your-institution"
                        />
                        <span className="text-gray-600">.safelynotify.com</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Your public kiosk URL: <strong className="text-blue-600">https://{settings.urlSlug || 'your-institution'}.safelynotify.com</strong>
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        URL slug cannot be changed after onboarding. Contact support if you need to update it.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">Generate QR Code</h3>
                        <p className="text-sm text-gray-600">Create a QR code for easy kiosk access</p>
                      </div>
                      <button
                        onClick={handleGenerateQR}
                        disabled={generatingQR}
                        className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingQR ? 'Generating...' : 'Generate QR'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
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
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
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
                    <button
                      onClick={() => setShowAddAdminModal(true)}
                      className="btn btn-primary"
                    >
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
                            {!admin.email_verified && (
                              <span className="text-xs text-yellow-600">Email not verified</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {formatRole(admin.role)}
                          </span>
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
                        <button
                          onClick={() => setActiveTab('branding')}
                          className="text-blue-600 text-sm font-semibold hover:underline"
                        >
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
                        <button
                          onClick={() => setActiveTab('admins')}
                          className="text-blue-600 text-sm font-semibold hover:underline"
                        >
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

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Administrator</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="input"
                  placeholder="john@school.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                  className="input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="input"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setNewAdmin({ name: '', email: '', phone: '', role: 'admin' });
                    setError(null);
                  }}
                  className="btn btn-secondary flex-1"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAdmin}
                  disabled={saving || !newAdmin.name || !newAdmin.email || !newAdmin.role}
                  className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
