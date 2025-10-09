import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import GithubIcon from "@/components/logos/github";
import { BluPresenterLogo, BluPresenterSlashIcon } from "@/components/shared/logo";
import LanguageToggler from "./language-toggler";
import ThemeToggler from "./theme-toggler";

export function Divider({ className }: { className?: string }) {
  return (
    <div data-orientation="horizontal" role="separator" className={cn(
      'flex items-center align-center text-center w-full flex-row h-px',
      className,
    )}>
      <div className="border-default w-full border-solid border-t"></div>
      <div className="text-default flex mx-2 whitespace-nowrap">
        <BluPresenterSlashIcon className="h-7 w-auto text-muted-foreground" />
      </div>
      <div className="border-default w-full border-solid border-t"></div>
    </div>
  );
}

export function SharedFooter() {
  const { t } = useTranslation("home");

  const { isLoggedIn } = useAuth();

  return (
    <>
      <Divider />
      <footer className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 space-y-8 lg:space-x-8 px-4 md:px-8">
          <div className="flex flex-col text-2xl items-center lg:items-start">
            <BluPresenterLogo linkTo="/" />
            <hr className="w-1/2 mt-4 mb-2" />
            <ul>
              <li>
                <Button variant="ghost" asChild>
                  <Link to="https://github.com/mghextreme/blu-presenter" target="_blank">
                    <GithubIcon className="size-4" />
                  </Link>
                </Button>
              </li>
            </ul>
          </div>
          <div className="col-span-2 grid sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="flex flex-col gap-2 items-center sm:items-start">
              <Link to="/app" className="text-muted-foreground hover:text-foreground">{t('button.home')}</Link>
              {isLoggedIn ? (
                <Link to="/app" className="text-muted-foreground hover:text-foreground">{t('button.openDashboard')}</Link>
              ) : (
                <>
                  <Link to="/login" className="text-muted-foreground hover:text-foreground">{t('button.login')}</Link>
                  <Link to="/signup" className="text-muted-foreground hover:text-foreground">{t('button.signUp')}</Link>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 items-center sm:items-start">
              <Link to="/open-source" className="text-muted-foreground hover:text-foreground">{t('button.openSource')}</Link>
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground">{t('button.privacyPolicy')}</Link>
              <Link to="/terms-and-conditions" className="text-muted-foreground hover:text-foreground">{t('button.termsAndConditions')}</Link>
            </div>
            <div className="flex flex-col gap-2 items-center sm:items-start">
              <Link to="https://github.com/mghextreme/blu-presenter/tree/master/docs" target="_blank" className="text-muted-foreground hover:text-foreground">{t('button.documentation')}</Link>
              <Link to="https://github.com/mghextreme/blu-presenter/issues" target="_blank" className="text-muted-foreground hover:text-foreground">{t('button.support')}</Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end gap-2">
            <LanguageToggler></LanguageToggler>
            <ThemeToggler></ThemeToggler>
          </div>
        </div>
      </footer>
      <Divider />
      <div className="pt-8 pb-16">
        <div className="mx-auto max-w-xl px-4 md:px-8 text-center text-xs leading-[1.75em] text-muted-foreground">
          <Trans t={t} i18nKey="footer.supportMessage">
            This project is released under the <Link to="/open-source" className="text-blue-500 hover:underline">GNU GPL v3.0</Link> license and is mantained by donations.<br/>
            Consider supporting us by <Link to="https://www.buymeacoffee.com/mghextreme" target="_blank" className="text-blue-500 hover:underline">Buying Us a Coffee</Link>
          </Trans>
        </div>
      </div>
    </>
  )
}
