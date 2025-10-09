import { useTranslation } from "react-i18next";

export default function TermsAndConditions() {
  const { t } = useTranslation("terms-and-conditions");

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
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              Welcome to BluPresenter. By accessing or using our service, you agree to be bound by these Terms and Conditions.
              If you do not agree with any part of these terms, you may not use our service.
            </p>
            <p className="mt-4">
              BluPresenter is an open-source project provided free of charge. These terms govern your use of the hosted service
              available at <a href="https://www.blupresenter.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">blupresenter.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p>
              BluPresenter is a web-based lyrics and chords archive and presentation tool that allows you to create, manage, and display lyrics and chords online.
              The service includes features such as:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Creating and editing songs</li>
              <li>Organizing content within organizations</li>
              <li>Displaying presentations through a controller interface</li>
              <li>Collaborating with other users</li>
            </ul>
            <p className="mt-4">
              The service is provided "as-is" without any guarantees of availability, uptime, or performance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts</h2>
            <p>To use BluPresenter, you must create an account. When creating an account, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate personal information</li>
              <li>Not impersonate any person or entity without explicit permission</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="mt-4">
              You may create an account using email and password, or through third-party authentication providers such as Google.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. User Content and Ownership</h2>
            <p>
              You retain <strong>full ownership</strong> of all content you create, upload, or share through BluPresenter,
              including presentations, lyrics, chords, and other materials ("User Content").
            </p>
            <p className="mt-4">
              By using our service, you grant BluPresenter a limited, non-exclusive license to store, display, and transmit
              your User Content solely for the purpose of providing the service to you.
            </p>
            <p className="mt-4">
              You are solely responsible for your User Content and the consequences of posting or publishing it.
              You represent and warrant that you own or have the necessary rights to use and authorize the use of your User Content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Prohibited Uses</h2>
            <p>You agree not to use BluPresenter for any of the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any illegal or unauthorized purpose</li>
              <li>Violating any laws in your jurisdiction or the jurisdiction where the service is hosted</li>
              <li>Transmitting spam, unsolicited messages, or bulk communications</li>
              <li>Using automated systems (bots, scripts, scrapers) without explicit permission</li>
              <li>Attempting to gain unauthorized access to the service or related systems</li>
              <li>Interfering with or disrupting the service or servers</li>
              <li>Uploading or transmitting viruses, malware, or other malicious code</li>
              <li>Harassing, threatening, or abusing other users</li>
              <li>Impersonating any person or entity</li>
              <li>Collecting or storing personal data of other users without consent</li>
              <li>Any activity that may harm, damage, or impair the service or its infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Account Suspension and Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to BluPresenter at any time,
              without prior notice, for any reason, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violation of these Terms and Conditions</li>
              <li>Engaging in prohibited uses as outlined in Section 5</li>
              <li>Any activity deemed malicious or harmful to the service or other users</li>
              <li>At the sole discretion of the service author</li>
            </ul>
            <p className="mt-4">
              The determination of what constitutes a violation or malicious activity is at the sole discretion of the service author.
            </p>
            <p className="mt-4">
              You may also terminate your account at any time by submitting a request through our
              <a href="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"> GitHub Issues page</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Service Availability and Modifications</h2>
            <p>
              BluPresenter is provided free of charge with <strong>no guarantees of uptime, availability, or performance</strong>.
              The service may experience downtime, interruptions, or errors at any time.
            </p>
            <p className="mt-4">
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify, suspend, or discontinue the service (or any part thereof) at any time without notice</li>
              <li>Change features, functionality, or content of the service</li>
              <li>Impose limits on certain features or restrict access to parts of the service</li>
            </ul>
            <p className="mt-4">
              While our intention is to provide the service for free to as many people as possible,
              if continuing to operate the service becomes impossible — particularly for financial reasons — the service may be terminated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Open Source Software</h2>
            <p>
              BluPresenter is an open-source project licensed under the <strong>GNU General Public License v3.0 (GPL-3.0)</strong>.
              The source code is available on <a href="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>.
            </p>
            <p className="mt-4">
              You are free to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>View, study, and modify the source code</li>
              <li>Self-host your own instance of BluPresenter</li>
              <li>Contribute to the project</li>
            </ul>
            <p className="mt-4">
              If you choose to self-host BluPresenter, you are responsible for your own instance,
              including data handling, privacy practices, and compliance with applicable laws.
              These Terms and Conditions apply only to the hosted service at <a href="https://blupresenter.com" className="text-blue-500 hover:underline">blupresenter.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Disclaimer of Warranties</h2>
            <p>
              BluPresenter is provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> without warranties of any kind,
              either express or implied, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Warranties of merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy, reliability, or availability of the service</li>
              <li>That the service will be uninterrupted, secure, or error-free</li>
            </ul>
            <p className="mt-4">
              You use the service at your own risk. We do not warrant that the service will meet your requirements or expectations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, BluPresenter, its creator, contributors, and service providers
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loss of data or content</li>
              <li>Loss of profits or revenue</li>
              <li>Business interruption</li>
              <li>Loss of use or goodwill</li>
              <li>Any other intangible losses</li>
            </ul>
            <p className="mt-4">
              This limitation applies whether the claim is based on warranty, contract, tort, or any other legal theory,
              even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless BluPresenter, its creator, contributors, and service providers
              from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the service</li>
              <li>Your User Content</li>
              <li>Your violation of these Terms and Conditions</li>
              <li>Your violation of any rights of another party</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">12. Third-Party Services</h2>
            <p>
              BluPresenter relies on third-party services, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase</strong> for authentication and database services</li>
              <li><strong>Google</strong> for optional OAuth authentication</li>
            </ul>
            <p className="mt-4">
              Your use of these third-party services is subject to their respective terms of service and privacy policies.
              We are not responsible for the practices or policies of these third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">13. Privacy</h2>
            <p>
              Your use of BluPresenter is also governed by our <a href="/privacy-policy" className="text-blue-500 hover:underline">Privacy Policy</a>,
              which explains how we collect, use, and protect your personal information.
              By using the service, you consent to the practices described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">14. Intellectual Property</h2>
            <p>
              The BluPresenter software is licensed under GPL-3.0. However, the BluPresenter name, logo, and branding
              remain the property of the project creator.
            </p>
            <p className="mt-4">
              All User Content remains the property of the respective users who created it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">15. Governing Law and Jurisdiction</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of Brazil,
              without regard to its conflict of law provisions.
            </p>
            <p className="mt-4">
              Any disputes arising from or relating to these terms or your use of BluPresenter shall be subject to
              the exclusive jurisdiction of the courts of Brazil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">16. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms and Conditions at any time. When we make changes,
              we will update the "Last Updated" date at the top of this page.
            </p>
            <p className="mt-4">
              Your continued use of BluPresenter after any changes constitutes your acceptance of the new terms.
              We encourage you to review these terms periodically.
            </p>
            <p className="mt-4">
              Significant changes will be announced through the service or on our 
              <a href="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub repository</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">17. Severability</h2>
            <p>
              If any provision of these Terms and Conditions is found to be invalid or unenforceable,
              the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">18. Entire Agreement</h2>
            <p>
              These Terms and Conditions, together with our Privacy Policy, constitute the entire agreement between you and BluPresenter
              regarding your use of the service and supersede any prior agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">19. Contact Information</h2>
            <p>
              If you have any questions, concerns, or feedback regarding these Terms and Conditions, please contact us through:
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
              <strong>Important Notice:</strong> BluPresenter is an open-source project provided free of charge without formal legal guarantees.
              By using this service, you acknowledge that it is offered "as-is" and that you use it at your own risk.
              The service creator reserves the right to make all final decisions regarding account management, service availability, and interpretation of these terms.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
