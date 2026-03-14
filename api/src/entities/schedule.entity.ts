import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'schedules' })
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orgId: number;

  @Column()
  title: string;

  @Column({
    type: 'date',
    nullable: true,
    default: null,
  })
  date: string | null;

  @Column({
    type: 'json',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  items: any[];

  @Column()
  createdBy: number;

  @Column({
    nullable: true,
    default: null,
  })
  updatedBy: number | null;

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    length: 32,
  })
  secret: string;

  @ManyToOne('Organization', {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'orgId' })
  organization: any;

  @ManyToOne('User', {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'createdBy' })
  creator: any;

  @ManyToOne('User', {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'updatedBy' })
  updater: any;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date;
}
