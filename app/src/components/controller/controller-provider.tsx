import { createContext, useContext, useState } from "react"
import { v4 as uuidv4 } from "uuid";
import { useHotkeys } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';

import SlideVisualizer from "./slide-visualizer"
import ScreenSelector from "./screen-selector"
import { IScheduleItem, ISong, IWindow, ISlide, ControllerMode, ISlideTitleContent, ISlideTextContent, ISlideContent, ISlideImageContent } from "@/types"
import WindowProvider from "./window-provider"

type ControllerProviderProps = {
  children: React.ReactNode
}

type ControllerProviderState = {
  mode: ControllerMode,

  schedule: IScheduleItem[],
  selectedItem?: IScheduleItem,

  selectedSlide?: ISlide,
  overrideSlide?: ISlide,
  setBlank: () => void,
  setLogo: () => void,

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
  closeWindow: (id: string) => void,
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
        content: [
          {
            type: 'title',
            title: 'Senhor, Te Quero',
            subtitle: 'Vineyard',
          } as ISlideTitleContent,
          {
            type: 'lyrics',
            text: 'Eu Te busco, Te procuro, oh Deus\n\
No silêncio Tu estás',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Eu Te busco, toda hora espero em Ti\n\
Revela-Te a mim',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Conhecer-Te eu quero mais',
          } as ISlideTextContent,
        ],
      },
      {
        content: [
          {
            type: 'lyrics',
            text: 'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
          } as ISlideTextContent,
        ],
      },
      {},
      {
        content: [
          {
            type: 'lyrics',
            text: 'Prosseguindo para o alvo eu vou\n\
A coroa conquistar',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Vou lutando, nada pode me impedir\n\
Eu vou Te seguir',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Conhecer-Te eu quero mais',
          } as ISlideTextContent,
        ],
      },
      {
        content: [
          {
            type: 'lyrics',
            text: 'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
          } as ISlideTextContent,
        ],
      },
      {},
      {
        content: [
          {
            type: 'lyrics',
            text: 'Prosseguindo para o alvo eu vou\n\
A coroa conquistar',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Vou lutando, nada pode me impedir\n\
Eu vou Te seguir',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Conhecer-Te eu quero mais',
          } as ISlideTextContent,
        ],
      },
      {
        content: [
          {
            type: 'lyrics',
            text: 'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
          } as ISlideTextContent,
        ],
      },
      {
        content: [
          {
            type: 'lyrics',
            text: 'Senhor, Te quero, quero ouvir Tua voz\n\
Senhor, Te quero mais',
          } as ISlideTextContent,
          {
            type: 'lyrics',
            text: 'Quero tocar-Te, Tua face eu quero ver\n\
Senhor, Te quero mais',
          } as ISlideTextContent,
        ],
      },
      {},
    ]
  } as ISong,

  selectedSlide: {},
  overrideSlide: undefined,
  setBlank: () => null,
  setLogo: () => null,

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
  const [overrideSlide, setOverrideSlide] = useState<ISlide | undefined>(initialState.overrideSlide);
  const [slideIndex, setSlideIx] = useState<number>(initialState.slideIndex);

  const [partIndex, setPartIx] = useState<number>(initialState.partIndex);

  const [windows, setWindows] = useState<IWindow[]>([]);

  const setSlideIndex = (ix: number) => {
    if (selectedItem && ix >= 0 && ix < selectedItem.slides.length) {
      setSlideIx(ix);
      setSelectedSlide(selectedItem?.slides[ix]);
      setOverrideSlide(undefined);
      setPartIx(0);
    }
  };
  const previousSlide = () => {
    if (selectedItem && slideIndex > 0) {
      const newIndex = slideIndex - 1;
      setSlideIx(newIndex);

      const newSlide = selectedItem?.slides[newIndex];
      setSelectedSlide(newSlide);
      setOverrideSlide(undefined);
      setPartIx((newSlide?.content?.length ?? 1) - 1);
    }
  };
  const nextSlide = () => {
    if (selectedItem && slideIndex + 1 < selectedItem.slides.length) {
      const newIndex = slideIndex + 1;
      setSlideIx(newIndex);
      setSelectedSlide(selectedItem?.slides[newIndex]);
      setOverrideSlide(undefined);
      setPartIx(0);
    }
  };

  const previousPart = () => {
    if (!selectedSlide) return;

    if (partIndex > 0) {
      const newIndex = partIndex - 1;
      setPartIx(newIndex);
      setOverrideSlide(undefined);
    } else {
      previousSlide();
    }
  };
  const nextPart = () => {
    if (!selectedSlide) return;

    if (partIndex + 1 < (selectedSlide.content?.length ?? 1)) {
      const newIndex = partIndex + 1;
      setPartIx(newIndex);
      setOverrideSlide(undefined);
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
    overrideSlide,
    setBlank: () => {
      setOverrideSlide({
        id: 'blank',
        content: [
          {
            type: 'lyrics',
            text: '',
          } as ISlideTextContent,
        ],
      } as ISlide);
    },
    setLogo: () => {
      setOverrideSlide({
        id: 'logo',
        content: [
          {
            type: 'image',
            url: 'https://picsum.photos/300/200',
            width: 300,
            height: 200,
          } as ISlideImageContent,
        ],
      } as ISlide);
    },

    slideIndex,
    setSlideIndex,
    previousSlide,
    nextSlide,

    partIndex,
    setPartIndex: (slideIx: number, ix: number) => {
      setSlideIndex(slideIx);

      const newSlide = selectedItem?.slides[slideIx];
      if (newSlide && ix >= 0 && ix < (newSlide.content?.length ?? 1)) {
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
    closeWindow: (id: string) => {
      const survivingWindows = windows.filter((v) => v.id != id);
      setWindows(survivingWindows);
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
        <WindowProvider key={w.id} id={w.id}>
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
