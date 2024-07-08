import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Song } from './song.entity';

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => User, (user) => user.organizations, {
    createForeignKeyConstraints: true,
  })
  @JoinTable({
    name: 'organization_users',
    joinColumn: { name: 'orgId' },
    inverseJoinColumn: { name: 'userId' },
  })
  users: User[];

  @ManyToOne(() => User, (user) => user.ownedOrganizations, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Song, (song) => song.organization)
  songs: Song[];
}
