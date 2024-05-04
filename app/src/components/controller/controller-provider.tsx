import { createContext, useContext, useState } from "react"
import { v4 as uuidv4 } from "uuid";
import { useHotkeys } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';

import SlideVisualizer from "./slide-visualizer"
import ScreenSelector from "./screen-selector"
import { IScheduleItem, ISong, IWindow, ISlide, ControllerMode } from "@/types"
import WindowProvider from "./window-provider"

type ControllerProviderProps = {
  children: React.ReactNode
}

type ControllerProviderState = {
  mode: ControllerMode,

  schedule: IScheduleItem[],
  selectedItem?: IScheduleItem,

  selectedSlide?: ISlide,
  slideIndex: number,
  setSlideIndex: (ix: number) => void,
  previousSlide: () => void,
  nextSlide: () => void,

  partIndex: number,
  setPartIndex: (slideIx:number, ix: number) => void,
  previousPart: () => void,
  nextPart: () => void,

  previous: () => void,
  next: () => void,

  windows: IWindow[],
  addWindow: (window: IWindow) => void,
  closeWindow: (ix: number) => void,
  closeAllWindows: () => void,
}

const initialState: ControllerProviderState = {
  mode: 'part',

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
        parts: [
          'Eu Te busco, Te procuro, oh Deus\n\
No silêncio Tu estás',
          'Eu Te busco, toda hora espero em Ti\n\
Revela-Te a mim',
          'Conhecer-Te eu quero mais',
        ],
      },
      {
        parts: [
          'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais',
          'Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
        ],
      },
      {},
      {
        parts: [
          'Prosseguindo para o alvo eu vou\n\
A coroa conquistar',
          'Vou lutando, nada pode me impedir\n\
Eu vou Te seguir',
          'Conhecer-Te eu quero mais',
        ],
      },
      {
        parts: [
          'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais',
          'Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
        ],
      },
      {},
      {
        parts: [
          'Prosseguindo para o alvo eu vou\n\
A coroa conquistar',
          'Vou lutando, nada pode me impedir\n\
Eu vou Te seguir',
          'Conhecer-Te eu quero mais',
        ],
      },
      {
        parts: [
          'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais',
          'Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
        ],
      },
      {
        parts: [
          'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais',
          'Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
        ],
      },
      {},
    ]
  } as ISong,

  selectedSlide: {},
  slideIndex: 0,
  setSlideIndex: () => null,
  previousSlide: () => null,
  nextSlide: () => null,

  partIndex: 0,
  setPartIndex: () => null,
  previousPart: () => null,
  nextPart: () => null,

  previous: () => null,
  next: () => null,

  windows: [],
  addWindow: () => null,
  closeWindow: () => null,
  closeAllWindows: () => null,
}

const ControllerProviderContext = createContext<ControllerProviderState>(initialState);

export default function ControllerProvider({
  children,
  ...props
}: ControllerProviderProps) {
  const [mode, setMode] = useState<ControllerMode>(initialState.mode);

  const [schedule, setSchedule] = useState<IScheduleItem[]>(initialState.schedule);
  const [selectedItem, setSelectedItem] = useState<IScheduleItem | undefined>(initialState.selectedItem);

  const [selectedSlide, setSelectedSlide] = useState<ISlide | undefined>(initialState.selectedSlide);
  const [slideIndex, setSlideIx] = useState<number>(initialState.slideIndex);

  const [partIndex, setPartIx] = useState<number>(initialState.partIndex);

  const [windows, setWindows] = useState<IWindow[]>([]);

  const setSlideIndex = (ix: number) => {
    if (selectedItem && ix >= 0 && ix < selectedItem.slides.length) {
      setSlideIx(ix);
      setSelectedSlide(selectedItem?.slides[ix]);
      setPartIx(0);
    }
  };
  const previousSlide = () => {
    if (selectedItem && slideIndex > 0) {
      const newIndex = slideIndex - 1;
      setSlideIx(newIndex);

      const newSlide = selectedItem?.slides[newIndex];
      setSelectedSlide(newSlide);
      setPartIx((newSlide?.parts?.length ?? 1) - 1);
    }
  };
  const nextSlide = () => {
    if (selectedItem && slideIndex + 1 < selectedItem.slides.length) {
      const newIndex = slideIndex + 1;
      setSlideIx(newIndex);
      setSelectedSlide(selectedItem?.slides[newIndex]);
      setPartIx(0);
    }
  };

  const previousPart = () => {
    if (!selectedSlide) return;

    if (partIndex > 0) {
      const newIndex = partIndex - 1;
      setPartIx(newIndex);
    } else {
      previousSlide();
    }
  };
  const nextPart = () => {
    if (!selectedSlide) return;

    if (partIndex + 1 < (selectedSlide.parts?.length ?? 1)) {
      const newIndex = partIndex + 1;
      setPartIx(newIndex);
    } else {
      nextSlide();
    }
  };

  const previous = () => {
    if (mode == 'part') {
      previousPart();
    } else {
      previousSlide();
    }
  };
  const next = () => {
    if (mode == 'part') {
      nextPart();
    } else {
      nextSlide();
    }
  };

  const initialValue = {
    mode,

    schedule,
    selectedItem,

    selectedSlide,
    slideIndex,
    setSlideIndex,
    previousSlide,
    nextSlide,

    partIndex,
    setPartIndex: (slideIx: number, ix: number) => {
      setSlideIndex(slideIx);

      const newSlide = selectedItem?.slides[slideIx];
      if (newSlide && ix >= 0 && ix < (newSlide.parts?.length ?? 1)) {
        setPartIx(ix);
      }
    },
    previousPart,
    nextPart,

    previous,
    next,

    windows,
    addWindow: (window: IWindow) => {
      if (!window.id) {
        window.id = uuidv4();
      }

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

  useHotkeys(Key.ArrowLeft, previous);
  useHotkeys(Key.ArrowRight, next);

  return (
    <ControllerProviderContext.Provider {...props} value={initialValue}>
      {children}
      {windows.map((w) => (
        <WindowProvider key={w.id} name={`window-${w.id}`}>
          <ScreenSelector>
            <SlideVisualizer theme={w.theme} mode={w.mode}></SlideVisualizer>
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
