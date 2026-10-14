import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VcsSource } from './vcs-source.entity';

export class VcsSyncRunDetail {
  path: string;
  action: string;
  status: string;
  songId?: number;
  message?: string;
}

@Entity({ name: 'vcs_sync_runs' })
export class VcsSyncRun {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sourceId: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  finishedAt: Date | null;

  @Column({ type: 'char', length: 40, nullable: true, default: null })
  baseCommitSha: string | null;

  @Column({ type: 'varchar', length: 16 })
  status: 'running' | 'completed' | 'failed';

  @Column({ type: 'int', default: 0 })
  added: number;

  @Column({ type: 'int', default: 0 })
  updated: number;

  @Column({ type: 'int', default: 0 })
  removed: number;

  @Column({ type: 'int', default: 0 })
  failed: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  details: VcsSyncRunDetail[];

  @ManyToOne(() => VcsSource, {
    createForeignKeyConstraints: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sourceId' })
  source: VcsSource;
}
