import ThemeToggler from "@/components/ui/theme-toggler";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AppNavbar() {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-999 flex w-full drop-shadow-1 bg-card">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div>
          Breadcrumbs...
        </div>
        <div className="space-x-2">
          <ThemeToggler></ThemeToggler>
          <Button onClick={signOut}>Logout</Button>
        </div>
      </div>
    </header>
  )
}
