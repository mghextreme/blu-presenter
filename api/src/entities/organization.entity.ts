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
import { Theme } from './theme.entity';
import { OrganizationUser } from './organization-user.entity';
import { OrganizationInvitation } from './organization-invitation.entity';

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

  @OneToMany(() => Song, (theme) => theme.organization)
  themes: Theme[];

  @OneToMany(
    () => OrganizationInvitation,
    (orgInvitation) => orgInvitation.organization,
    {
      createForeignKeyConstraints: true,
    },
  )
  invitations: OrganizationInvitation[];

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    length: 32,
  })
  secret: string;
}
