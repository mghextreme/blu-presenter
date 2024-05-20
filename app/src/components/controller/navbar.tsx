import ThemeToggler from "@/components/ui/theme-toggler";
import ModeToggler from "@/components/ui/mode-toggler";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useController } from "@/hooks/controller.provider";
import { v4 } from "uuid";
import { IWindow } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PlayIcon from "@heroicons/react/24/solid/PlayIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

export default function ControllerNavbar() {
  const {
    setMode,
    windows,
    addWindow,
    closeAllWindows,
  } = useController();

  return (
    <header className="flex flex-0 w-full drop-shadow-1 bg-background">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 xl:px-6">
        <div className="flex-0 flex flex-row items-center">
          <Link to="/app">
            <span className="text-2xl">Blu Presenter</span>
          </Link>
        </div>
        <div className="flex-0 flex flex-row items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button>
                Go live
                <PlayIcon className="ms-2 size-4"></PlayIcon>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="cursor-pointer" onClick={() => addWindow({id: v4(), theme: 'black', mode: 'slide'} as IWindow)}>Black (slide)</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => {addWindow({id: v4(), theme: 'chromaKey', mode: 'part'} as IWindow); setMode('part')}}>Chroma Key (subtitles)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {windows.length > 0 && <Button title="Close presentations" onClick={() => closeAllWindows()}>
            <XMarkIcon className="size-4"></XMarkIcon>
          </Button>}
          <ModeToggler></ModeToggler>
          <ThemeToggler></ThemeToggler>
        </div>
      </div>
    </header>
  )
}
