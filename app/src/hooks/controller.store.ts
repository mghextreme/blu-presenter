import { createStore, StoreApi } from "zustand/vanilla";
import { IScheduleItem, IWindow, ISlide, ControllerMode, ISlideTextContent, ISlideImageContent, IControllerSelection, ITheme } from "@/types";
import { generateScheduleItemUniqueId } from "@/lib/utils";
import { DEFAULT_CONTROLLER_CONFIG, IControllerConfig, loadStoredConfig, loadStoredSchedule, saveConfig, saveSchedule } from "./controller.storage";

interface ControllerData {
  mode: ControllerMode
  schedule: IScheduleItem[]
  scheduleItem?: IScheduleItem
  overrideSlide?: ISlide
  windows: IWindow[]
  config: IControllerConfig

  scheduleItemIx?: number
  slideIx?: number
  partIx?: number
  latestScheduleItemIx: number

  /** Derived from the indexes; keeps its identity until one of them changes. */
  selection: IControllerSelection
  /** Derived from `scheduleItem` and `slideIx`. */
  selectedSlide?: ISlide
}

interface ControllerActions {
  setMode: (mode: ControllerMode) => void

  replaceSchedule: (items: IScheduleItem[]) => void
  addToSchedule: (item: IScheduleItem | IScheduleItem[]) => void
  moveItemInSchedule: (fromIx: number, toIx: number) => void
  removeFromSchedule: (ix: number) => void
  removeAllFromSchedule: () => void

  setScheduleItem: (item: number | IScheduleItem, selection?: IControllerSelection) => void
  setSelection: (to: IControllerSelection) => void

  setBlank: () => void
  setLogo: () => void
  toggleBlank: () => void
  clearOverrideSlide: () => void

  previous: () => void
  next: () => void
  previousItem: (goToEnd?: boolean) => void
  nextItem: () => void

  addWindow: (window: IWindow) => void
  closeWindow: (id: string) => void
  closeAllWindows: () => void
  setWindowTheme: (id: string, theme?: ITheme) => void

  setConfig: (config: IControllerConfig) => void
}

export type ControllerState = ControllerData & ControllerActions;
export type ControllerStore = StoreApi<ControllerState>;

const BLANK_SLIDE = {
  id: 'blank',
  content: [{ type: 'lyrics', text: '' } as ISlideTextContent],
} as ISlide;

const LOGO_SLIDE = {
  id: 'logo',
  content: [{ type: 'image', url: 'https://picsum.photos/300/200', width: 300, height: 200 } as ISlideImageContent],
} as ISlide;

