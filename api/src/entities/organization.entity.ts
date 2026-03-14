import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany('OrganizationUser', 'organization', {
    createForeignKeyConstraints: true,
  })
  users: any[];

  @Column()
  ownerId: number;

  @ManyToOne('User', 'ownedOrganizations', {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: any;

  @OneToMany('Song', 'organization')
  songs: any[];

  @OneToMany('Theme', 'organization')
  themes: any[];

  @OneToMany('Session', 'organization')
  sessions: any[];

  @OneToMany('OrganizationInvitation', 'organization', {
    createForeignKeyConstraints: true,
  })
  invitations: any[];

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    length: 32,
  })
  secret: string;
}
