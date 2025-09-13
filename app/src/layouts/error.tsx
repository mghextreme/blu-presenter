/* eslint-disable @typescript-eslint/no-explicit-any */
import { isRouteErrorResponse, Link, useNavigate, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggler from "@/components/ui/language-toggler";
import ThemeToggler from "@/components/ui/theme-toggler";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/types";

function errorLayout(error: any) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        {error.status && (
          <>{error.status} - {error.statusText}<br/></>
        )}
        {error?.data?.message}
      </>
    );
  } else if (error instanceof Error) {
    return (
      <>
        {error.message}<br/>
        <pre>{error.stack}</pre>
      </>
    );
  } else {
    return <>Unknown error</>;
  }
}

export default function ErrorLayout() {
  const error = useRouteError();

  const { isLoggedIn, signOut } = useAuth();
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  let isAuthError = false;
  if (error instanceof ApiError) {
    isAuthError = error.status === 401 || error.status === 403;
  }

  const signOutAndRedirect = async () => {
    signOut();
    navigate('/login');
  }

  return (
    <div className="container relative hidden h-screen overflow-hidden flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-card">
      <div className="absolute right-4 top-4 md:right-8 md:top-8 flex justify-end">
        <LanguageToggler variant="ghost"></LanguageToggler>
        <ThemeToggler variant="ghost"></ThemeToggler>
      </div>
      <div className="relative hidden h-full flex-col p-10 text-foreground lg:flex dark:border-r">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-20 flex items-center">
          <Link to={isLoggedIn ? '/app' : '/'} className="text-lg font-medium">BluPresenter</Link>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div>
            <h1 className="text-5xl mb-3">{t('title')}</h1>
            <p className="text-2xl">{t('message')}</p>
          </div>
          <div>
            {isLoggedIn ? (
              isAuthError ? (
                <Button onClick={signOutAndRedirect}>{t('actions.signOut')}</Button>
              ) : (
                <Button asChild><Link to="/app">{t('actions.app')}</Link></Button>
              )
            ) : (
              <Button asChild><Link to="/">{t('actions.home')}</Link></Button>
            )}
          </div>
          {!isAuthError && (
            <div>
              <h4 className="text-md mb-1">{t('details')}</h4>
              <p className="text-sm text-muted-foreground">
                {errorLayout(error)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
