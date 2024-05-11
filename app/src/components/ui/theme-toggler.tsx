import { useTheme } from "@/components/theme-provider"
import SunIcon from "@heroicons/react/24/solid/SunIcon";
import MoonIcon from "@heroicons/react/24/solid/MoonIcon";
import ComputerIcon from "@heroicons/react/24/solid/ComputerDesktopIcon";
import { Button } from "./button";

export default function ThemeToggler() {
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
    <Button onClick={toggleTheme} title={'Theme: ' + theme}>
      {theme == 'light' && <SunIcon className="size-3"></SunIcon>}
      {theme == 'dark' && <MoonIcon className="size-3"></MoonIcon>}
      {theme == 'system' && <ComputerIcon className="size-3"></ComputerIcon>}
    </Button>
  )
}
