import { IOrganization } from './organization.interface';
import { IScheduleItem } from './schedule-item.interface';
import { ISongReference } from './song-reference.interface';

export interface ISchedule {
  id: number;
  title: string;
  date?: string | null;
  items: IScheduleItem[];
  references?: ISongReference[];
  secret?: string;
  organization?: IOrganization;
}
