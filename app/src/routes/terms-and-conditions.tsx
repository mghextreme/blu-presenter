import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

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
            <strong>{t('lastUpdated')}</strong> {new Date('2025-10-13T15:00:00-03:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('acceptanceTerms.title')}</h2>
            <p>
              {t('acceptanceTerms.p1')}
            </p>
            <p className="mt-4">
              <Trans t={t} i18nKey="acceptanceTerms.p2">
                BluPresenter is an open-source project provided free of charge. These terms govern your use of the hosted service
                available at <Link to="/" className="text-blue-500 hover:underline">blupresenter.com</Link>.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('descriptionOfService.title')}</h2>
            <p>
              {t('descriptionOfService.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('descriptionOfService.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`descriptionOfService.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {t('descriptionOfService.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('userAccounts.title')}</h2>
            <p>{t('userAccounts.p1')}</p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('userAccounts.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`userAccounts.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {t('userAccounts.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('userContentAndOwnership.title')}</h2>
            <p>
              <Trans t={t} i18nKey="userContentAndOwnership.p1">
                You retain <strong>full ownership</strong> of all content you create, upload, or share through BluPresenter,
                including presentations, lyrics, chords, and other materials ("User Content").
              </Trans>
            </p>
            <p className="mt-4">
              {t('userContentAndOwnership.p2')}
            </p>
            <p className="mt-4">
              {t('userContentAndOwnership.p3')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('prohibitedUses.title')}</h2>
            <p>{t('prohibitedUses.p1')}</p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('prohibitedUses.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`prohibitedUses.list.${index}`)}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('accountSuspensionAndTermination.title')}</h2>
            <p>
              {t('accountSuspensionAndTermination.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('accountSuspensionAndTermination.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`accountSuspensionAndTermination.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {t('accountSuspensionAndTermination.p2')}
            </p>
            <p className="mt-4">
              <Trans t={t} i18nKey="accountSuspensionAndTermination.p3">
                You may also terminate your account at any time by submitting a request through our
                <Link to="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"> GitHub Issues page</Link>.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('serviceAvailabilityAndModifications.title')}</h2>
            <p>
              <Trans t={t} i18nKey="serviceAvailabilityAndModifications.p1">
                BluPresenter is provided free of charge with <strong>no guarantees of uptime, availability, or performance</strong>.
                The service may experience downtime, interruptions, or errors at any time.
              </Trans>
            </p>
            <p className="mt-4">
              {t('serviceAvailabilityAndModifications.p2')}
            </p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('serviceAvailabilityAndModifications.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`serviceAvailabilityAndModifications.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {t('serviceAvailabilityAndModifications.p3')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('openSourceSoftware.title')}</h2>
            <p>
              <Trans t={t} i18nKey="openSourceSoftware.p1">
                BluPresenter is an open-source project licensed under the <strong>GNU General Public License v3.0 (GPL-3.0)</strong>.
                The source code is available on <Link to="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</Link>.
              </Trans>
            </p>
            <p className="mt-4">
              {t('openSourceSoftware.p2')}
            </p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('openSourceSoftware.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`openSourceSoftware.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <Trans t={t} i18nKey="openSourceSoftware.p3">
                If you choose to self-host BluPresenter, you are responsible for your own instance,
                including data handling, privacy practices, and compliance with applicable laws.
                These Terms and Conditions apply only to the hosted service at <Link to="https://blupresenter.com" className="text-blue-500 hover:underline">blupresenter.com</Link>.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('disclaimerOfWarranties.title')}</h2>
            <p>
              <Trans t={t} i18nKey="disclaimerOfWarranties.p1">
                BluPresenter is provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> without warranties of any kind,
                either express or implied, including but not limited to:
              </Trans>
            </p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('disclaimerOfWarranties.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`disclaimerOfWarranties.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {t('disclaimerOfWarranties.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('limitationOfLiability.title')}</h2>
            <p>
              {t('limitationOfLiability.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('limitationOfLiability.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`limitationOfLiability.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {t('limitationOfLiability.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('indemnification.title')}</h2>
            <p>
              {t('indemnification.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('indemnification.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`indemnification.list.${index}`)}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('thirdPartyServices.title')}</h2>
            <p>
              {t('thirdPartyServices.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('thirdPartyServices.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  <Trans t={t} i18nKey={`thirdPartyServices.list.${index}`}>
                    <strong>Supabase</strong> for authentication and database services
                  </Trans>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {t('thirdPartyServices.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('privacy.title')}</h2>
            <p>
              <Trans t={t} i18nKey="privacy.p1">
                Your use of BluPresenter is also governed by our <Link to="/privacy-policy" className="text-blue-500 hover:underline">Privacy Policy</Link>,
                which explains how we collect, use, and protect your personal information.
                By using the service, you consent to the practices described in the Privacy Policy.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('intellectualProperty.title')}</h2>
            <p>
              {t('intellectualProperty.p1')}
            </p>
            <p className="mt-4">
              {t('intellectualProperty.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('governingLawAndJurisdiction.title')}</h2>
            <p>
              {t('governingLawAndJurisdiction.p1')}
            </p>
            <p className="mt-4">
              {t('governingLawAndJurisdiction.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('changesToTerms.title')}</h2>
            <p>
              {t('changesToTerms.p1')}
            </p>
            <p className="mt-4">
              {t('changesToTerms.p2')}
            </p>
            <p className="mt-4">
              <Trans t={t} i18nKey="changesToTerms.p3">
                Significant changes will be announced through the service or on our 
                <Link to="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub repository</Link>.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('severability.title')}</h2>
            <p>
              {t('severability.p1')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('entireAgreement.title')}</h2>
            <p>
              {t('entireAgreement.p1')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('contactInformation.title')}</h2>
            <p>
              {t('contactInformation.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <Trans t={t} i18nKey="contactInformation.githubIssues">
                  <strong>GitHub Issues:</strong> <Link to="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://github.com/mghextreme/blu-presenter/issues</Link>
                </Trans>
              </li>
              <li>
                <Trans t={t} i18nKey="contactInformation.githubRepository">
                  <strong>GitHub Repository:</strong> <Link to="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://github.com/mghextreme/blu-presenter</Link>
                </Trans>
              </li>
            </ul>
          </section>

          <section className="mt-12 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm">
              <Trans t={t} i18nKey="warrantyNote">
                <strong>Important Notice:</strong> BluPresenter is an open-source project provided free of charge without formal legal guarantees.
                By using this service, you acknowledge that it is offered "as-is" and that you use it at your own risk.
                The service creator reserves the right to make all final decisions regarding account management, service availability, and interpretation of these terms.
              </Trans>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
