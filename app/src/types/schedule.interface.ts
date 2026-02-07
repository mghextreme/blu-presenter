import { IScheduleItem } from './schedule-item.interface';

export interface ISchedule {
  id: number;
  title: string;
  date?: string | null;
  items: IScheduleItem[];
}
