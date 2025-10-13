import ThemeToggler from "@/components/shared/theme-toggler";
import LanguageToggler from "@/components/shared/language-toggler";
import { useAuth } from "@/hooks/useAuth";
import { BluPresenterLogo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function SharedNavbar() {
  const { t } = useTranslation("home");

  const { isLoggedIn } = useAuth();

  return (
    <nav className="flex flex-col space-y-0 items-center justify-between px-4 md:px-8 py-4 shadow-sm md:flex-row">
      <div className="text-2xl">
        <BluPresenterLogo linkTo="/" />
      </div>
      <div className="space-x-2 mt-4 md:mt-0">
        <LanguageToggler></LanguageToggler>
        <ThemeToggler></ThemeToggler>
        {isLoggedIn ? (
          <Button asChild>
            <Link to="/app">{t('button.openDashboard')}</Link>
          </Button>
        ) : (
          <>
            <Button variant="outline" asChild>
              <Link to="/login">{t('button.login')}</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">{t('button.signUp')}</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}
