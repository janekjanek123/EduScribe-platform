import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | EduScribe',
  description: 'Privacy Policy for EduScribe - How we collect, use, and protect your information'
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Privacy Policy
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            <strong>Effective Date:</strong> June 3, 2025
          </p>

          <p className="text-gray-700 dark:text-gray-300 mb-8">
            Welcome to EduScribe! This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                1. Information We Collect
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li><strong>Account Information:</strong> When you register, we collect your email address and password.</li>
                <li><strong>Usage Data:</strong> We collect data about how you use our platform, including generated content and usage patterns.</li>
                <li><strong>Payment Data:</strong> Payments are handled by Stripe. We do not store credit card details.</li>
              </ul>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                2. How We Use Your Data
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>To provide and improve our services</li>
                <li>To process payments and subscriptions</li>
                <li>To personalize your experience and deliver content</li>
                <li>For analytics and system improvements</li>
              </ul>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                3. Data Sharing
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>We do not sell your data.</li>
                <li>We may share data with trusted third parties (e.g., hosting providers, analytics tools) only for operating our platform.</li>
              </ul>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                4. Cookies and Tracking
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use cookies and similar technologies for authentication, analytics, and performance. You can manage cookie preferences in your browser.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                5. Your Rights
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>You may access, update, or delete your personal data at any time.</li>
                <li>You can cancel your account via the platform.</li>
              </ul>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                6. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use industry-standard measures to protect your data. However, no method of transmission over the internet is completely secure.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                7. Changes to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this Privacy Policy. Significant changes will be communicated via email or platform notification.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                8. Contact
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                For questions or concerns, contact us at:{' '}
                <a 
                  href="mailto:support@eduscribe.ai" 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  support@eduscribe.ai
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
              Thank you for trusting EduScribe!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              Last updated: June 3, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 