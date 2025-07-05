import { SongPart } from "src/entities";

export interface SongWithRoleViewModel {
  id: number;
  title: string;
  artist: string;
  language: string;
  blocks: SongPart[];
  organization: {
    id: number;
    name: string;
    role: 'owner' | 'admin' | 'member';
  } | null;
}
