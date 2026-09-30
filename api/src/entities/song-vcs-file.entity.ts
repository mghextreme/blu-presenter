import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Song } from './song.entity';
import { VcsSource } from './vcs-source.entity';

@Entity({ name: 'song_vcs_files' })
export class SongVcsFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  songId: number;

  @Column()
  sourceId: number;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'char', length: 40 })
  blobSha: string;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  contentHash: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  syncedAt: Date;

  @ManyToOne(() => Song, {
    createForeignKeyConstraints: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'songId' })
  song: Song;

  @ManyToOne(() => VcsSource, {
    createForeignKeyConstraints: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sourceId' })
  source: VcsSource;
}
