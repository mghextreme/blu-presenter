import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SongPart } from './song-part.entity';
import { Organization } from './organization.entity';
import { SongReference } from './song-reference.entity';

@Entity({ name: 'songs' })
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orgId: number;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column({
    nullable: true,
    default: null,
    type: 'char',
    length: 2,
  })
  language: string;

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

  @Column({
    type: 'json',
    array: true,
    select: false,
    default: () => "'[]'",
    nullable: false,
  })
  references: SongReference[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  updatedAt: Date;
}
