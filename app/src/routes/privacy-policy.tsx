import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

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
            <strong>{t('lastUpdated')}</strong> {new Date('2025-10-08T22:00:00-03:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('intro.title')}</h2>
            <p>
              {t('intro.p1')}
            </p>
            <p>
              <Trans t={t} i18nKey="intro.p2">
                BluPresenter is an open-source project available on <Link to="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</Link>.
                We are committed to transparency and protecting your privacy. This service is provided as-is, without a formal company structure.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('informationWeCollect.title')}</h2>
            <p>{t('informationWeCollect.p1')}</p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('informationWeCollect.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  <Trans t={t} i18nKey={`informationWeCollect.list.${index}`}>
                    <strong>Account Information:</strong> Email address, name, and nickname
                  </Trans>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <Trans t={t} i18nKey="informationWeCollect.p2">
                We do <strong>not</strong> use analytics tools or tracking services. We only collect the minimum data necessary to provide the service.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('howWeUseYourInformation.title')}</h2>
            <p>{t('howWeUseYourInformation.p1')}</p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('howWeUseYourInformation.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`howWeUseYourInformation.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <Trans t={t} i18nKey="howWeUseYourInformation.p2">
                We do <strong>not</strong> sell, rent, or share your personal information with third parties - not for marketing, or any other purpose.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('thirdPartyServices.title')}</h2>
            <p>{t('thirdPartyServices.p1')}</p>

            <div className="ml-4 mt-4">
              <h3 className="text-lg font-medium mb-2">{t('thirdPartyServices.supabase.title')}</h3>
              <p>
                <Trans t={t} i18nKey="thirdPartyServices.supabase.p1">
                  We use <Link to="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Supabase</Link> for authentication and database services.
                  Your account data and application data are stored on Supabase servers located in the <strong>US East (Ohio) region (us-east-2)</strong>.
                </Trans>
              </p>
              <p className="mt-2">
                <Trans t={t} i18nKey="thirdPartyServices.supabase.p2">
                  Supabase's privacy practices are governed by their <Link to="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Privacy Policy</Link>.
                </Trans>
              </p>
            </div>

            <div className="ml-4 mt-4">
              <h3 className="text-lg font-medium mb-2">{t('thirdPartyServices.googleAuthentication.title')}</h3>
              <p>
                If you choose to sign in with Google, we use Google's OAuth service for authentication.
                Google may collect information according to their <Link to="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('cookiesAndLocalStorage.title')}</h2>
            <p>{t('cookiesAndLocalStorage.p1')}</p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              <li><strong>Authentication Cookies:</strong> Used to maintain your login session</li>
              <li><strong>Local and Session Storage:</strong> Used to store your preferences and session tokens</li>
            </ul>
            <p className="mt-4">
              {t('cookiesAndLocalStorage.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('dataSecurity.title')}</h2>
            <p>
              {t('dataSecurity.p1')}
            </p>
            <p className="mt-4">
              <Trans t={t} i18nKey="dataSecurity.p2">
                Your data is stored securely by <Link to="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Supabase</Link>, which implements industry-standard security practices.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('dataRetentionAndDeletion.title')}</h2>
            <p>
              {t('dataRetentionAndDeletion.p1')}
            </p>
            <p className="mt-4">
              <Trans t={t} i18nKey="dataRetentionAndDeletion.p2">
                If you wish to delete your account or have your data removed, please submit a request through our <Link to="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub Issues page</Link>.
                We will process your request as soon as reasonably possible.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('yourRights.title')}</h2>
            <p>{t('yourRights.p1')}</p>
            <ul className="list-disc pl-6 space-y-2 pt-2">
              {(t('yourRights.list', { returnObjects: true }) as string[]).map((_, index) => (
                <li key={index}>
                  {t(`yourRights.list.${index}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <Trans t={t} i18nKey="yourRights.p2">
                To exercise these rights, please submit a request through our <Link to="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub Issues page</Link>.
              </Trans>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('internationalUsers.title')}</h2>
            <p>
              {t('internationalUsers.p1')}
            </p>
            <p className="mt-4">
              {t('internationalUsers.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('childrensPrivacy.title')}</h2>
            <p>
              {t('childrensPrivacy.p1')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('openSourceNature.title')}</h2>
            <p>
              <Trans t={t} i18nKey="openSourceNature.p1">
                BluPresenter is an open-source project. The source code is publicly available on <Link to="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</Link>,
                and you can review exactly how your data is handled in the code.
              </Trans>
            </p>
            <p className="mt-4">
              {t('openSourceNature.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('changesToThisPrivacyPolicy.title')}</h2>
            <p>
              {t('changesToThisPrivacyPolicy.p1')}
            </p>
            <p className="mt-4">
              {t('changesToThisPrivacyPolicy.p2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">{t('contactUs.title')}</h2>
            <p>
              {t('contactUs.p1')}
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <Trans t={t} i18nKey="contactUs.githubIssues">
                  <strong>GitHub Issues:</strong> <Link to="https://github.com/mghextreme/blu-presenter/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://github.com/mghextreme/blu-presenter/issues</Link>
                </Trans>
              </li>
              <li>
                <Trans t={t} i18nKey="contactUs.githubRepository">
                  <strong>GitHub Repository:</strong> <Link to="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://github.com/mghextreme/blu-presenter</Link>
                </Trans>
              </li>
            </ul>
          </section>

          <section className="mt-12 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm">
              <Trans t={t} i18nKey="warrantyNote">
                <strong>Note:</strong> BluPresenter is provided as an open-source project without warranties.
                While we strive to protect your privacy and data, this service is offered "as-is" without formal legal guarantees.
                By using BluPresenter, you acknowledge and accept these terms.
              </Trans>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
