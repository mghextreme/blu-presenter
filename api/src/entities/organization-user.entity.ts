import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { OrganizationRoleOptions } from 'src/types';

@Entity({ name: 'organization_users' })
export class OrganizationUser {
  @PrimaryColumn()
  orgId: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne('Organization', 'users', {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'orgId' })
  organization: any;

  @ManyToOne('User', 'organizations', {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'userId' })
  user: any;

  @Column({ type: 'varchar' })
  role: OrganizationRoleOptions;
}
