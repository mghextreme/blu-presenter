import { createContext, useContext, useState } from "react"
import SlideVisualizer from "./slide-visualizer"
import ScreenSelector from "./screen-selector"
import { IScheduleItem, ISong, IWindow, ISlide } from "@/types"
import WindowProvider from "./window-provider"

type ControllerProviderProps = {
  children: React.ReactNode
}

type ControllerProviderState = {
  schedule: IScheduleItem[],
  selectedItem?: IScheduleItem,
  selectedSlide?: ISlide,
  index: number,
  windows: IWindow[],
  setIndex: (ix: number) => void,
  previous: () => void,
  next: () => void,
  addWindow: (window: IWindow) => void,
  closeWindow: (ix: number) => void,
  closeAllWindows: () => void,
}

const initialState: ControllerProviderState = {
  schedule: [],
  selectedItem: {
    title: 'Senhor, Te Quero',
    artist: 'Vineyard',
    blocks: [],
    slides: [
      {},
      {
        title: 'Senhor, Te Quero',
        subtitle: 'Vineyard',
        text: 'Eu Te busco, Te procuro, oh Deus\n\
No silêncio Tu estás\n\
Eu Te busco, toda hora espero em Ti\n\
Revela-Te a mim\n\
Conhecer-Te eu quero mais',
      },
      {
        text: 'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais\n\
Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
      },
      {},
      {
        text: 'Prosseguindo para o alvo eu vou\n\
A coroa conquistar\n\
Vou lutando, nada pode me impedir\n\
Eu vou Te seguir\n\
Conhecer-Te eu quero mais',
      },
      {
        text: 'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais\n\
Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
      },
      {},
      {
        text: 'Prosseguindo para o alvo eu vou\n\
A coroa conquistar\n\
Vou lutando, nada pode me impedir\n\
Eu vou Te seguir\n\
Conhecer-Te eu quero mais',
      },
      {
        text: 'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais\n\
Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
      },
      {
        text: 'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais\n\
Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
      },
      {},
    ]
  } as ISong,
  selectedSlide: {},
  index: 0,
  windows: [],
  setIndex: () => null,
  previous: () => null,
  next: () => null,
  addWindow: () => null,
  closeWindow: () => null,
  closeAllWindows: () => null,
}

const ControllerProviderContext = createContext<ControllerProviderState>(initialState);

export default function ControllerProvider({
  children,
  ...props
}: ControllerProviderProps) {
  const [schedule, setSchedule] = useState<IScheduleItem[]>(initialState.schedule);
  const [selectedItem, setSelectedItem] = useState<IScheduleItem | undefined>(initialState.selectedItem);
  const [selectedSlide, setSelectedSlide] = useState<ISlide | undefined>(initialState.selectedSlide);
  const [index, setIndex] = useState<number>(initialState.index);
  const [windows, setWindows] = useState<IWindow[]>([]);

  const initialValue = {
    schedule,
    selectedItem,
    selectedSlide,
    index,
    windows,
    setIndex: (ix: number) => {
      if (selectedItem && ix >= 0 && ix < selectedItem.slides.length) {
        setIndex(ix);
        setSelectedSlide(selectedItem?.slides[ix]);
      }
    },
    previous: () => {
      if (selectedItem && index > 0) {
        const newIndex = index - 1;
        setIndex(newIndex);
        setSelectedSlide(selectedItem?.slides[newIndex]);
      }
    },
    next: () => {
      if (selectedItem && index + 1 < selectedItem.slides.length) {
        const newIndex = index + 1;
        setIndex(newIndex);
        setSelectedSlide(selectedItem?.slides[newIndex]);
      }
    },
    addWindow: (window: IWindow) => {
      const newValue = [
        ...windows,
        window
      ];
      setWindows(() => newValue);
    },
    closeWindow: (ix: number) => {
      setWindows([
        ...windows.slice(0, ix),
        ...windows.slice(ix + 1),
      ]);
    },
    closeAllWindows: () => {
      setWindows([]);
    },
  } as ControllerProviderState

  return (
    <ControllerProviderContext.Provider {...props} value={initialValue}>
      {children}
      {windows.map((w, ix) => (
        <WindowProvider key={ix}>
          <ScreenSelector>
            <SlideVisualizer theme={w.theme}></SlideVisualizer>
          </ScreenSelector>
        </WindowProvider>
      ))}
    </ControllerProviderContext.Provider>
  )
}

export const useController = () => {
  const context = useContext(ControllerProviderContext)

  if (context === undefined)
    throw new Error("useController must be used within a ControllerProvider")

  return context
}
