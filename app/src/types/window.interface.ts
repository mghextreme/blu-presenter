import { ControllerMode } from "./controller-mode.type";

export type WindowTheme = 'black' | 'chromaKey';

export interface IWindow {
  id?: string

  theme: WindowTheme
  mode: ControllerMode
}
