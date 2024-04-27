import { useTheme } from "@/components/theme-provider"
import { Button } from "./button";

export default function ThemeToggler() {
  const {theme, setTheme} = useTheme();

  const toggleTheme = () => {
    if (theme == 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }

  return (
    <Button onClick={toggleTheme}>{theme == 'dark' ? 'Light' : 'Dark'} Mode</Button>
  )
}
