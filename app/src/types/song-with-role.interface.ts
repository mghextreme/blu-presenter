import { ISong } from "./song.interface";

export interface ISongWithRole extends ISong {
  role: 'owner' | 'admin' | 'member' | null;
  organization: {
    id: number;
    name: string;
  };
}
