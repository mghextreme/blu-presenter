export interface IScreenDetails {
  label: string
  width: number
  height: number
  devicePixelRatio: number
}

export interface IBrowserWindow {
  currentScreen: Screen & { isExtended?: boolean }
  screen: Screen & { isExtended?: boolean }
  screens: (Screen & { isExtended?: boolean })[]
  getScreenDetails: () => Promise<{screens: IScreenDetails[]}>
}

export interface IPositionableElement {
  offsetTop: number
  scrollTo: (options: {top: number, behavior: string}) => void
}
