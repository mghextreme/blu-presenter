import { createContext, useContext, useState } from "react"
import { useHotkeys } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';

import SlideVisualizer from "./slide-visualizer"
import ScreenSelector from "./screen-selector"
import { IScheduleItem, IWindow, ISlide, ControllerMode, ISlideTextContent, ISlideImageContent } from "@/types"
import WindowProvider from "./window-provider"

type ControllerProviderProps = {
  children: React.ReactNode
}

type ControllerProviderState = {
  mode: ControllerMode,

  schedule: IScheduleItem[],
  addToSchedule: (item: IScheduleItem) => void,
  removeFromSchedule: (ix: number) => null,

  scheduleItemIndex?: number,
  scheduleItem?: IScheduleItem,
  setScheduleItem: (ix: number, item?: IScheduleItem) => void,

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
  addToSchedule: () => null,
  removeFromSchedule: () => null,

  scheduleItemIndex: undefined,
  scheduleItem: undefined,
  setScheduleItem: () => null,

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
  const [scheduleItem, setScheduleItem] = useState<IScheduleItem | undefined>(initialState.scheduleItem);
  const [scheduleItemIndex, setScheduleItemIx] = useState<number | undefined>(initialState.scheduleItemIndex);

  const [selectedSlide, setSelectedSlide] = useState<ISlide | undefined>(initialState.selectedSlide);
  const [overrideSlide, setOverrideSlide] = useState<ISlide | undefined>(initialState.overrideSlide);
  const [slideIndex, setSlideIx] = useState<number>(initialState.slideIndex);

  const [partIndex, setPartIx] = useState<number>(initialState.partIndex);

  const [windows, setWindows] = useState<IWindow[]>([]);

  const setSlideIndex = (ix: number) => {
    if (scheduleItem && ix >= 0 && ix < scheduleItem.slides.length) {
      setSlideIx(ix);
      setSelectedSlide(scheduleItem?.slides[ix]);
      setOverrideSlide(undefined);
      setPartIx(0);
    }
  };
  const previousSlide = () => {
    if (scheduleItem && slideIndex > 0) {
      const newIndex = slideIndex - 1;
      setSlideIx(newIndex);

      const newSlide = scheduleItem?.slides[newIndex];
      setSelectedSlide(newSlide);
      setOverrideSlide(undefined);
      setPartIx((newSlide?.content?.length ?? 1) - 1);
    }
  };
  const nextSlide = () => {
    if (scheduleItem && slideIndex + 1 < scheduleItem.slides.length) {
      const newIndex = slideIndex + 1;
      setSlideIx(newIndex);
      setSelectedSlide(scheduleItem?.slides[newIndex]);
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
    addToSchedule: (item: IScheduleItem) => {
      const newValue = [
        ...schedule,
        item
      ];
      setSchedule(() => newValue);
    },
    removeFromSchedule: (ix: number) => {
      if (scheduleItemIndex !== undefined) {
        if (ix == scheduleItemIndex) {
          setScheduleItemIx(undefined);
        } else if (ix < scheduleItemIndex) {
          setScheduleItemIx(scheduleItemIndex - 1);
        }
      }

      const newValue = [
        ...schedule.slice(0, ix),
        ...schedule.slice(ix + 1),
      ]
      setSchedule(newValue);
    },

    scheduleItemIndex,
    scheduleItem: scheduleItem,
    setScheduleItem: (ix: number, item?: IScheduleItem) => {
      if (ix === undefined && item !== undefined) {
        setScheduleItemIx(undefined);
        setScheduleItem(item);
        setSlideIx(0);
        setSelectedSlide(item.slides[0]);
        setPartIx(0);
        return;
      }

      if (ix < 0 || ix >= schedule.length) return;

      const newItem = schedule[ix];
      setScheduleItemIx(ix);
      setScheduleItem(newItem);
      setSlideIx(0);
      setSelectedSlide(newItem.slides[0]);
      setPartIx(0);
    },

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

      const newSlide = scheduleItem?.slides[slideIx];
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
