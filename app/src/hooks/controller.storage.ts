import { IScheduleItem } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export interface IControllerConfig {
  autoAdvanceScheduleItem: boolean
}

export const DEFAULT_CONTROLLER_CONFIG: IControllerConfig = {
  autoAdvanceScheduleItem: false,
};

export function loadStoredSchedule(): IScheduleItem[] {
  const stored = localStorage.getItem(STORAGE_KEYS.controllerSchedule)
    || sessionStorage.getItem(STORAGE_KEYS.controllerSchedule);
  return parseOr(stored, []);
}

export function saveSchedule(schedule: IScheduleItem[]): void {
  const serialized = JSON.stringify(schedule);
  sessionStorage.setItem(STORAGE_KEYS.controllerSchedule, serialized);
  localStorage.setItem(STORAGE_KEYS.controllerSchedule, serialized);
}

export function loadStoredConfig(): IControllerConfig {
  return parseOr(localStorage.getItem(STORAGE_KEYS.controllerConfig), DEFAULT_CONTROLLER_CONFIG);
}

export function saveConfig(config: IControllerConfig): void {
  localStorage.setItem(STORAGE_KEYS.controllerConfig, JSON.stringify(config));
}

function parseOr<T>(serialized: string | null, fallback: T): T {
  if (!serialized) return fallback;
  try {
    return (JSON.parse(serialized) as T) || fallback;
  } catch {
    return fallback;
  }
}
