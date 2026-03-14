import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  authId: string;

  @Column()
  nickname: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @OneToMany('OrganizationUser', 'user')
  organizations: any[];

  @OneToMany('Organization', 'owner')
  ownedOrganizations: any[];

  @OneToMany('OrganizationInvitation', 'inviter')
  invitations: any[];
}
