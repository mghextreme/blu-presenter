import ThemeToggler from "@/components/ui/theme-toggler";
import LanguageToggler from "@/components/ui/language-toggler";
import ProfileButton from "./profile-button";
import OrganizationsButton from "./organizations-button";
import { useAuth } from "@/hooks/useAuth";

export default function AppNavbar({ children }: { children?: React.ReactNode }) {

  const { isLoggedIn } = useAuth();

  return (
    <header className="sticky top-0 z-100 flex w-full drop-shadow-1 bg-card">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div className="flex items-center space-x-2">
          {children}
        </div>
        <div className="flex gap-2">
          <LanguageToggler></LanguageToggler>
          <ThemeToggler></ThemeToggler>
          {isLoggedIn && <>
            <OrganizationsButton></OrganizationsButton>
            <ProfileButton></ProfileButton>
          </>}
        </div>
      </div>
    </header>
  )
}
