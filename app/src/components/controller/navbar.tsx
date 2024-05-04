import ThemeToggler from "@/components/ui/theme-toggler";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useController } from "./controller-provider";

export default function ControllerNavbar() {
  const {
    addWindow,
    closeAllWindows,
  } = useController();

  return (
    <header className="flex flex-0 w-full drop-shadow-1 bg-background">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div>
          <Link to="/">
            <span className="text-2xl">Blu Slides</span>
          </Link>
        </div>
        <div>
          <Button className="me-3" onClick={() => addWindow({theme: 'black', mode: 'slide'})}>Add presentation (black)</Button>
          <Button className="me-3" onClick={() => addWindow({theme: 'chromaKey', mode: 'part'})}>Add presentation (chroma key)</Button>
          <Button className="me-3" onClick={() => closeAllWindows()}>Close all presentations</Button>
          <ThemeToggler></ThemeToggler>
        </div>
      </div>
    </header>
  )
}
