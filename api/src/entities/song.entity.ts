import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { SongPart } from './song-part.entity';

@Entity({ name: 'songs' })
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name' })
  title: string;

  @Column()
  artist: string;

  @OneToMany(() => SongPart, (songPart) => songPart.song)
  blocks: SongPart[];
}
