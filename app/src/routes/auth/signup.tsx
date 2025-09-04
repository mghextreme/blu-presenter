import { SignUpForm } from "@/components/auth/signup-form";
import { useTranslation } from "react-i18next";

export default function SignUp() {

  const { t } = useTranslation("auth");

  return (
    <>
      <title>{t('signUp.title') + ' - BluPresenter'}</title>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('signUp.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('signUp.description')}
        </p>
      </div>
      <SignUpForm />
    </>
  );
}
