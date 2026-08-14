import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Vocation',
  description: 'Privacy Policy for Vocation - Education & Career Pathway Planning',
}

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-on-surface mb-8">Privacy Policy</h1>

        <div className="prose prose-slate max-w-none space-y-6 text-on-surface-variant">
          <p className="text-sm text-outline">Last updated: August 10, 2026</p>

          <section>
            <p className="bg-surface-container border border-outline-variant rounded-lg p-4 text-sm">
              Vocation is an independent project, not affiliated with, endorsed by, or sponsored
              by Miami Dade College or any other educational institution. References to
              &quot;we,&quot; &quot;us,&quot; or &quot;Vocation&quot; below mean its individual
              operator; Vocation is not currently operated through a registered company.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">1. Information You Provide Directly</h2>
            <p>If you create an account, we store:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your email address and a hashed (not plaintext) version of your password</li>
              <li>An optional display name</li>
              <li>The career, education level, and cost-vs-quality priority you set in the intake questionnaire, if you completed any of it before signing up</li>
              <li>Your general location (country, and state/postal code if you provide one), used to show school and wage data near you</li>
              <li>Interest and goal tags, and an account type, if you set them during onboarding</li>
              <li>Pathways you choose to save, along with any notes or edits you make to them</li>
            </ul>
            <p className="mt-4">
              <strong>Household income and household size are never sent to or stored on our
              servers.</strong> If you answer those questions during the intake questionnaire,
              the answers are used only in your browser, on your device, to estimate financial
              aid, and are discarded when you close the tab.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">2. Information Collected Automatically</h2>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your IP address, used briefly to prevent abuse (for example, limiting how many pathways or password-reset emails can be requested in a short window). It is not stored in our primary database; the counters used for this expire automatically within about 48 hours.</li>
              <li>Error reports, if the application crashes or throws an unexpected error, via Sentry. We do not enable session replay and do not send default personal information (IP, cookies) to Sentry.</li>
              <li>Aggregate, cookieless usage analytics via Vercel Analytics — this does not identify you individually.</li>
              <li>A functional cookie (<code>vocation_school</code>) that remembers which school&apos;s colors and branding to show you. It carries no tracking purpose and is not used for advertising.</li>
              <li>If you sign in, a session cookie that keeps you logged in.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Generate and save personalized career pathways</li>
              <li>Show cost, wage, and program data relevant to your location and goals</li>
              <li>Secure your account and prevent abuse of the service</li>
              <li>Diagnose and fix errors</li>
              <li>Respond to support and privacy requests</li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information, and we do not use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">4. AI-Generated Content</h2>
            <p>
              Vocation uses Google&apos;s Gemini AI to generate career pathways. When you request
              a pathway, the career, school, and program details involved in that request are
              sent to Google for processing. Your account identity (name, email) is not included
              in that request. Please review{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google&apos;s Privacy Policy
              </a>{' '}
              to understand how they handle data they process.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">5. Who We Share Information With</h2>
            <p>We use the following third-party services to operate Vocation. Each processes only what its role requires:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Vercel</strong> — hosting and cookieless analytics</li>
              <li><strong>Neon</strong> — our database, where account and saved-pathway data lives</li>
              <li><strong>Upstash</strong> — short-lived caching and abuse-prevention counters</li>
              <li><strong>Resend</strong> — sends transactional email (e.g. password resets); we do not send marketing email</li>
              <li><strong>Sentry</strong> — error monitoring, configured with no session replay and no default personal data collection</li>
              <li><strong>Google (Gemini)</strong> — generates career pathway content, as described above</li>
              <li><strong>Google Forms</strong> — hosts our optional feedback survey. The survey is anonymous and does not ask for your name or email; we only receive what you choose to type into it.</li>
            </ul>
            <p className="mt-4">
              We do not otherwise share your personal information with third parties, except
              where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">6. Data Retention</h2>
            <p>
              We keep account and saved-pathway data for as long as your account exists.
              Abuse-prevention counters expire automatically within about 48 hours. If you delete
              your account, your account record and everything linked to it (saved pathways,
              sessions, password-reset requests) is deleted immediately and permanently — see
              Section 8.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">7. Children&apos;s Privacy</h2>
            <p>
              Vocation is intended for high-school and college-age students and does not
              currently verify a user&apos;s age at sign-up. We do not knowingly collect personal
              information from a child under 13 without a parent or guardian&apos;s consent. If
              you are a parent or guardian and believe your child under 13 has created an account
              or provided us information without your consent, contact us at{' '}
              <a href="mailto:privacy@vocation.bz" className="text-primary hover:underline">privacy@vocation.bz</a>{' '}
              and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">8. Your Rights</h2>
            <p>
              You can access, correct, or delete your personal information directly from your
              account:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Download a copy of your data from Account Settings, or by visiting <code>/api/account/export</code> while signed in</li>
              <li>Permanently delete your account and all associated data from Account Settings</li>
            </ul>
            <p className="mt-4">
              For any request we can&apos;t handle through those tools — including if you don&apos;t
              have an account — contact{' '}
              <a href="mailto:privacy@vocation.bz" className="text-primary hover:underline">privacy@vocation.bz</a>.
              We aim to respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">9. Data Security</h2>
            <p>
              We use industry-standard measures to protect your information, including encrypted
              connections, hashed passwords, and access controls on our database. However, no
              method of transmission or storage is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make a material change,
              we will update the &quot;Last updated&quot; date above and, where appropriate,
              provide additional notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-on-surface mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how your information is
              handled, contact us at{' '}
              <a href="mailto:privacy@vocation.bz" className="text-primary hover:underline">privacy@vocation.bz</a>.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <a
            href="/"
            className="text-primary hover:text-primary-container font-medium"
          >
            ← Back to Vocation
          </a>
        </div>
      </div>
    </main>
  )
}
