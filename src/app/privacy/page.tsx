import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <Link 
              href="/auth/register" 
              className="inline-block mb-4 text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to registration
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose max-w-none">
            <h2>Information We Collect</h2>
            <p>
              When you use EduScribe, we collect information to provide and improve our services:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Email address, user type, and learning preferences</li>
              <li><strong>Content:</strong> Text, files, and videos you upload for note generation</li>
              <li><strong>Generated Content:</strong> Notes, quizzes, and summaries created by our AI</li>
              <li><strong>Usage Data:</strong> How you interact with our features and services</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide AI-powered note generation services</li>
              <li>Personalize your learning experience based on your preferences</li>
              <li>Generate quizzes and educational content</li>
              <li>Improve our AI models and service quality</li>
              <li>Send important account and service updates</li>
            </ul>

            <h2>Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share information with:
            </p>
            <ul>
              <li><strong>Service Providers:</strong> Third-party services that help us operate (OpenAI for AI processing, Supabase for data storage)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your information:
            </p>
            <ul>
              <li>Encrypted data transmission and storage</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure data processing with trusted AI providers</li>
            </ul>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Export your notes and generated content</li>
            </ul>

            <h2>AI and Content Processing</h2>
            <p>
              EduScribe uses artificial intelligence to generate educational content. By using our service:
            </p>
            <ul>
              <li>Your uploaded content may be processed by AI services (OpenAI) to generate notes</li>
              <li>Generated content is stored securely in your account</li>
              <li>We do not use your content to train external AI models</li>
              <li>You retain ownership of your original content and generated notes</li>
            </ul>

            <h2>Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies for:
            </p>
            <ul>
              <li>Authentication and session management</li>
              <li>Remembering your preferences</li>
              <li>Analyzing usage patterns to improve our service</li>
            </ul>

            <h2>Children's Privacy</h2>
            <p>
              EduScribe is designed for educational use. For users under 18, we recommend parental 
              guidance and consent before creating an account.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any 
              significant changes via email or through our service.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this privacy policy or our data practices, please contact us:
            </p>
            <ul>
              <li>Email: privacy@eduscribe.com</li>
              <li>Support: Through our help center</li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Registration
              </Link>
              <Link
                href="/terms"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Terms of Service →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 