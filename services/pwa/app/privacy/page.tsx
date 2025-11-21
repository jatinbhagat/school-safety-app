import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata = {
  title: 'Privacy Policy - SafelyNotify',
  description: 'SafelyNotify Privacy Policy - FERPA compliant anonymous incident reporting platform for schools',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://safelynotify.com/privacy',
  },
};

export default function PrivacyPage() {
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

      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: November 21, 2024</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                SafelyNotify ("we," "our," or "us") is committed to protecting the privacy of students, staff, and educational institutions. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our anonymous incident 
                reporting platform designed specifically for educational institutions.
              </p>
              <p className="text-gray-700">
                We are fully committed to compliance with the Family Educational Rights and Privacy Act (FERPA), General Data Protection 
                Regulation (GDPR), and other applicable privacy regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Anonymous Reports</h3>
              <p className="text-gray-700 mb-4">
                Our platform is designed with anonymity as a core principle. When students submit incident reports:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>No personally identifiable information (PII) is collected by default</li>
                <li>No login credentials, IP addresses, or tracking cookies are used for report submission</li>
                <li>Students may voluntarily provide contact information if they wish to receive follow-up</li>
                <li>Report content includes incident details, location, time, and any uploaded media</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Administrative Information</h3>
              <p className="text-gray-700 mb-4">
                For institutional administrators, we collect:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Account credentials (email, encrypted password)</li>
                <li>Institution information (name, address, contact details)</li>
                <li>Staff member details for incident routing purposes</li>
                <li>Usage analytics and system logs for security and improvement</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Technical Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Device and browser information for compatibility</li>
                <li>General location data for incident routing (not linked to individuals)</li>
                <li>System performance and error logs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Information</h2>
              <p className="text-gray-700 mb-4">We use collected information solely for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Processing and routing incident reports to appropriate staff members</li>
                <li>Providing AI-powered categorization and priority assessment</li>
                <li>Generating anonymized analytics and safety insights for institutions</li>
                <li>Ensuring platform security and preventing misuse</li>
                <li>Improving our services and user experience</li>
                <li>Complying with legal obligations and safety requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. FERPA Compliance</h2>
              <p className="text-gray-700 mb-4">
                SafelyNotify is designed to be FERPA-compliant and serves as a school official with legitimate educational interests:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>We process information only as directed by educational institutions</li>
                <li>All staff undergo FERPA training and sign confidentiality agreements</li>
                <li>We do not redisclose student information without proper authorization</li>
                <li>Institutions maintain direct control over their data and can request deletion</li>
                <li>Our platform includes audit logs for compliance monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">We implement industry-standard security measures:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>End-to-end encryption for all data transmission</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Multi-factor authentication for administrative accounts</li>
                <li>Regular security audits and penetration testing</li>
                <li>SOC 2 Type II compliance</li>
                <li>Secure cloud infrastructure with Microsoft Azure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">We do not sell, trade, or rent personal information. We may disclose information only in these limited circumstances:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>To authorized school officials within the contracting institution</li>
                <li>When required by law or valid legal process</li>
                <li>To prevent imminent physical harm or ensure student safety</li>
                <li>To trusted service providers under strict confidentiality agreements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Incident reports are retained for the duration specified by the educational institution</li>
                <li>Administrative data is kept for the length of the service agreement</li>
                <li>System logs are retained for security purposes for up to 2 years</li>
                <li>Institutions can request data deletion upon termination of services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
              <p className="text-gray-700 mb-4">Educational institutions and individuals have the right to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Access and review data collected about their institution</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of data (subject to legal and safety requirements)</li>
                <li>Receive data in a portable format</li>
                <li>File complaints with relevant supervisory authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Updates to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
                We will notify institutional administrators of material changes via email and post updates on our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@safelynotify.com</p>
                <p className="text-gray-700 mb-2"><strong>Address:</strong> SafelyNotify Privacy Officer</p>
                <p className="text-gray-700 mb-2">123 Education Safety Blvd</p>
                <p className="text-gray-700">Safety City, SC 12345</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              href="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}