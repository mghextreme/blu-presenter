import { IScheduleItem, ISelection } from "src/types";

export const sanitizeSchedule = (schedule: any[]) => {
  return schedule.map((item) => sanitizeScheduleItem(item));
}

export const sanitizeScheduleItem = (item: any) => {
  return {
    id: item.id,
    index: item.index,
    title: item.title,
    artist: item.artist,
    language: item.language,
    blocks: item.blocks,
    slides: item.slides,
    uniqueId: item.uniqueId,
  } as IScheduleItem;
}

export const sanitizeSelection = (selection: any) => {
  return {
    scheduleItem: selection.scheduleItem,
    slide: selection.slide,
    part: selection.part,
  } as ISelection;
}
