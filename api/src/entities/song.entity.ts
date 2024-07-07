import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { SongPart } from './song-part.entity';

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
}
