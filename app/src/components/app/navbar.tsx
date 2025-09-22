import ThemeToggler from "@/components/ui/theme-toggler";
import LanguageToggler from "@/components/ui/language-toggler";
import ProfileButton from "./profile-button";
import OrganizationsButton from "./organizations-button";
import { useAuth } from "@/hooks/useAuth";
import { BluPresenterLogo } from "./logo";

export default function AppNavbar({ children }: { children?: React.ReactNode }) {

  const { isLoggedIn } = useAuth();

  return (
    <header className="sticky top-0 z-100 flex w-full drop-shadow-1 bg-card flex-0">
      <div className="flex flex-col md:flex-row flex-grow items-center justify-between px-2 md:px-6 py-4 shadow-2 gap-2">
        <BluPresenterLogo linkTo="/app" />
        <div className="flex flex-row flex-wrap justify-center items-center gap-2">
          <LanguageToggler></LanguageToggler>
          <ThemeToggler></ThemeToggler>
          {isLoggedIn && <>
            <OrganizationsButton></OrganizationsButton>
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
