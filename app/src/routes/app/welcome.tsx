import { useTranslation } from "react-i18next";

export default function Welcome() {

  const { t } = useTranslation('app');

  return (
    <div className="p-8">
      <h1 className="text-3xl">{t('welcome.message')}</h1>
    </div>
  );
}
