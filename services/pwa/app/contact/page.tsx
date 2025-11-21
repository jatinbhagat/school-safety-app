import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata = {
  title: 'Contact Us - SafelyNotify',
  description: 'Contact SafelyNotify for support, demos, or questions about our anonymous incident reporting platform for schools',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://safelynotify.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Logo size="lg" priority />
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Admin Login
              </Link>
              <Link 
                href="/onboarding" 
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Contact Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to make your campus safer? We're here to help with demos, implementation, or any questions about SafelyNotify.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send us a message</h2>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="input"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="input"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="input"
                  placeholder="john.smith@university.edu"
                />
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Name *
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  required
                  className="input"
                  placeholder="Springfield University"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Role *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="input"
                >
                  <option value="">Select your role</option>
                  <option value="administrator">School Administrator</option>
                  <option value="safety-director">Safety/Security Director</option>
                  <option value="dean">Dean of Students</option>
                  <option value="counselor">Counselor</option>
                  <option value="it-director">IT Director</option>
                  <option value="superintendent">Superintendent</option>
                  <option value="principal">Principal</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="studentCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Approximate Student Count
                </label>
                <select
                  id="studentCount"
                  name="studentCount"
                  className="input"
                >
                  <option value="">Select student count</option>
                  <option value="under-500">Under 500</option>
                  <option value="500-1000">500 - 1,000</option>
                  <option value="1000-2500">1,000 - 2,500</option>
                  <option value="2500-5000">2,500 - 5,000</option>
                  <option value="5000-10000">5,000 - 10,000</option>
                  <option value="over-10000">Over 10,000</option>
                </select>
              </div>

              <div>
                <label htmlFor="inquiry" className="block text-sm font-medium text-gray-700 mb-2">
                  Inquiry Type *
                </label>
                <select
                  id="inquiry"
                  name="inquiry"
                  required
                  className="input"
                >
                  <option value="">Select inquiry type</option>
                  <option value="demo">Request a Demo</option>
                  <option value="pricing">Pricing Information</option>
                  <option value="implementation">Implementation Support</option>
                  <option value="technical">Technical Questions</option>
                  <option value="compliance">FERPA/Compliance Questions</option>
                  <option value="partnership">Partnership Opportunities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className="textarea"
                  placeholder="Tell us about your safety reporting needs, timeline, or any specific questions..."
                ></textarea>
              </div>

              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link> and <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link> *
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary text-lg py-3"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information & Quick Options */}
          <div className="space-y-8">
            {/* Direct Contact */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                    <p className="text-gray-600 mb-2">For general inquiries and support</p>
                    <a href="mailto:support@safelynotify.com" className="text-blue-600 hover:text-blue-800">
                      support@safelynotify.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Sales & Demos</h3>
                    <p className="text-gray-600 mb-2">Speak with our education specialists</p>
                    <a href="tel:+1-555-SAFELY" className="text-green-600 hover:text-green-800">
                      +1 (555) SAFELY
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                    <p className="text-gray-600 mb-2">Available Monday-Friday, 8 AM - 6 PM ET</p>
                    <button className="text-purple-600 hover:text-purple-800">
                      Start Live Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                <Link 
                  href="/demo" 
                  className="block w-full bg-white text-gray-900 rounded-lg px-6 py-3 font-semibold text-center hover:bg-gray-50 transition-colors"
                >
                  📹 Schedule a Demo
                </Link>
                
                <Link 
                  href="/onboarding" 
                  className="block w-full bg-blue-500 text-white rounded-lg px-6 py-3 font-semibold text-center hover:bg-blue-400 transition-colors border-2 border-blue-400"
                >
                  🚀 Start Free Trial
                </Link>
                
                <a 
                  href="mailto:implementation@safelynotify.com" 
                  className="block w-full bg-purple-500 text-white rounded-lg px-6 py-3 font-semibold text-center hover:bg-purple-400 transition-colors border-2 border-purple-400"
                >
                  📋 Implementation Support
                </a>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Times</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>General Inquiries</span>
                  <span className="text-green-600 font-medium">24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Demo Requests</span>
                  <span className="text-blue-600 font-medium">Same day</span>
                </div>
                <div className="flex justify-between">
                  <span>Implementation Support</span>
                  <span className="text-purple-600 font-medium">4 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}