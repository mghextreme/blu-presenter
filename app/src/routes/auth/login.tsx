import { LoginForm } from "@/components/auth/login-form";
import { useTranslation } from "react-i18next";

export default function Login() {

  const { t } = useTranslation("auth");

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('signIn.title')}
        </h1>
      </div>
      <LoginForm />
    </>
  );
}
