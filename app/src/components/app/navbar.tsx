import ThemeToggler from "@/components/ui/theme-toggler";
import LanguageToggler from "../ui/language-toggler";
import ProfileButton from "./profile-button";
import OrganizationsButton from "./organizations-button";
import { IOrganization } from "@/types/organization.interface";

type AppNavbarProps = {
  organizations: IOrganization[]
}

export default function AppNavbar({ organizations }: AppNavbarProps) {
  return (
    <header className="sticky top-0 z-999 flex w-full drop-shadow-1 bg-card">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div>
          Breadcrumbs...
        </div>
        <div className="space-x-2">
          <LanguageToggler></LanguageToggler>
          <ThemeToggler></ThemeToggler>
          <OrganizationsButton organizations={organizations}></OrganizationsButton>
          <ProfileButton></ProfileButton>
        </div>
      </div>
    </header>
  )
}
