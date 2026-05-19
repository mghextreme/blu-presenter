import { OtpVerifyForm } from "@/components/auth/otp-verify-form";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function OtpVerify() {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  return (
    <>
      <title>{t("otpSignIn.verifyTitle") + " - BluPresenter"}</title>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("otpSignIn.verifyTitle")}
        </h1>
        {email && (
          <p className="text-sm text-muted-foreground">
            {t("otpSignIn.verifyDescription", { email })}
          </p>
        )}
      </div>
      <OtpVerifyForm />
    </>
  );
}
