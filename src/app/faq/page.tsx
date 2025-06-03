import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ | EduScribe',
  description: 'Frequently Asked Questions about EduScribe - AI-powered educational content generator'
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions (FAQ)
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            <strong>Last Updated:</strong> June 3, 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                1. What is EduScribe?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                EduScribe is an AI-powered platform that helps you generate structured notes, summaries, and quizzes from videos, presentations, and text content.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                2. How much does it cost?
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">We offer three plans:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li><strong>Free:</strong> 2 note generations/month, 3 saved notes</li>
                <li><strong>Student:</strong> 10 notes/month, 12 saved notes, includes YouTube video support, PPT uploads, quizzes</li>
                <li><strong>Pro:</strong> Unlimited notes, 50 saved notes, access to all features with priority processing</li>
              </ul>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                3. Can I cancel my subscription?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Yes. You can cancel anytime from your account settings. Once cancelled, you'll be downgraded to the Free plan.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                4. What formats can I upload?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                You can upload text, PowerPoint presentations (.pptx), and videos (under 100MB). YouTube links are also supported.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                5. How does AI note generation work?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Our AI extracts key points and structures your content into digestible, thematic sections. You'll also get a TL;DR summary.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                6. Is my data secure?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Yes. We use modern encryption and secure cloud services. See our Privacy Policy for more details.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                7. Can I use EduScribe for commercial purposes?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Yes, as long as you comply with our{' '}
                <Link href="/terms-of-use" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Service
                </Link>
                .
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                8. Why was my note generation limited?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Each plan has limits. Upgrade your plan to increase your quota or wait for your limit to reset.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                9. Can I export notes to my computer?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Yes! You can export notes to your local Notepad application on supported devices.
              </p>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                10. I still have questions. Where can I get help?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Contact us anytime at{' '}
                <a 
                  href="mailto:support@eduscribe.ai" 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  support@eduscribe.ai
                </a>
                {' '}— we're happy to assist you!
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Last updated: June 3, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 