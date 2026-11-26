/* eslint-disable @typescript-eslint/no-explicit-any */
import { isRouteErrorResponse, Link, useNavigate, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggler } from '@/components/shared/language-toggler';
import { ThemeToggler } from '@/components/shared/theme-toggler';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BluPresenterLogo } from '@/components/shared/logo';
import { ApiError } from '@/types';

function errorLayout(error: any) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        {error.status && (
          <>
            {error.status} - {error.statusText}
            <br />
          </>
        )}
        {error?.data?.message}
      </>
    );
  } else if (error instanceof Error) {
    return (
      <>
        {error.message}
        <br />
        <pre className="overflow-x-auto">{error.stack}</pre>
      </>
    );
  } else {
    return <>Unknown error</>;
  }
}

export function ErrorLayout() {
  const error = useRouteError();

  const { isLoggedIn, signOut } = useAuth();
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  let isAuthError = false;
  if (error instanceof ApiError) {
    isAuthError = error.status === 401 || error.status === 403;
  }

  const homeLink = isLoggedIn ? '/app' : '/';

  const signOutAndRedirect = async () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="container relative flex min-h-svh flex-col gap-6 py-4 lg:grid lg:h-screen lg:max-w-none lg:grid-cols-2 lg:items-center lg:gap-0 lg:overflow-hidden lg:px-0 lg:py-0 bg-card">
      {/* Below lg the brand panel is hidden, so show the logo and toggles in a header row. */}
      <div className="flex items-center justify-between lg:hidden">
        <BluPresenterLogo linkTo={homeLink} />
        <div className="flex">
          <LanguageToggler variant="ghost"></LanguageToggler>
          <ThemeToggler variant="ghost"></ThemeToggler>
        </div>
      </div>
      <div className="absolute right-8 top-8 hidden justify-end lg:flex">
        <LanguageToggler variant="ghost"></LanguageToggler>
        <ThemeToggler variant="ghost"></ThemeToggler>
      </div>
      <div className="relative hidden h-full flex-col p-10 text-foreground lg:flex dark:border-r">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-20 flex items-center">
          <Link to={homeLink} className="text-lg font-medium">
            BluPresenter
          </Link>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center lg:p-8">
        <div className="mx-auto flex w-full min-w-0 flex-col justify-center space-y-6 sm:w-[350px]">
          <div>
            <h1 className="text-5xl mb-3">{t('title')}</h1>
            <p className="text-2xl">{t('message')}</p>
          </div>
          <div>
            {isLoggedIn ? (
              isAuthError ? (
                <Button onClick={signOutAndRedirect}>{t('actions.signOut')}</Button>
              ) : (
                <Button asChild>
                  <Link to="/app">{t('actions.app')}</Link>
                </Button>
              )
            ) : (
              <Button asChild>
                <Link to="/">{t('actions.home')}</Link>
              </Button>
            )}
          </div>
          {!isAuthError && (
            <div>
              <h4 className="text-md mb-1">{t('details')}</h4>
              <div className="text-sm text-muted-foreground">{errorLayout(error)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
