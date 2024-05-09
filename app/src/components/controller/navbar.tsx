import ThemeToggler from "@/components/ui/theme-toggler";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useController } from "./controller-provider";
import { v4 } from "uuid";
import { IWindow } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

export default function ControllerNavbar() {
  const {
    windows,
    addWindow,
    closeAllWindows,
  } = useController();

  return (
    <header className="flex flex-0 w-full drop-shadow-1 bg-background">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div className="flex-0 flex flex-row items-center">
          <Link to="/">
            <span className="text-2xl">Blu Presenter</span>
          </Link>
        </div>
        <div className="flex-0 flex flex-row items-center">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button className="me-2">
                Go live
                <PlayIcon className="ms-2 size-4"></PlayIcon>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="cursor-pointer" onClick={() => addWindow({id: v4(), theme: 'black', mode: 'slide'} as IWindow)}>Black (slide)</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => addWindow({id: v4(), theme: 'chromaKey', mode: 'part'} as IWindow)}>Chroma Key (subtitles)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {windows.length > 0 && <Button className="me-2" title="Close presentations" onClick={() => closeAllWindows()}>
            <XMarkIcon className="size-4"></XMarkIcon>
          </Button>}
          <ThemeToggler></ThemeToggler>
        </div>
      </div>
    </header>
  )
}
