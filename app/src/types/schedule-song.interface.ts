import { IScheduleItem } from "./schedule-item.interface";
import { ISong } from "./song.interface";

export interface IScheduleSong extends IScheduleItem, ISong {
  title: string
}
