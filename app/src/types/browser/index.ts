export interface IScreenDetails {
  label: string
  width: number
  height: number
  devicePixelRatio: number
}

export interface IBrowserWindow {
  getScreenDetails: () => Promise<{screens: IScreenDetails[]}>
}

export interface IPositionableElement {
  offsetTop: number
  scrollTo: (options: {top: number, behavior: string}) => void
}
