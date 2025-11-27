'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';
import StepIndicator from '@/components/StepIndicator';
import Logo from '@/components/Logo';
import { COUNTRIES, getStatesForCountry, countryRequiresState } from '@/lib/countries';

type InstitutionType = 'school' | 'college' | 'university' | 'corporate' | 'ngo' | '';

interface OnboardingData {
  institutionType: InstitutionType;
  institutionName: string;
  country: string;
  state: string;
  city: string;
  location: string; // Legacy field
  email: string;
  contactName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  urlSlug: string;
  features: {
    alerts: boolean;
    reports: boolean;
    notifications: boolean;
    analytics: boolean;
  };
  staffEmails: string;
  acceptedTerms: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    institutionType: '',
    institutionName: '',
    country: '',
    state: '',
    city: '',
    location: '', // Legacy
    email: '',
    contactName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    urlSlug: '',
    features: {
      alerts: true,
      reports: true,
      notifications: true,
      analytics: false,
    },
    staffEmails: '',
    acceptedTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [institutionId, setInstitutionId] = useState<number | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const totalSteps = data.institutionType === 'corporate' || data.institutionType === 'ngo' ? 2 : 3;
  const isEducational = ['school', 'college', 'university'].includes(data.institutionType);

  const updateData = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateFeature = (feature: keyof OnboardingData['features']) => {
    setData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }));
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleInstitutionTypeSelect = (type: InstitutionType) => {
    updateData('institutionType', type);
    // Auto-generate slug from institution name
    if (data.institutionName) {
      const slug = data.institutionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      updateData('urlSlug', slug);
    }
    nextStep();
  };

  const generateSlug = () => {
    if (data.institutionName) {
      const slug = data.institutionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      updateData('urlSlug', slug);
    }
  };

  const handleCompleteOnboarding = async () => {
    // Clear previous errors
    setError('');
    setErrorDetails(null);

    // Client-side validation
    const validationErrors: string[] = [];

    if (!data.institutionName || data.institutionName.trim().length < 2) {
      validationErrors.push('Institution name must be at least 2 characters');
    }
    if (!data.country) {
      validationErrors.push('Country is required');
    }
    if (countryRequiresState(data.country) && !data.state) {
      validationErrors.push('State/Province is required for this country');
    }
    if (!data.city || data.city.trim().length < 2) {
      validationErrors.push('City must be at least 2 characters');
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      validationErrors.push('Valid email address is required');
    }
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
      validationErrors.push('Phone number must be at least 10 digits');
    }
    if (!data.contactName || data.contactName.trim().length < 2) {
      validationErrors.push('Contact name must be at least 2 characters');
    }
    if (!data.password || data.password.length < 8) {
      validationErrors.push('Password must be at least 8 characters');
    }
    if (data.password !== data.confirmPassword) {
      validationErrors.push('Passwords do not match');
    }
    if (!data.acceptedTerms) {
      validationErrors.push('You must accept the terms and conditions');
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setLoading(true);

    try {
      console.log('[Frontend] Starting atomic onboarding...');

      // Prepare staff emails array
      const staffEmailsArray = data.staffEmails
        ? data.staffEmails.split(',').map(email => email.trim()).filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        : [];

      // Single atomic onboarding API call
      const response = await fetch(`${API_BASE_URL}/api/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionType: data.institutionType,
          institutionName: data.institutionName,
          country: data.country,
          state: data.state || null,
          city: data.city,
          email: data.email,
          contactName: data.contactName,
          phone: data.phone,
          password: data.password,
          urlSlug: data.urlSlug,
          features: data.features,
          staffEmails: staffEmailsArray,
          acceptedTerms: data.acceptedTerms,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Frontend] Atomic onboarding error:', errorData);

        // Handle different error types
        if (errorData.code === 'DUPLICATE_EMAIL') {
          setError(
            `This email is already registered. Please use a different email or contact support at ${errorData.details?.supportEmail || 'support@safelynotify.com'}`
          );
        } else if (errorData.code === 'DUPLICATE_SLUG') {
          setError('The URL slug is already taken. Please choose a different one.');
        } else if (errorData.code === 'VALIDATION_ERROR') {
          // Display field-specific errors
          if (errorData.details?.errors) {
            const fieldErrors = errorData.details.errors.map((e: any) =>
              `${e.field}: ${e.message}`
            ).join('\n');
            setError(errorData.message + ':\n' + fieldErrors);
          } else {
            setError(errorData.message);
          }
          setErrorDetails(errorData.details);
        } else if (errorData.code === 'DATABASE_ERROR') {
          setError('Database connection issue. Please check if the backend service is running and try again in a moment.');
        } else {
          setError(errorData.message || 'Failed to complete onboarding. Please try again.');
        }

        setErrorDetails(errorData);
        return;
      }

      const result = await response.json();
      console.log('[Frontend] Onboarding completed successfully');
      
      // Set institution ID for reference
      setInstitutionId(result.institutionId);

      // Store JWT token
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      // Move to success step
      nextStep();
    } catch (err) {
      console.error('[Frontend] Onboarding exception:', err);

      // Handle network and other errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(
          'Cannot connect to the server. Please check:\n' +
          '1. Is the backend service running on port 3001?\n' +
          '2. Is your internet connection working?\n' +
          '3. Is there a firewall blocking the connection?\n\n' +
          'Try refreshing the page or contact support@safelynotify.com'
        );
      } else {
        setError(
          (err instanceof Error ? err.message : 'An unexpected error occurred') +
          '\n\nIf the problem persists, please contact support@safelynotify.com'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError('');
    setErrorDetails(null);
    handleCompleteOnboarding();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Logo size="lg" />
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of {totalSteps}</span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Institution Type */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Institution Type</h1>
            <p className="text-lg text-gray-600 mb-8">
              Select the category that best describes your organization.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Educational Institutions */}
              <button
                onClick={() => handleInstitutionTypeSelect('school')}
                className="card text-left hover:border-blue-400 hover:shadow-lg transition-all p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <svg className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">School</h3>
                    <p className="text-gray-600 text-sm">K-12 schools and academies</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                      <span className="text-green-700 text-xs font-semibold">✓ Eligible for Free Access</span>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleInstitutionTypeSelect('college')}
                className="card text-left hover:border-blue-400 hover:shadow-lg transition-all p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                    <svg className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">College</h3>
                    <p className="text-gray-600 text-sm">Undergraduate and graduate colleges</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                      <span className="text-green-700 text-xs font-semibold">✓ Eligible for Free Access</span>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleInstitutionTypeSelect('university')}
                className="card text-left hover:border-blue-400 hover:shadow-lg transition-all p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <svg className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">University</h3>
                    <p className="text-gray-600 text-sm">Universities and higher education institutions</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                      <span className="text-green-700 text-xs font-semibold">✓ Eligible for Free Access</span>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleInstitutionTypeSelect('corporate')}
                className="card text-left hover:border-blue-400 hover:shadow-lg transition-all p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                    <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Corporate</h3>
                    <p className="text-gray-600 text-sm">Businesses and corporate organizations</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                      <span className="text-blue-700 text-xs font-semibold">Demo Required</span>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleInstitutionTypeSelect('ngo')}
                className="card text-left hover:border-blue-400 hover:shadow-lg transition-all p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <svg className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">NGO / Other</h3>
                    <p className="text-gray-600 text-sm">Non-profits, housing societies, hospitals, etc.</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                      <span className="text-blue-700 text-xs font-semibold">Demo Required</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-gray-900">Note:</strong> First 100 schools, colleges, and universities get free access for 1 year. Corporates and NGOs require a demo booking to activate.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Institution Details (or Demo Redirect) */}
        {step === 2 && (data.institutionType === 'corporate' || data.institutionType === 'ngo') && (
          <div className="animate-fadeIn text-center">
            <div className="mb-8">
              <svg className="w-24 h-24 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Let's Schedule a Demo</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Thank you for your interest in SafelyNotify.com! For corporate and NGO organizations, we provide personalized demos to ensure our platform meets your specific safety needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Book a Demo
              </Link>
              <button
                onClick={prevStep}
                className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-semibold text-lg hover:border-gray-400 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Institution Details + Features (for educational institutions) */}
        {step === 2 && isEducational && (
          <div className="animate-fadeIn">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Set Up Your Institution</h1>
            <p className="text-lg text-gray-600 mb-8">
              Tell us about your institution and configure the features you need.
            </p>

            {/* Institution Details */}
            <div className="card mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Institution Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    value={data.institutionName}
                    onChange={(e) => {
                      updateData('institutionName', e.target.value);
                      // Auto-generate URL slug as user types
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      updateData('urlSlug', slug);
                    }}
                    className="input"
                    placeholder="e.g., Lincoln High School"
                    required
                  />
                </div>

                {/* Location Fields */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={data.country}
                      onChange={(e) => {
                        updateData('country', e.target.value);
                        updateData('state', ''); // Reset state when country changes
                      }}
                      className="input"
                      required
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {data.country && countryRequiresState(data.country) && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {data.country === 'CA' ? 'Province'
                          : data.country === 'GB' ? 'Region'
                          : data.country === 'IN' ? 'State/UT'
                          : data.country === 'AE' ? 'Emirate'
                          : data.country === 'ID' ? 'Province'
                          : 'State'} *
                      </label>
                      <select
                        value={data.state}
                        onChange={(e) => updateData('state', e.target.value)}
                        className="input"
                        required
                      >
                        <option value="">Select {data.country === 'CA' ? 'Province'
                          : data.country === 'GB' ? 'Region'
                          : data.country === 'IN' ? 'State/UT'
                          : data.country === 'AE' ? 'Emirate'
                          : data.country === 'ID' ? 'Province'
                          : 'State'}</option>
                        {getStatesForCountry(data.country).map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={data.city}
                      onChange={(e) => updateData('city', e.target.value)}
                      className="input"
                      placeholder="e.g., Boston"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => updateData('email', e.target.value)}
                      className="input"
                      placeholder="admin@institution.edu"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={(e) => updateData('phone', e.target.value)}
                      className="input"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    value={data.contactName}
                    onChange={(e) => updateData('contactName', e.target.value)}
                    className="input"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <PasswordInput
                    value={data.password}
                    onChange={(value) => updateData('password', value)}
                    label="Create Password"
                    placeholder="Min 8 characters"
                    required
                    showStrength
                    autoComplete="new-password"
                  />

                  <PasswordInput
                    value={data.confirmPassword}
                    onChange={(value) => updateData('confirmPassword', value)}
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                {data.password && data.confirmPassword && (
                  <p className={`text-sm ${data.password === data.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {data.password === data.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            {/* Feature Configuration */}
            <div className="card mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Configure Features</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={data.features.alerts}
                    onChange={() => updateFeature('alerts')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Safety Alerts</h3>
                    <p className="text-sm text-gray-600">Send emergency notifications to staff, students, and parents</p>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={data.features.reports}
                    onChange={() => updateFeature('reports')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Incident Reporting</h3>
                    <p className="text-sm text-gray-600">Anonymous reporting kiosks for safety concerns</p>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={data.features.notifications}
                    onChange={() => updateFeature('notifications')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Notifications & Announcements</h3>
                    <p className="text-sm text-gray-600">Keep your community informed with regular updates</p>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={data.features.analytics}
                    onChange={() => updateFeature('analytics')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Analytics & Reporting</h3>
                    <p className="text-sm text-gray-600">Track incidents and monitor safety trends</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Staff Emails */}
            <div className="card mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Add Staff Members (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">Enter email addresses of staff members who should receive access. Separate multiple emails with commas.</p>
              <textarea
                value={data.staffEmails}
                onChange={(e) => updateData('staffEmails', e.target.value)}
                className="textarea"
                rows={3}
                placeholder="staff1@institution.edu, staff2@institution.edu"
              />
            </div>

            {/* Terms */}
            <div className="card">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.acceptedTerms}
                  onChange={(e) => updateData('acceptedTerms', e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  required
                />
                <div className="text-sm text-gray-700">
                  I accept the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>. I understand that SafelyNotify.com uses industry-standard encryption to protect our data.
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 font-semibold">{error}</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg mb-6">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                    <p className="text-red-700 whitespace-pre-line">{error}</p>

                    {/* Display password requirements if weak password */}
                    {errorDetails?.requirements && (
                      <div className="mt-4 p-3 bg-white rounded border border-red-300">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Password Requirements:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {errorDetails.requirements.map((req: string, idx: number) => (
                            <li key={idx}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Retry button for network errors */}
                    {error.includes('Cannot connect') && (
                      <button
                        onClick={handleRetry}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                      >
                        Retry Connection
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={prevStep}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                onClick={handleCompleteOnboarding}
                disabled={loading || !data.institutionName || !data.country || !data.city || !data.email || !data.phone || !data.contactName || !data.password || !data.confirmPassword || !data.acceptedTerms}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Creating your account...' : 'Complete Onboarding →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && isEducational && (
          <div className="animate-fadeIn text-center">
            <div className="mb-8">
              <svg className="w-24 h-24 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to SafelyNotify.com! 🎉</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your account is ready! You now have <strong className="text-green-600">free 1-year access</strong> to all features under the First 100 Program.
            </p>

            <div className="card text-left max-w-2xl mx-auto mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Your Institution Details:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {data.institutionName}</p>
                <p><strong>Type:</strong> {data.institutionType.charAt(0).toUpperCase() + data.institutionType.slice(1)}</p>
                <p><strong>Location:</strong> {data.location}</p>
                <p><strong>Email:</strong> {data.email}</p>
                <p><strong>Kiosk URL:</strong> <Link href={`/kiosk/${data.urlSlug}`} className="text-blue-600 hover:underline">/kiosk/{data.urlSlug}</Link></p>
              </div>
            </div>

            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Get Started:</h3>
              <ul className="text-sm text-gray-700 text-left space-y-2">
                <li>✓ Your account is active and ready to use</li>
                <li>✓ Upload your institution logo in settings</li>
                <li>✓ Try the interactive demo to see all features</li>
                <li>✓ Test the incident reporting kiosk</li>
                <li>✓ Configure staff access and permissions</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin/demo"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Try the Demo
              </Link>
              <Link
                href="/admin/settings"
                className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-semibold text-lg hover:border-gray-400 transition-all"
              >
                Go to Settings
              </Link>
            </div>

            <p className="mt-8 text-sm text-gray-500">
              Need help? <a href="#" className="text-blue-600 hover:underline">Contact our support team</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