export function createControllerStore({ persist }: { persist: boolean }): ControllerStore {
  const store = createStore<ControllerState>()((set, get) => {
    const update = (patch: Partial<ControllerData>) => set((current) => withDerivedFields(current, patch));

    const indexSchedule = (items: IScheduleItem[], startingIx: number) =>
      items.map((item, ix) => ({
        ...item,
        index: startingIx + ix,
        uniqueId: generateScheduleItemUniqueId(item, startingIx + ix),
      }));

    const selectItemAt = (ix: number, goToEnd: boolean): Partial<ControllerData> => {
      const slides = get().schedule[ix]?.slides;
      const lastSlideParts = slides?.[slides.length - 1]?.content;
      return {
        scheduleItem: get().schedule[ix],
        scheduleItemIx: ix,
        latestScheduleItemIx: ix,
        slideIx: goToEnd && slides ? slides.length - 1 : 0,
        partIx: goToEnd && lastSlideParts ? lastSlideParts.length - 1 : 0,
      };
    };

    const currentOrLatestItemIx = () => get().scheduleItemIx ?? get().latestScheduleItemIx;

    const previousItem = (goToEnd: boolean = false) => {
      const ix = currentOrLatestItemIx();
      if (ix < 1) return;
      update(selectItemAt(ix - 1, goToEnd));
    };

    const nextItem = () => {
      const ix = currentOrLatestItemIx();
      if (ix >= get().schedule.length - 1) return;
      update(selectItemAt(ix + 1, false));
    };

    const previousSlide = () => {
      const { scheduleItem, slideIx, scheduleItemIx, latestScheduleItemIx, config } = get();
      if (!scheduleItem) return;

      if (slideIx === undefined) {
        if (scheduleItem.slides.length > 0) {
          update({ slideIx: scheduleItem.slides.length - 1, partIx: 0 });
        }
      } else if (slideIx > 0) {
        const newSlide = scheduleItem.slides[slideIx - 1];
        update({ slideIx: slideIx - 1, partIx: (newSlide?.content?.length ?? 1) - 1 });
      } else if (config.autoAdvanceScheduleItem) {
        const ix = scheduleItemIx ?? latestScheduleItemIx;
        if (ix > 0) update(selectItemAt(ix - 1, true));
      }
    };

    const nextSlide = () => {
      const { scheduleItem, slideIx, config } = get();
      if (!scheduleItem) return;

      if (slideIx === undefined) {
        update({ slideIx: 0, partIx: 0 });
      } else if (slideIx + 1 < scheduleItem.slides.length) {
        update({ slideIx: slideIx + 1, partIx: 0 });
      } else if (config.autoAdvanceScheduleItem) {
        nextItem();
      }
    };

    const previousPart = () => {
      const { scheduleItem, selectedSlide, partIx } = get();
      if (!scheduleItem) return;

      if (!selectedSlide) {
        previousSlide();
      } else if (partIx === undefined) {
        update({ partIx: (selectedSlide.content?.length ?? 1) - 1 });
      } else if (partIx > 0) {
        update({ partIx: partIx - 1 });
      } else {
        previousSlide();
      }
    };

    const nextPart = () => {
      const { scheduleItem, selectedSlide, partIx } = get();
      if (!scheduleItem) return;

      if (!selectedSlide) {
        nextSlide();
      } else if (partIx === undefined) {
        update({ partIx: 0 });
      } else if (partIx + 1 < (selectedSlide.content?.length ?? 1)) {
        update({ partIx: partIx + 1 });
      } else {
        nextSlide();
      }
    };

    return {
      mode: 'part',
      schedule: persist ? loadStoredSchedule() : [],
      scheduleItem: undefined,
      overrideSlide: undefined,
      windows: [],
      config: persist ? loadStoredConfig() : DEFAULT_CONTROLLER_CONFIG,
      scheduleItemIx: undefined,
      slideIx: undefined,
      partIx: undefined,
      latestScheduleItemIx: -1,
      selection: { scheduleItem: undefined, slide: undefined, part: undefined } as IControllerSelection,
      selectedSlide: undefined,

      setMode: (mode) => update({ mode }),

      replaceSchedule: (items) => update({ schedule: indexSchedule(items, 0) }),

      addToSchedule: (item) => {
        const { schedule } = get();
        const items = Array.isArray(item) ? item : [item];
        update({ schedule: [...schedule, ...indexSchedule(items, schedule.length)] });
      },

      moveItemInSchedule: (fromIx, toIx) => {
        if (fromIx === toIx) return;
        const { schedule, scheduleItemIx, latestScheduleItemIx } = get();

        const reordered = structuredClone(schedule);
        reordered.splice(fromIx, 1);
        reordered.splice(toIx, 0, schedule[fromIx]);
        const patch: Partial<ControllerData> = { schedule: reordered.map((item, ix) => ({ ...item, index: ix })) };

        if (scheduleItemIx === fromIx) {
          patch.scheduleItemIx = toIx;
          patch.latestScheduleItemIx = toIx;
        } else if (scheduleItemIx !== undefined) {
          const shift = (fromIx < scheduleItemIx ? -1 : 0) + (toIx <= scheduleItemIx ? 1 : 0);
          if (shift !== 0) {
            patch.scheduleItemIx = scheduleItemIx + shift;
            patch.latestScheduleItemIx = latestScheduleItemIx + shift;
          }
        }
        update(patch);
      },

      removeFromSchedule: (ix) => {
        const { schedule, scheduleItemIx, latestScheduleItemIx } = get();
        const patch: Partial<ControllerData> = {
          schedule: [
            ...schedule.slice(0, ix),
            ...schedule.slice(ix + 1).map((item, offset) => ({ ...item, index: ix + offset })),
          ],
        };

        if (scheduleItemIx !== undefined && ix <= scheduleItemIx) {
          patch.scheduleItemIx = ix === scheduleItemIx ? undefined : scheduleItemIx - 1;
          patch.latestScheduleItemIx = latestScheduleItemIx - 1;
        }
        update(patch);
      },

      removeAllFromSchedule: () => update({ schedule: [] }),

      setScheduleItem: (item, selection) => {
        if (item === undefined) return;
        const position = { slideIx: selection?.slide ?? 0, partIx: selection?.part ?? 0 };

        if (typeof item === 'number') {
          const { schedule } = get();
          const ix = item < 0 || item >= schedule.length ? 0 : item;
          update({ scheduleItem: schedule[ix], scheduleItemIx: ix, ...position });
        } else {
          update({ scheduleItem: item, scheduleItemIx: undefined, ...position });
        }
      },

      setSelection: (to) => {
        const { schedule, scheduleItem, scheduleItemIx, slideIx } = get();
        if (to.scheduleItem === undefined && scheduleItemIx === undefined && scheduleItem === undefined) return;

        let targetItemIx = to.scheduleItem ?? scheduleItemIx;
        if (targetItemIx !== undefined && (targetItemIx < 0 || targetItemIx >= schedule.length)) {
          targetItemIx = 0;
        }

        const patch: Partial<ControllerData> = {};
        let targetItem = scheduleItem;
        if (targetItemIx !== undefined) {
          if (scheduleItemIx !== targetItemIx && targetItemIx < schedule.length) {
            targetItem = schedule[targetItemIx];
            patch.scheduleItem = targetItem;
          }
          patch.scheduleItemIx = targetItemIx;
          patch.latestScheduleItemIx = targetItemIx;
        }

        if (targetItem === undefined) {
          update(patch);
          return;
        }

        const slideCount = targetItem.slides?.length ?? 0;
        let targetSlideIx = slideIx || 0;
        if (to.slide !== undefined && to.slide >= 0 && to.slide < slideCount) {
          targetSlideIx = to.slide;
          patch.slideIx = to.slide;
        }
        patch.overrideSlide = undefined;

        const targetSlide = targetSlideIx < slideCount ? targetItem.slides[targetSlideIx] : undefined;
        if (targetSlide && to.part !== undefined) {
          const partCount = targetSlide.content?.length;
          if (partCount === undefined || to.part >= partCount) {
            patch.partIx = 0;
          } else {
            patch.partIx = to.part < 0 ? partCount - 1 : to.part;
          }
        }
        update(patch);
      },

      setBlank: () => update({ overrideSlide: BLANK_SLIDE }),
      setLogo: () => update({ overrideSlide: LOGO_SLIDE }),
      toggleBlank: () => update({ overrideSlide: get().overrideSlide?.id === 'blank' ? undefined : BLANK_SLIDE }),
      clearOverrideSlide: () => update({ overrideSlide: undefined }),

      previous: () => (get().mode === 'part' ? previousPart() : previousSlide()),
      next: () => (get().mode === 'part' ? nextPart() : nextSlide()),
      previousItem,
      nextItem,

      addWindow: (window) => update({ windows: [...get().windows, window] }),
      closeWindow: (id) => update({ windows: get().windows.filter((w) => w.id !== id) }),
      closeAllWindows: () => update({ windows: [] }),
      setWindowTheme: (id, theme) => update({ windows: get().windows.map((w) => (w.id === id ? { ...w, theme } : w)) }),

      setConfig: (config) => update({ config }),
    };
  });

  if (persist) {
    store.subscribe((state, previous) => {
      if (state.schedule !== previous.schedule) saveSchedule(state.schedule);
      if (state.config !== previous.config) saveConfig(state.config);
    });
  }

  return store;
}

function withDerivedFields(current: ControllerState, patch: Partial<ControllerData>): Partial<ControllerData> {
  const next = { ...current, ...patch };
  const derived: Partial<ControllerData> = { ...patch };

  const { selection } = current;
  if (next.scheduleItemIx !== selection.scheduleItem || next.slideIx !== selection.slide || next.partIx !== selection.part) {
    derived.selection = { scheduleItem: next.scheduleItemIx, slide: next.slideIx, part: next.partIx } as IControllerSelection;
  }
  if (next.scheduleItem !== current.scheduleItem || next.slideIx !== current.slideIx) {
    derived.selectedSlide = slideAt(next.scheduleItem, next.slideIx);
  }
  return derived;
}

function slideAt(item: IScheduleItem | undefined, slideIx: number | undefined): ISlide | undefined {
  if (item === undefined || slideIx === undefined) return undefined;
  return slideIx >= 0 && slideIx < (item.slides?.length ?? 0) ? item.slides[slideIx] : undefined;
}
