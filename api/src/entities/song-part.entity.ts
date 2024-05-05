import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Song } from './song.entity';

@Entity({ name: 'parts', orderBy: () => 'order' })
export class SongPart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order: number;

  @Column({ name: 'text' })
  text: string;

  @Column()
  songId: number;

  @ManyToOne(() => Song, (song) => song.blocks)
  song: Song;
}
