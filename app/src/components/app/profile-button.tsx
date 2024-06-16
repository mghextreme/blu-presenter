import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuItem } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { useNavigate } from "react-router-dom";

export default function ProfileButton() {

  const { t } = useTranslation("navbar");
  const navigate = useNavigate();

  const { user, signOut } = useAuth();

  const goToProfile = () => {
    navigate("/app/profile", { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" className="justify-between max-w-48">
          <span className="truncate">{user?.user_metadata?.firstName || user?.email}</span>
          <ChevronDownIcon className="size-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={goToProfile}>{t('profile.profilePage')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>{t('profile.signOut')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
