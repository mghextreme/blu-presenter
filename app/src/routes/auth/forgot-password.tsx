import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { useTranslation } from "react-i18next";

export function ForgotPassword() {
  const { t } = useTranslation("auth");

  return (
    <>
      <title>{t("forgotPassword.title") + " - BluPresenter"}</title>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("forgotPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("forgotPassword.description")}
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
