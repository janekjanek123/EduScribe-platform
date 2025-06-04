import Link from 'next/link';

export default function TermsOfServicePage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By creating an account and using EduScribe, you agree to be bound by these Terms of Service 
              and our Privacy Policy. If you do not agree to these terms, please do not use our service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              EduScribe is an AI-powered educational platform that generates study notes, summaries, 
              and quizzes from various content sources including:
            </p>
            <ul>
              <li>Text input and documents</li>
              <li>YouTube videos</li>
              <li>Uploaded files (PDF, PowerPoint, etc.)</li>
              <li>Video files</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>To use EduScribe, you must:</p>
            <ul>
              <li>Be at least 13 years old (parental consent required for minors)</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>You agree to use EduScribe only for lawful, educational purposes. You may not:</p>
            <ul>
              <li>Upload copyrighted content without permission</li>
              <li>Generate content for commercial purposes without appropriate licensing</li>
              <li>Attempt to reverse engineer or exploit our AI systems</li>
              <li>Share your account credentials with others</li>
              <li>Use the service to generate harmful, offensive, or inappropriate content</li>
            </ul>

            <h2>5. Content Ownership and Rights</h2>
            <p><strong>Your Content:</strong></p>
            <ul>
              <li>You retain ownership of content you upload to EduScribe</li>
              <li>You grant us license to process your content to provide our services</li>
              <li>You are responsible for ensuring you have rights to any content you upload</li>
            </ul>
            
            <p><strong>Generated Content:</strong></p>
            <ul>
              <li>AI-generated notes and quizzes are provided for your educational use</li>
              <li>Generated content may not be completely accurate and should be verified</li>
              <li>You may use generated content for personal educational purposes</li>
            </ul>

            <h2>6. Subscription Plans</h2>
            <p>EduScribe offers different subscription tiers:</p>
            <ul>
              <li><strong>Free:</strong> Limited note generation with basic features</li>
              <li><strong>Student:</strong> Enhanced features for individual learners</li>
              <li><strong>Pro:</strong> Full access to all features and higher limits</li>
            </ul>
            
            <p>Subscription terms:</p>
            <ul>
              <li>Billing occurs monthly or annually as selected</li>
              <li>You may cancel your subscription at any time</li>
              <li>Refunds are handled according to our refund policy</li>
              <li>Usage limits reset at each billing cycle</li>
            </ul>

            <h2>7. AI and Content Generation</h2>
            <p>Important notes about our AI services:</p>
            <ul>
              <li>AI-generated content is provided "as is" and may contain errors</li>
              <li>Generated notes are for educational assistance only</li>
              <li>Always verify important information from authoritative sources</li>
              <li>We do not guarantee the accuracy of AI-generated content</li>
            </ul>

            <h2>8. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand 
              how we collect, use, and protect your information.
            </p>

            <h2>9. Service Availability</h2>
            <p>
              We strive to provide reliable service but cannot guarantee 100% uptime. We may 
              temporarily suspend service for maintenance, updates, or other operational needs.
            </p>

            <h2>10. Intellectual Property</h2>
            <p>
              EduScribe's software, algorithms, and proprietary technology are protected by 
              intellectual property laws. You may not copy, modify, or distribute our technology.
            </p>

            <h2>11. Limitation of Liability</h2>
            <p>
              EduScribe is provided for educational assistance only. We are not liable for:
            </p>
            <ul>
              <li>Errors in AI-generated content</li>
              <li>Academic or professional decisions based on our content</li>
              <li>Loss of data due to technical issues</li>
              <li>Indirect or consequential damages</li>
            </ul>

            <h2>12. Termination</h2>
            <p>
              We may terminate or suspend your account for violation of these terms. Upon 
              termination, you may lose access to your generated content.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Continued use of the 
              service after changes constitutes acceptance of the new terms.
            </p>

            <h2>14. Educational Use Disclaimer</h2>
            <p>
              EduScribe is designed to assist with learning and note-taking. Generated content 
              should supplement, not replace, your own study and understanding of course materials.
            </p>

            <h2>15. Contact Information</h2>
            <p>
              For questions about these Terms of Service:
            </p>
            <ul>
              <li>Email: legal@eduscribe.com</li>
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
                href="/privacy"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 