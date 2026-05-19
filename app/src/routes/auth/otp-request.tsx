import { OtpRequestForm } from "@/components/auth/otp-request-form";
import { useTranslation } from "react-i18next";

export function OtpRequest() {
  const { t } = useTranslation("auth");

  return (
    <>
      <title>{t("otpSignIn.requestTitle") + " - BluPresenter"}</title>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("otpSignIn.requestTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("otpSignIn.requestDescription")}
        </p>
      </div>
      <OtpRequestForm />
    </>
  );
}
