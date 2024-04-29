import { IScheduleItem } from "./schedule-item.interface";
import { ISongPart } from "./song-part.interface";

export interface ISong extends IScheduleItem {
  artist?: string
  blocks?: ISongPart[]
}
