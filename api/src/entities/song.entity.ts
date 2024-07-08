import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SongPart } from './song-part.entity';
import { Organization } from './organization.entity';

@Entity({ name: 'songs' })
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column({
    type: 'json',
    array: true,
    select: false,
    default: () => "'[]'",
    nullable: false,
  })
  blocks: SongPart[];

  @ManyToOne(() => Organization, (organization) => organization.songs, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;
}
