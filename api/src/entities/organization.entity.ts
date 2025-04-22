import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Song } from './song.entity';
import { OrganizationUser } from './organization-user.entity';

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => OrganizationUser, (orgUser) => orgUser.organization, {
    createForeignKeyConstraints: true,
  })
  users: OrganizationUser[];

  @Column()
  ownerId: number;

  @ManyToOne(() => User, (user) => user.ownedOrganizations, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Song, (song) => song.organization)
  songs: Song[];
}
