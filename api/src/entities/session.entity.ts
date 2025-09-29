import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { ISelection } from 'src/types';

@Entity({ name: 'session' })
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orgId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  secret: string;

  @Column({
    type: 'json',
    array: true,
    select: true,
    default: () => "'[]'",
    nullable: false,
  })
  schedule: any[];

  @Column({
    type: 'json',
    array: false,
    select: true,
    default: () => "'{}'",
    nullable: false,
  })
  scheduleItem: any;

  @Column({
    type: 'json',
    array: false,
    select: true,
    default: () => "'{}'",
    nullable: false,
  })
  selection: ISelection;

  @ManyToOne(() => Organization, (organization) => organization.sessions, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  updatedAt: Date;
}
