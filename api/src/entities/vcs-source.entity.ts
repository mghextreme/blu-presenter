import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'vcs_sources' })
export class VcsSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  repo: string;

  @Column({ type: 'varchar', length: 255, default: 'main' })
  branch: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  basePath: string;

  @Column({ type: 'int', nullable: true, default: null })
  orgId: number | null;

  @Column({ type: 'jsonb', default: () => '\'["**/*.md"]\'' })
  includePatterns: string[];

  @Column({ type: 'jsonb', default: () => '\'["README.md"]\'' })
  excludePatterns: string[];

  @Column({ type: 'jsonb', default: () => '\'["add", "update", "remove"]\'' })
  allowedActions: string[];

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'char', length: 40, nullable: true, default: null })
  lastSyncedCommitSha: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lastSyncedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
