import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation("home");

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-200 dark:bg-gray-900">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
        {t('privacyPolicy.title')}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-lg text-center">
        {t('hero.description')}
      </p>
    </div>
  );
}
