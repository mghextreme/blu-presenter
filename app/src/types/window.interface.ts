import { ControllerMode } from "./controller-mode.type";
import { ITheme } from "./theme.interface";

export interface IWindow {
  id: string

  theme: ITheme
  mode: ControllerMode
}
