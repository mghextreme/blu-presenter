import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation("privacy-policy");

  return (
    <>
      <title>{t('title') + ' - BluPresenter'}</title>
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-200 dark:bg-gray-900">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
          {t('hero.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg text-center">
          {t('hero.description')}
        </p>
      </div>
      <div className="flex flex-col items-center py-16 text-left gap-y-12">
        <div className="w-full max-w-4xl px-2 sm:px-4 prose prose-gray dark:prose-invert">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <strong>Last Updated:</strong> {new Date('2025-10-08T22:00:00-03:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to BluPresenter. This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.
            </p>
            <p>
              BluPresenter is an open-source project available on <a href="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>.
              We are committed to transparency and protecting your privacy. This service is provided as-is, without a formal company structure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            <p>When you create an account and use BluPresenter, we collect the following personal information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and nickname</li>
              <li><strong>Authentication Data:</strong> Login credentials and session information managed by our authentication provider</li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> use analytics tools or tracking services. We only collect the minimum data necessary to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information solely to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain the BluPresenter service</li>
              <li>Authenticate your account and manage your sessions</li>
              <li>Enable collaboration features within organizations</li>
              <li>Communicate with you about your account or the service</li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> sell, rent, or share your personal information with third parties - not for marketing, or any other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
            <p>BluPresenter relies on the following third-party services:</p>

            <div className="ml-4 mt-4">
              <h3 className="text-lg font-medium mb-2">Supabase</h3>
              <p>
                We use <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Supabase</a> for authentication and database services.
                Your account data and application data are stored on Supabase servers located in the <strong>US East (Ohio) region (us-east-2)</strong>.
              </p>
              <p className="mt-2">
                Supabase's privacy practices are governed by their <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Privacy Policy</a>.
              </p>
            </div>

            <div className="ml-4 mt-4">
              <h3 className="text-lg font-medium mb-2">Google Authentication</h3>
              <p>
                If you choose to sign in with Google, we use Google's OAuth service for authentication.
                Google may collect information according to their <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Cookies and Local Storage</h2>
            <p>BluPresenter uses minimal cookies and browser storage:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Authentication Cookies:</strong> Used to maintain your login session</li>
              <li><strong>Local and Session Storage:</strong> Used to store your preferences and session tokens</li>
            </ul>
            <p className="mt-4">
              These are essential for the service to function properly. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Data Security</h2>
            <p>
              We take reasonable measures to protect your information from unauthorized access, alteration, or destruction.
              However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
            <p className="mt-4">
              Your data is stored securely by <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Supabase</a>, which implements industry-standard security practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Data Retention and Deletion</h2>
            <p>
              Currently, we do not have an automated data retention or deletion policy. Your data remains in our system as long as your account is active.
            </p>
            <p className="mt-4">
              If you wish to delete your account or have your data removed, please submit a request through our <a href="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub Issues page</a>.
              We will process your request as soon as reasonably possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Your Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal data, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to request deletion of your data</li>
              <li>The right to export your data</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please submit a request through our <a href="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub Issues page</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. International Users</h2>
            <p>
              BluPresenter is operated from Brazil and uses services hosted in the United States (Supabase - us-east-2 region).
              By using our service, you acknowledge that your information may be transferred to and processed in the United States.
            </p>
            <p className="mt-4">
              We welcome users from around the world, but please be aware that data protection laws may vary by country.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Children's Privacy</h2>
            <p>
              BluPresenter does not have a minimum age requirement. However, if you are under the age of 13 (or the minimum age in your jurisdiction),
              please obtain parental consent before using our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">11. Open Source Nature</h2>
            <p>
              BluPresenter is an open-source project. The source code is publicly available on <a href="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>,
              and you can review exactly how your data is handled in the code.
            </p>
            <p className="mt-4">
              If you choose to self-host BluPresenter, you are responsible for your own data handling and privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date at the top of this page.
              We encourage you to review this Privacy Policy periodically.
            </p>
            <p className="mt-4">
              Significant changes will be announced through the service or on our GitHub repository.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us through:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>GitHub Issues:</strong> <a href="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://github.com/mghextreme/blu-presenter/issues</a>
              </li>
              <li>
                <strong>GitHub Repository:</strong> <a href="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://github.com/mghextreme/blu-presenter</a>
              </li>
            </ul>
          </section>

          <section className="mt-12 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> BluPresenter is provided as an open-source project without warranties.
              While we strive to protect your privacy and data, this service is offered "as-is" without formal legal guarantees.
              By using BluPresenter, you acknowledge and accept these terms.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
