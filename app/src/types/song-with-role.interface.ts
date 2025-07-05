import { ISong } from "./song.interface";

export interface ISongWithRole extends ISong {
  organization?: {
    id: number;
    name: string;
    role: 'owner' | 'admin' | 'member';
  };
}
