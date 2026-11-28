export interface IScheduleItem {
  id: number;
  index?: number;
  title?: string;
  type?: string;
  artist?: string | null;
  language?: string | null;
  blocks?: any[];
  references?: any[];
  slides?: any[];
  secret?: string | null;
  uniqueId?: number;
  updatedAt?: Date;
  organization?: {
    id: number;
    name: string | null;
  } | null;
}
