import { SongPart } from "src/entities";
import { OrganizationRoleOptions } from "src/types";

export interface SongWithRoleViewModel {
  id: number;
  title: string;
  artist: string;
  language: string;
  blocks: SongPart[];
  organization: {
    id: number;
    name: string;
    role: OrganizationRoleOptions;
  } | null;
}
