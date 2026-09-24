import { ThemeToggler } from "@/components/shared/theme-toggler";
import { LanguageToggler } from "@/components/shared/language-toggler";
import { ProfileButton } from "./profile-button";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { BluPresenterLogo } from "../shared/logo";

export function AppNavbar({ children }: { children?: React.ReactNode }) {

  const { isLoggedIn } = useAuth();
  const { title } = usePageTitle();

  return (
    <header className="sticky top-0 z-100 flex w-full drop-shadow-1 bg-card flex-0">
      <div className="flex flex-col md:flex-row flex-grow items-center justify-between px-2 md:px-6 py-4 shadow-2 gap-2">
        <div className="flex flex-row items-center gap-3 min-w-0">
          <BluPresenterLogo linkTo="/app" />
          {title && <h1 className="text-lg md:text-xl font-semibold truncate">{title}</h1>}
        </div>
        <div className="flex flex-row flex-wrap justify-center items-center gap-2">
          <LanguageToggler></LanguageToggler>
          <ThemeToggler></ThemeToggler>
          {isLoggedIn && <>
            <ProfileButton></ProfileButton>
          </>}
        </div>
        {children && <div className="flex items-center gap-2">
          {children}
        </div>}
      </div>
    </header>
  )
}
