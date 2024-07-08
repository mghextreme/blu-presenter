import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';

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

  @ManyToMany(() => Organization, (organization) => organization.users, {
    createForeignKeyConstraints: true,
  })
  organizations: Organization[];

  @OneToMany(() => Organization, (organization) => organization.owner, {
    createForeignKeyConstraints: true,
  })
  ownedOrganizations: User;
}
