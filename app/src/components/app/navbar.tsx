import ThemeToggler from "@/components/ui/theme-toggler";
import LanguageToggler from "../ui/language-toggler";
import ProfileButton from "./profile-button";
import OrganizationsButton from "./organizations-button";
import { useTranslation } from "react-i18next";

export default function AppNavbar() {

  const { t } = useTranslation('app');

  return (
    <header className="sticky top-0 z-900 flex w-full drop-shadow-1 bg-card">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div>
          {t('welcome.message')}
        </div>
        <div className="space-x-2">
          <LanguageToggler></LanguageToggler>
          <ThemeToggler></ThemeToggler>
          <OrganizationsButton></OrganizationsButton>
          <ProfileButton></ProfileButton>
        </div>
      </div>
    </header>
  )
}
