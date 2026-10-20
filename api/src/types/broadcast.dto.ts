import { IsArray, IsObject } from 'class-validator';
import { ISelection } from './selection.interface';

export class SetScheduleBroadcastDto {
  @IsArray()
  schedule: any[];
}

export class SetScheduleItemBroadcastDto {
  @IsObject()
  scheduleItem: any;
}

export class SetSelectionBroadcastDto {
  @IsObject()
  selection: ISelection;
}
