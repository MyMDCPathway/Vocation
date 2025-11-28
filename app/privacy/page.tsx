import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Vocation',
  description: 'Privacy Policy for Vocation - Career Planning for Miami Dade College',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p>
              Vocation collects information that you provide directly when using our service, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Career pathway queries and inputs</li>
              <li>Usage data and interactions with the application</li>
              <li>Technical information such as IP address and browser type</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Generate personalized career pathways using AI technology</li>
              <li>Improve our services and user experience</li>
              <li>Respond to your inquiries and provide support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. AI-Generated Content</h2>
            <p>
              Vocation uses Google Gemini AI to generate career pathway suggestions. Your queries may be processed by 
              third-party AI services. We do not store your personal information in association with AI-generated content 
              beyond what is necessary to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information. However, 
              no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Third-Party Services</h2>
            <p>
              Our service uses Google Gemini AI. Please review Google's privacy policy to understand how they handle data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p>
              You have the right to request access to, correction of, or deletion of your personal information. 
              Contact us at <a href="mailto:advisement@mdc.edu" className="text-blue-600 hover:underline">advisement@mdc.edu</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:advisement@mdc.edu" className="text-blue-600 hover:underline">advisement@mdc.edu</a>.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Vocation
          </a>
        </div>
      </div>
    </div>
  )
}

