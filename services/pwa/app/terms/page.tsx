import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata = {
  title: 'Terms of Service - SafelyNotify',
  description: 'SafelyNotify Terms of Service - Legal terms for our anonymous incident reporting platform for schools',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://safelynotify.com/terms',
  },
};

export default function TermsPage() {
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

      {/* Terms of Service Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: November 21, 2024</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using SafelyNotify's anonymous incident reporting platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). These Terms apply to all users of the Service, including educational institutions, administrators, staff, and students.
              </p>
              <p className="text-gray-700">
                If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                SafelyNotify provides an AI-powered anonymous incident reporting platform specifically designed for educational institutions. Our Service includes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Anonymous incident reporting capabilities for students</li>
                <li>AI-powered intelligent routing and categorization</li>
                <li>Real-time safety alerts and notifications</li>
                <li>Administrative dashboards and analytics</li>
                <li>FERPA-compliant data handling and storage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Institutional Accounts</h3>
              <p className="text-gray-700 mb-4">
                Educational institutions must register for administrative accounts to use our Service. Account registration requires:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Valid institutional email address and contact information</li>
                <li>Verification of educational institution status</li>
                <li>Acceptance of our Data Processing Agreement</li>
                <li>Designation of authorized administrative users</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Anonymous Reporting</h3>
              <p className="text-gray-700 mb-4">
                Students and community members can submit incident reports anonymously without creating accounts or providing personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Permitted Uses</h3>
              <p className="text-gray-700 mb-4">You may use our Service only for:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Legitimate safety and security reporting within educational settings</li>
                <li>Administrative management of incident reports</li>
                <li>Generating analytics and insights for campus safety improvement</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Prohibited Uses</h3>
              <p className="text-gray-700 mb-4">You may not use our Service to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Submit false, misleading, or malicious reports</li>
                <li>Harass, defame, or intimidate individuals</li>
                <li>Violate any local, state, or federal laws</li>
                <li>Attempt to identify anonymous reporters</li>
                <li>Reverse engineer or attempt to access our AI algorithms</li>
                <li>Use the platform for commercial solicitation</li>
                <li>Circumvent security measures or attempt unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our data handling practices are governed by our Privacy Policy, which is incorporated into these Terms by reference. Key principles include:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>FERPA compliance for all educational records</li>
                <li>Anonymous reporting with no collection of personal identifiers</li>
                <li>Institutional control over data access and retention</li>
                <li>Industry-standard encryption and security measures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                SafelyNotify retains all rights, title, and interest in our Service, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Software, algorithms, and AI models</li>
                <li>User interface designs and functionality</li>
                <li>Trademarks, logos, and branding materials</li>
                <li>Documentation and training materials</li>
              </ul>
              <p className="text-gray-700">
                Institutions retain ownership of their incident reports and institutional data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Uptime Commitment</h3>
              <p className="text-gray-700 mb-4">
                We strive to maintain 99.9% uptime for our Service, excluding scheduled maintenance windows.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Emergency Procedures</h3>
              <p className="text-gray-700 mb-4">
                In case of critical incidents requiring immediate attention, institutions should contact emergency services (911) directly rather than relying solely on our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the fullest extent permitted by law, SafelyNotify shall not be liable for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Actions taken or not taken based on reports submitted through our Service</li>
                <li>Third-party content or actions of Service users</li>
              </ul>
              <p className="text-gray-700">
                Our total liability shall not exceed the amount paid by the institution for the Service in the preceding 12 months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                Institutions agree to indemnify and hold SafelyNotify harmless from claims arising from:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Misuse of the Service by institutional users</li>
                <li>Violation of these Terms or applicable laws</li>
                <li>Institutional decisions based on incident reports</li>
                <li>Unauthorized disclosure of information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                Either party may terminate the Service agreement with 30 days written notice. SafelyNotify may immediately terminate access for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Material breach of these Terms</li>
                <li>Misuse of the Service</li>
                <li>Non-payment of fees (if applicable)</li>
                <li>Legal or regulatory requirements</li>
              </ul>
              <p className="text-gray-700">
                Upon termination, institutions may request data export within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may modify these Terms at any time. Material changes will be communicated to institutional administrators at least 30 days in advance via email. Continued use of the Service after changes take effect constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of the State of Delaware. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms of Service, please contact:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> legal@safelynotify.com</p>
                <p className="text-gray-700 mb-2"><strong>Address:</strong> SafelyNotify Legal Department</p>
                <p className="text-gray-700 mb-2">123 Education Safety Blvd</p>
                <p className="text-gray-700">Safety City, SC 12345</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Severability</h2>
              <p className="text-gray-700">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
              </p>
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