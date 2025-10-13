import { useTheme } from "@/hooks/useTheme";
import SunIcon from "@heroicons/react/24/solid/SunIcon";
import MoonIcon from "@heroicons/react/24/solid/MoonIcon";
import ComputerIcon from "@heroicons/react/24/solid/ComputerDesktopIcon";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

type ThemeTogglerProps = {
  variant?: 'default' | 'ghost' | 'link' | 'outline';
}

export default function ThemeToggler({
  variant = 'outline',
}: ThemeTogglerProps) {

  const { t } = useTranslation("navbar");

  const {theme, setTheme} = useTheme();

  const toggleTheme = () => {
    if (theme == 'dark') {
      setTheme('light');
    } else if (theme == 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  }

  return (
    <Button onClick={toggleTheme} title={t('theme.title') + ': ' + t('theme.' + theme)} variant={variant}>
      {theme == 'light' && <SunIcon className="size-3"></SunIcon>}
      {theme == 'dark' && <MoonIcon className="size-3"></MoonIcon>}
      {theme == 'system' && <ComputerIcon className="size-3"></ComputerIcon>}
    </Button>
  )
}
