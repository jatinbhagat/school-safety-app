'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DemoPage() {
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: 'corporate',
    industry: '',
    size: '',
    contactName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send data to a backend
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-blue-600">SafelyNotify.com</Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="mb-8">
            <svg className="w-24 h-24 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Demo Request Received!</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Thank you for your interest in SafelyNotify.com. Our team will review your request and reach out within 24 hours to schedule your personalized demo.
          </p>

          <div className="card text-left max-w-2xl mx-auto mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Email Confirmation</h4>
                  <p className="text-sm text-gray-600">You'll receive a confirmation email at {formData.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Team Review</h4>
                  <p className="text-sm text-gray-600">Our safety experts will review your organization's needs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Personalized Demo</h4>
                  <p className="text-sm text-gray-600">We'll schedule a live demo tailored to your use case</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Custom Proposal</h4>
                  <p className="text-sm text-gray-600">Receive a pricing and implementation plan specific to your organization</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/features"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Explore Features
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-semibold text-lg hover:border-gray-400 transition-all"
            >
              Back to Home
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Questions? Email us at <a href="mailto:demos@safelynotify.com" className="text-blue-600 hover:underline">demos@safelynotify.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">SafelyNotify.com</Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Book Your Personalized Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover how SafelyNotify.com can enhance safety and communication for your organization. Schedule a live demo with our team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">30-Minute Demo</h3>
            <p className="text-sm text-gray-600">Comprehensive platform walkthrough</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Tailored Solutions</h3>
            <p className="text-sm text-gray-600">Customized to your needs</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Expert Guidance</h3>
            <p className="text-sm text-gray-600">Q&A with safety specialists</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => updateField('organizationName', e.target.value)}
                  className="input"
                  placeholder="Acme Corporation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organization Type *
                </label>
                <select
                  value={formData.organizationType}
                  onChange={(e) => updateField('organizationType', e.target.value)}
                  className="input"
                  required
                >
                  <option value="corporate">Corporate / Business</option>
                  <option value="ngo">NGO / Non-Profit</option>
                  <option value="hospital">Hospital / Healthcare</option>
                  <option value="housing">Housing Society</option>
                  <option value="government">Government Agency</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="input"
                  placeholder="e.g., Technology, Healthcare, Manufacturing"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organization Size
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => updateField('size', e.target.value)}
                  className="input"
                >
                  <option value="">Select size</option>
                  <option value="1-50">1-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1001+">1001+ employees</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => updateField('contactName', e.target.value)}
                  className="input"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Title / Role
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="input"
                  placeholder="Safety Manager, HR Director, etc."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="input"
                  placeholder="john@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="input"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Demo Date
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => updateField('preferredDate', e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Time
                </label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => updateField('preferredTime', e.target.value)}
                  className="input"
                >
                  <option value="">Select time slot</option>
                  <option value="9am-11am">9:00 AM - 11:00 AM</option>
                  <option value="11am-1pm">11:00 AM - 1:00 PM</option>
                  <option value="1pm-3pm">1:00 PM - 3:00 PM</option>
                  <option value="3pm-5pm">3:00 PM - 5:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                className="textarea"
                rows={4}
                placeholder="Tell us about your safety needs, current challenges, or specific features you're interested in..."
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-gray-900">Privacy Commitment:</strong> Your data is protected with industry-standard encryption. We'll only use this information to schedule your demo and provide relevant product information.
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Request Demo
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Have questions before booking? <a href="mailto:sales@safelynotify.com" className="text-blue-600 hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
}
