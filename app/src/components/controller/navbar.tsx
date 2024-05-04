import ThemeToggler from "@/components/ui/theme-toggler";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useController } from "./controller-provider";
import { v4 } from "uuid";
import { IWindow } from "@/types";

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
          <Button className="me-3" onClick={() => addWindow({id: v4(), theme: 'black', mode: 'slide'} as IWindow)}>Add presentation (black)</Button>
          <Button className="me-3" onClick={() => addWindow({id: v4(), theme: 'chromaKey', mode: 'part'} as IWindow)}>Add presentation (chroma key)</Button>
          <Button className="me-3" onClick={() => closeAllWindows()}>Close all presentations</Button>
          <ThemeToggler></ThemeToggler>
        </div>
      </div>
    </header>
  )
}
