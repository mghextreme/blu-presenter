import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import OpenSourceInitiative from "@/components/icons/open-source";
import ServerStackIcon from "@heroicons/react/24/outline/ServerStackIcon";
import { BluPresenterLogo } from "@/components/shared/logo";

export default function OpenSource() {
  const { t } = useTranslation("open-source");

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
        <div className="w-full max-w-4xl px-2 sm:px-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <div className="flex justify-center items-center">
            <BluPresenterLogo linkTo="/" className="h-10 w-auto" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-medium">{t('reasoning.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('reasoning.description')}
            </p>
          </div>
        </div>
        <div className="w-full max-w-4xl px-2 sm:px-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <div className="flex flex-col gap-2 order-last md:order-first">
            <h3 className="text-xl font-medium">{t('license.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400">
              <Trans t={t} i18nKey="license.description">
                BluPresenter is released under the <Link to="https://spdx.org/licenses/GPL-3.0-or-later.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GNU GPL v3.0 license</Link>.
                This means that the source code is freely available and can be modified and distributed by anyone. You can find the source code on <Link to="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</Link>.
              </Trans>
            </p>
          </div>
          <div className="flex justify-center items-center">
            <OpenSourceInitiative className="h-12 md:h-24 w-auto" />
          </div>
        </div>
        <div className="w-full max-w-4xl px-2 sm:px-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <div className="flex justify-center items-center">
            <ServerStackIcon className="h-12 md:h-24 w-auto" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-medium">{t('selfHosting.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400">
              <Trans t={t} i18nKey="selfHosting.description">
                While we encourage you to use the hosted version of BluPresenter, it supports self-hosting. The project can be cloned from <Link to="https://github.com/mghextreme/blu-presenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</Link>, built, and run either locally or through containers, dependending only on a Supabase instance - which can also be self-hosted.
              </Trans>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
