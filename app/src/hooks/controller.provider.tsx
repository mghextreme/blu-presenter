import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useHotkeys } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';

import SelectorScreen from "@/components/controller/selector-screen"
import { IScheduleItem, IWindow, ISlide, ControllerMode, ISlideTextContent, ISlideImageContent, IControllerSelection } from "@/types"
import WindowProvider from "./window.provider"

export interface IControllerConfig {
  autoAdvanceScheduleItem: boolean
}

type ControllerProviderProps = {
  storeState?: boolean
  children: React.ReactNode
}

type ControllerProviderState = {
  mode: ControllerMode,
  setMode: (mode: ControllerMode) => void,

  schedule: IScheduleItem[],
  replaceSchedule: (items: IScheduleItem[]) => void,
  addToSchedule: (item: IScheduleItem | IScheduleItem[]) => void,
  moveItemInSchedule: (fromIx: number, toIx: number) => void,
  removeFromSchedule: (ix: number) => void,
  removeAllFromSchedule: () => void,

  scheduleItem?: IScheduleItem,
  setScheduleItem: (item: number | IScheduleItem, selection?: IControllerSelection) => void,

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

  config: IControllerConfig,
  setConfig: (config: IControllerConfig) => void,
}

const initialState: ControllerProviderState = {
  mode: 'part',
  setMode: () => null,

  schedule: [],
  addToSchedule: () => null,
  replaceSchedule: () => null,
  moveItemInSchedule: () => null,
  removeFromSchedule: () => null,
  removeAllFromSchedule: () => null,

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

  config: {
    autoAdvanceScheduleItem: false,
  },
  setConfig: () => null,
}

const ControllerProviderContext = createContext<ControllerProviderState>(initialState);

