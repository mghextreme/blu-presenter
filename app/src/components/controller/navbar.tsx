import ThemeToggler from "@/components/ui/theme-toggler";
import { Link } from "react-router-dom";

export default function ControllerNavbar() {
  return (
    <header className="sticky top-0 z-999 flex w-full drop-shadow-1 bg-background">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div>
          <Link to="/">
            <span className="text-2xl">Blu Slides</span>
          </Link>
        </div>
        <div>
          <ThemeToggler></ThemeToggler>
        </div>
      </div>
    </header>
  )
}
