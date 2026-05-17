import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { useTranslation } from "react-i18next";

export function ResetPassword() {
  const { t } = useTranslation("auth");

  return (
    <>
      <title>{t("resetPassword.title") + " - BluPresenter"}</title>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("resetPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("resetPassword.description")}
        </p>
      </div>
      <ResetPasswordForm />
    </>
  );
}