export default function ControllerProvider({
  storeState = false,
  children,
  ...props
}: ControllerProviderProps) {
  const [mode, setMode] = useState<ControllerMode>(initialState.mode);

  if (!initialState.schedule || initialState.schedule.length < 1) {
    try {
      const sessionSchedule = sessionStorage.getItem('controllerSchedule');
      if (sessionSchedule) {
        initialState.schedule = (JSON.parse(sessionSchedule) as IScheduleItem[]) || null;
      }
    }
    catch (e) {
      // Ignore error
    }
  }
  const [schedule, setSchedule] = useState<IScheduleItem[]>(initialState.schedule);
  const [scheduleItem, setScheduleItem] = useState<IScheduleItem | undefined>(initialState.scheduleItem);

  const saveAndSetSchedule = (newSchedule: IScheduleItem[]) => {
    sessionStorage.setItem('controllerSchedule', JSON.stringify(newSchedule));
    if (storeState) {
      localStorage.setItem('controllerSchedule', JSON.stringify(newSchedule));
    }
    setSchedule(newSchedule);
  };

  const addToSchedule = (item: IScheduleItem | IScheduleItem[]) => {
    const items = Array.isArray(item) ? item : [item];

    const uniqueIdBase = Date.now();
    const startingIx = schedule.length;
    const newValue = [
      ...schedule,
      ...items.map((item, ix) => ({ ...item, index: startingIx + ix, uniqueId: uniqueIdBase + ix })),
    ];
    saveAndSetSchedule(newValue);
  };
  const replaceSchedule = (items: IScheduleItem[]) => {
    const uniqueIdBase = Date.now();
    const newValue = [
      ...items.map((item, ix) => ({ ...item, index: ix, uniqueId: uniqueIdBase + ix })),
    ];
    saveAndSetSchedule(newValue);
  };
  const removeFromSchedule = (ix: number) => {
    if (scheduleItemIx !== undefined) {
      if (ix == scheduleItemIx) {
        setScheduleItemIx(undefined);
        setLatestScheduleItemIx(latestScheduleItemIx - 1);
      } else if (ix < scheduleItemIx) {
        setScheduleItemIx(scheduleItemIx - 1);
        setLatestScheduleItemIx(latestScheduleItemIx - 1);
      }
    }

    const newValue = [
      ...schedule.slice(0, ix),
      ...schedule.slice(ix + 1).map((item, halfIx) => ({ ...item, index: ix + halfIx })),
    ]
    saveAndSetSchedule(newValue);
  };
  const moveItemInSchedule = (fromIx: number, toIx: number) => {
    if (fromIx === toIx) return;

    const newValue = structuredClone(schedule);
    newValue.splice(fromIx, 1);
    newValue.splice(toIx, 0, schedule[fromIx]);

    saveAndSetSchedule(newValue.map((item, ix) => ({ ...item, index: ix })));

    if (scheduleItemIx === undefined) return;
    if (scheduleItemIx === fromIx) {
      setScheduleItemIx(toIx);
      setLatestScheduleItemIx(toIx);
      return;
    }

    let scheduleItemDelta = 0;
    if (fromIx < scheduleItemIx) { scheduleItemDelta -= 1; }
    if (toIx <= scheduleItemIx) { scheduleItemDelta += 1; }
    if (scheduleItemDelta !== 0) {
      setScheduleItemIx(scheduleItemIx + scheduleItemDelta);
      setLatestScheduleItemIx(scheduleItemIx + scheduleItemDelta);
    }
  };
  const removeAllFromSchedule = () => {
    saveAndSetSchedule([]);
  };
  const externalSetScheduleItem = (item?: number | IScheduleItem, selection?: IControllerSelection) => {
    if (item === undefined) return;

    if (typeof item === 'number') {
      if (item < 0 || item >= schedule.length) {
        item = 0;
      }
      setScheduleItem(schedule[item as number]);
      setScheduleItemIx(item as number);
      setSlideIx(selection?.slide ?? 0);
      setPartIx(selection?.part ?? 0);
    } else {
      setScheduleItem(item as IScheduleItem);
      setScheduleItemIx(undefined);
      setSlideIx(selection?.slide ?? 0);
      setPartIx(selection?.part ?? 0);
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
  const [latestScheduleItemIx, setLatestScheduleItemIx] = useState<number>(-1);
  const [scheduleItemIx, setScheduleItemIx] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (slideIx === undefined || scheduleItem === undefined) {
      setSelectedSlide(undefined);
    } else if (slideIx >= 0 && slideIx < (scheduleItem.slides?.length ?? 0)) {
      setSelectedSlide(scheduleItem.slides[slideIx]);
    }
  }, [slideIx, scheduleItem]);

  const externalSetSelection = (to: IControllerSelection) => {
    if (to.scheduleItem === undefined && scheduleItemIx === undefined && scheduleItem === undefined) return;
    to.scheduleItem = to.scheduleItem ?? scheduleItemIx;

    if (to.scheduleItem !== undefined && (to.scheduleItem < 0 || to.scheduleItem >= schedule.length)) {
      to.scheduleItem = 0;
    }

    if (to.scheduleItem !== undefined) {
      if (scheduleItemIx !== to.scheduleItem) {
        setScheduleItem(schedule[to.scheduleItem]);
      }
      setLatestScheduleItemIx(to.scheduleItem);
    }
    setScheduleItemIx(to.scheduleItem);
    const curScheduleItem = to.scheduleItem !== undefined && to.scheduleItem < schedule.length ? schedule[to.scheduleItem] : scheduleItem;

    if (curScheduleItem === undefined) return;

    if (to.slide !== undefined && to.slide >= 0 && to.slide < (curScheduleItem.slides?.length ?? 0)) {
      setSlideIx(to.slide);
    } else {
      to.slide = slideIx || 0;
    }

    clearOverrideSlide();
    const curSlide = curScheduleItem.slides && to.slide < (curScheduleItem.slides?.length ?? 0) ? curScheduleItem.slides[to.slide] : undefined;

    if (!!curSlide && to.part !== undefined) {
      if (curSlide.content === undefined || to.part >= curSlide.content?.length) {
        setPartIx(0);
      } else {
        if (to.part < 0) {
          to.part = curSlide.content?.length - 1;
        }
        setPartIx(to.part);
      }
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
    } else if (config.autoAdvanceScheduleItem && scheduleItemIx !== undefined && scheduleItemIx > 0) {
      setScheduleItemIx(scheduleItemIx - 1);
      setLatestScheduleItemIx(scheduleItemIx - 1);
      setSlideIx((schedule[scheduleItemIx - 1]?.slides.length ?? 1) - 1);
      setPartIx(-1);
    } else if (config.autoAdvanceScheduleItem && scheduleItemIx === undefined && latestScheduleItemIx > 0) {
      setScheduleItemIx(latestScheduleItemIx - 1);
      setLatestScheduleItemIx(latestScheduleItemIx - 1);
      setSlideIx((schedule[latestScheduleItemIx - 1]?.slides.length ?? 1) - 1);
      setPartIx(-1);
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
    } else if (config.autoAdvanceScheduleItem && scheduleItemIx !== undefined && scheduleItemIx + 1 < schedule.length) {
      setScheduleItemIx(scheduleItemIx + 1);
      setLatestScheduleItemIx(scheduleItemIx + 1);
      setSlideIx(0);
      setPartIx(0);
    } else if (config.autoAdvanceScheduleItem && scheduleItemIx === undefined && latestScheduleItemIx + 1 < schedule.length) {
      setScheduleItemIx(latestScheduleItemIx + 1);
      setLatestScheduleItemIx(latestScheduleItemIx + 1);
      setSlideIx(0);
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

  if (storeState) {
    try {
      const savedControllerConfig = localStorage.getItem('controllerConfig');
      if (savedControllerConfig) {
        initialState.config = (JSON.parse(savedControllerConfig) as IControllerConfig) || initialState.config;
      }
    }
    catch (e) {
      // Ignore error
    }
  }
  const [config, setConfig] = useState<IControllerConfig>(initialState.config);

  const setAndSaveConfig = (newConfig: IControllerConfig) => {
    if (storeState) {
      localStorage.setItem('controllerConfig', JSON.stringify(newConfig));
    }
    setConfig(newConfig);
  }

  const selection = useMemo(() => {
    return {
      scheduleItem: scheduleItemIx,
      slide: slideIx,
      part: partIx,
    } as IControllerSelection;
  }, [scheduleItemIx, slideIx, partIx]);

  const value = useMemo(() => {
    return {
      mode,
      setMode,

      schedule,
      addToSchedule,
      replaceSchedule,
      moveItemInSchedule,
      removeFromSchedule,
      removeAllFromSchedule,

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

      config,
      setConfig: setAndSaveConfig,
    } as ControllerProviderState;
  }, [
    mode,
    schedule,
    scheduleItem,
    selectedSlide,
    overrideSlide,
    selection,
    windows,
    config,
  ]);

  useHotkeys(Key.ArrowLeft, previous);
  useHotkeys(Key.ArrowRight, next);

  return (
    <ControllerProviderContext.Provider {...props} value={value}>
      {children}
      {windows.map((w) => (
        <WindowProvider key={w.id} id={w.id}>
          <SelectorScreen setMode={setMode} />
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
