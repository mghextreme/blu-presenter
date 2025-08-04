import { createContext, useContext, useEffect, useState } from "react"
import { useHotkeys } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';

import SlideVisualizer from "@/components/controller/slide-visualizer"
import ScreenSelector from "@/components/controller/screen-selector"
import { IScheduleItem, IWindow, ISlide, ControllerMode, ISlideTextContent, ISlideImageContent, IControllerSelection } from "@/types"
import WindowProvider from "./window.provider"

type ControllerProviderProps = {
  children: React.ReactNode
}

type ControllerProviderState = {
  mode: ControllerMode,
  setMode: (mode: ControllerMode) => void,

  schedule: IScheduleItem[],
  addToSchedule: (item: IScheduleItem) => void,
  removeFromSchedule: (ix: number) => void,

  scheduleItem?: IScheduleItem,
  setScheduleItem: (item: number | IScheduleItem) => void,

  selectedSlide?: ISlide,
  overrideSlide?: ISlide,
  setBlank: () => void,
  setLogo: () => void,
  clearOverrideSlide: () => void,

  selection: IControllerSelection,
  setSelection: (to: IControllerSelection) => void,

  previous: () => void,
  next: () => void,

  windows: IWindow[],
  addWindow: (window: IWindow) => void,
  closeWindow: (id: string) => void,
  closeAllWindows: () => void,
}

