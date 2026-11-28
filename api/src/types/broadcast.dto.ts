import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

// Schedule items are reduced to the broadcast fields by the sanitizer, so
// only their shape is checked here.
export class SetScheduleBroadcastDto {
  @IsArray()
  @IsObject({ each: true })
  schedule: any[];
}

export class SetScheduleItemBroadcastDto {
  @IsObject()
  scheduleItem: any;
}

export class SelectionDto {
  @IsOptional()
  @IsInt()
  scheduleItem?: number;

  @IsOptional()
  @IsInt()
  slide?: number;

  @IsOptional()
  @IsInt()
  part?: number;
}

export class SetSelectionBroadcastDto {
  @IsObject()
  @ValidateNested()
  @Type(() => SelectionDto)
  selection: SelectionDto;
}