const initialState: ControllerProviderState = {
  mode: 'part',
  setMode: () => null,

  schedule: [],
  addToSchedule: () => null,
  removeFromSchedule: () => null,

  scheduleItem: undefined,
  setScheduleItem: () => null,

  selectedSlide: {},
  overrideSlide: undefined,
  setBlank: () => null,
  setLogo: () => null,
  clearOverrideSlide: () => null,

  selection: {} as IControllerSelection,
  setSelection: () => null,

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

  const addToSchedule = (item: IScheduleItem) => {
    item.index = schedule.length;
    const newValue = [
      ...schedule,
      item
    ];
    setSchedule(() => newValue);
  };
  const removeFromSchedule = (ix: number) => {
    if (scheduleItemIx !== undefined) {
      if (ix == scheduleItemIx) {
        setScheduleItemIx(undefined);
      } else if (ix < scheduleItemIx) {
        setScheduleItemIx(scheduleItemIx - 1);
      }
    }

    const newValue = [
      ...schedule.slice(0, ix),
      ...schedule.slice(ix + 1),
    ]
    setSchedule(newValue);
  };
  const externalSetScheduleItem = (item: number | IScheduleItem) => {
    if (typeof item === 'number') {
      externalSetSelection({ scheduleItem: item as number, slide: 0, part: 0 });
    } else {
      setScheduleItem(item as IScheduleItem);
      setScheduleItemIx(undefined);
      externalSetSelection({ slide: 0, part: 0 });
    }
  }

  const [selectedSlide, setSelectedSlide] = useState<ISlide | undefined>(initialState.selectedSlide);
  const [overrideSlide, setOverrideSlide] = useState<ISlide | undefined>(initialState.overrideSlide);

  const setBlank = () => {
    setOverrideSlide({
      id: 'blank',
      content: [
        {
          type: 'lyrics',
          text: '',
        } as ISlideTextContent,
      ],
    } as ISlide);
  }
  const setLogo = () => {
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
  }
  const clearOverrideSlide = () => {
    setOverrideSlide(undefined);
  }

  const [partIx, setPartIx] = useState<number | undefined>(undefined);
  const [slideIx, setSlideIx] = useState<number | undefined>(undefined);
  const [scheduleItemIx, setScheduleItemIx] = useState<number | undefined>(undefined);
  const [selection, setSelection] = useState<IControllerSelection>(initialState.selection);

  useEffect(() => {
    setSelection({
      part: partIx,
      slide: slideIx,
      scheduleItem: scheduleItemIx,
    } as IControllerSelection);
  }, [partIx, slideIx, scheduleItemIx]);

  useEffect(() => {
    if (slideIx === undefined || scheduleItem === undefined) {
      setSelectedSlide(undefined);
    } else if (slideIx >= 0 && slideIx < scheduleItem.slides.length) {
      setSelectedSlide(scheduleItem.slides[slideIx]);
    }
  }, [slideIx, scheduleItem]);

  useEffect(() => {
    if (scheduleItemIx === undefined) {
      setScheduleItem(undefined);
    } else if (scheduleItemIx >= 0 && scheduleItemIx < schedule.length) {
      setScheduleItem(schedule[scheduleItemIx]);
    }
  }, [scheduleItemIx]);

  const externalSetSelection = (to: IControllerSelection) => {
    if (to.scheduleItem === undefined && scheduleItemIx === undefined && scheduleItem === undefined) return;
    to.scheduleItem = to.scheduleItem ?? scheduleItemIx;

    if (to.scheduleItem !== undefined && (to.scheduleItem < 0 || to.scheduleItem > schedule.length)) {
      to.scheduleItem = 0;
    }

    setScheduleItemIx(to.scheduleItem);
    const curScheduleItem = to.scheduleItem !== undefined ? schedule[to.scheduleItem] : scheduleItem;

    if (curScheduleItem === undefined) return;

    if (to.slide !== undefined && to.slide >= 0 && to.slide < curScheduleItem.slides.length) {
      setSlideIx(to.slide);
    } else {
      to.slide = slideIx || 0;
    }

    clearOverrideSlide();
    const curSlide = curScheduleItem.slides[to.slide];

    if (to.part !== undefined && curSlide.content !== undefined && to.part >= 0 && to.part < curSlide.content?.length) {
      setPartIx(to.part);
    }
  };

  const previousSlide = () => {
    if (!scheduleItem) return;

    if (slideIx === undefined) {
      if (scheduleItem.slides.length > 0) {
        setSlideIx(scheduleItem.slides.length - 1);
        setPartIx(0);
      }
    } else if (slideIx > 0) {
      const newIndex = slideIx - 1;
      setSlideIx(newIndex);

      const newSlide = scheduleItem?.slides[newIndex];
      setPartIx((newSlide?.content?.length ?? 1) - 1);
    }
  };
  const nextSlide = () => {
    if (!scheduleItem) return;

    if (slideIx === undefined) {
      setSlideIx(0);
      setPartIx(0);
    } else if (slideIx + 1 < scheduleItem.slides.length) {
      const newIndex = slideIx + 1;
      setSlideIx(newIndex);
      setPartIx(0);
    }
  };

  const previousPart = () => {
    if (!scheduleItem) return;

    if (!selectedSlide) {
      previousSlide();
      return;
    }

    if (partIx === undefined) {
      const newIndex = (selectedSlide.content?.length ?? 1) - 1;
      setPartIx(newIndex);
    } else if (partIx > 0) {
      const newIndex = partIx - 1;
      setPartIx(newIndex);
    } else {
      previousSlide();
    }
  };
  const nextPart = () => {
    if (!scheduleItem) return;

    if (!selectedSlide) {
      nextSlide();
      return;
    }

    if (partIx === undefined) {
      setPartIx(0);
    } else if (partIx + 1 < (selectedSlide.content?.length ?? 1)) {
      const newIndex = partIx + 1;
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

  const [windows, setWindows] = useState<IWindow[]>([]);

  const addWindow = (window: IWindow) => {
    const newValue = [
      ...windows,
      window
    ];
    setWindows(() => newValue);
  }
  const closeWindow = (id: string) => {
    const survivingWindows = windows.filter((v) => v.id != id);
    setWindows(survivingWindows);
  }
  const closeAllWindows = () => {
    setWindows([]);
  }

  const initialValue = {
    mode,
    setMode,

    schedule,
    addToSchedule,
    removeFromSchedule,

    scheduleItem: scheduleItem,
    setScheduleItem: externalSetScheduleItem,

    selectedSlide,
    overrideSlide,
    setBlank,
    setLogo,
    clearOverrideSlide,

    previous,
    next,

    selection,
    setSelection: externalSetSelection,

    windows,
    addWindow,
    closeWindow,
    closeAllWindows,
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
