/* eslint-disable @typescript-eslint/no-explicit-any */
import { IOrganization } from '@/types/organization.interface';
import { ApiService } from './api.service';
import { secretQuery } from './secret-query';
import {
  IOrganizationInvitation,
  IOrganizationUser,
  OrganizationFeature,
  OrganizationRoleOptions,
  UserOrganization,
} from '@/types';
import { queryOptions } from '@tanstack/react-query';

export class OrganizationsService extends ApiService {
  public invalidateCache(): Promise<unknown> {
    return Promise.all([
      this.queryClient.invalidateQueries({ queryKey: ['organizations'] }),
      this.queryClient.invalidateQueries({ queryKey: ['user', 'organizations'] }),
    ]);
  }

  public currentQuery(orgId: number) {
    return queryOptions({
      queryKey: ['organizations', 'self', orgId],
      queryFn: async () => {
        const response = await this.getRequest('/organizations/self', {
          Organization: orgId.toString(),
        });
        return this.parseOrganization(response);
      },
    });
  }

  public async getCurrent(orgId: number): Promise<IOrganization | null> {
    return await this.queryClient.query(this.currentQuery(orgId));
  }

  public async add(value: IOrganization): Promise<IOrganization | null> {
    const result = (await this.postRequest('/organizations', JSON.stringify(value), {
      'content-type': 'application/json',
    })) as IOrganization;

    void this.invalidateCache();

    return result;
  }

  public async update(value: IOrganization, orgId: number): Promise<IOrganization | null> {
    const result = (await this.putRequest('/organizations/self', JSON.stringify(value), {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    })) as IOrganization;

    void this.invalidateCache();

    return result;
  }

  public async transferOwnership(toUserId: number, orgId: number): Promise<void> {
    (await this.postRequest(
      '/organizations/transferOwnership',
      JSON.stringify({
        userId: toUserId,
      }),
      {
        'content-type': 'application/json',
        Organization: orgId.toString(),
      },
    )) as IOrganization;

    void this.invalidateCache();
  }

  public async delete(orgId: number): Promise<void> {
    await this.deleteRequest(`/organizations`, {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    });

    void this.invalidateCache();
  }

  public memberQuery(id: number, orgId: number) {
    return queryOptions({
      queryKey: ['organizations', orgId, 'members', id],
      queryFn: async () => {
        const response = await this.getRequest(`/organizations/members/${id}`, {
          Organization: orgId.toString(),
        });
        return {
          id: response.user.id,
          name: response.user?.name,
          email: response.user?.email,
          role: response.role,
        } as IOrganizationUser;
      },
    });
  }

  public async getMember(id: number, orgId: number): Promise<IOrganizationUser> {
    return await this.queryClient.query(this.memberQuery(id, orgId));
  }

  public async inviteMember(
    email: string,
    role: OrganizationRoleOptions,
    orgId: number,
  ): Promise<IOrganizationInvitation> {
    const result = (await this.postRequest(
      '/organizations/members',
      JSON.stringify({
        email,
        role,
      }),
      {
        'content-type': 'application/json',
        Organization: orgId.toString(),
      },
    )) as IOrganizationInvitation;

    void this.invalidateCache();

    return result;
  }

  public async editMember(id: number, role: OrganizationRoleOptions, orgId: number) {
    await this.putRequest(
      `/organizations/members/${id}`,
      JSON.stringify({
        role,
      }),
      {
        'content-type': 'application/json',
        Organization: orgId.toString(),
      },
    );

    void this.invalidateCache();
  }

  public async getInvite(id: number, secret: string): Promise<IOrganizationInvitation> {
    return (await this.getRequest(
      `/organizations/invitations/${id}${secretQuery(secret)}`,
    )) as IOrganizationInvitation;
  }

  public invitationsQuery() {
    return queryOptions({
      queryKey: ['organizations', 'invitations', 'self'],
      queryFn: async () =>
        (await this.getRequest('/organizations/invitations')) as IOrganizationInvitation[],
    });
  }

  public async getInvitations(): Promise<IOrganizationInvitation[]> {
    return await this.queryClient.query(this.invitationsQuery());
  }

  public async acceptInvitation(id: number): Promise<void> {
    await this.postRequest(`/organizations/invitations/${id}/accept`, undefined, {
      'content-type': 'application/json',
    });

    void this.invalidateCache();
  }

  public async rejectInvitation(id: number): Promise<void> {
    await this.postRequest(`/organizations/invitations/${id}/reject`, undefined, {
      'content-type': 'application/json',
    });

    void this.invalidateCache();
  }

  public async cancelInvitation(id: number, orgId: number): Promise<void> {
    await this.deleteRequest(`/organizations/invitations/${id}`, {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    });

    void this.invalidateCache();
  }

  public async leave(orgId: number) {
    await this.postRequest(`/organizations/leave`, undefined, {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    });

    void this.invalidateCache();
  }

  public async removeMember(id: number, orgId: number): Promise<void> {
    await this.deleteRequest(`/organizations/members/${id}`, {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    });

    void this.invalidateCache();
  }

  public async getFromUser(): Promise<UserOrganization[]> {
    return await this.queryClient.query(this.getFromUserQuery());
  }

  public getFromUserQuery() {
    return queryOptions({
      queryKey: ['user', 'organizations'],
      queryFn: async () => {
        const orgUsers = await this.getRequest(`/users/organizations`);
        const mappedOrgs = orgUsers.map(
          (x: {
            id: number;
            role: OrganizationRoleOptions;
            name?: string;
            disabledFeatures?: OrganizationFeature[];
          }) => new UserOrganization(x.id, x.role, x.name, x.disabledFeatures),
        );

        return mappedOrgs;
      },
    });
  }

  private parseOrganization(response: any): IOrganization {
    return {
      id: response.id,
      name: response?.name,
      role: response?.role,
      disabledFeatures: response?.disabledFeatures ?? [],
      owner: {
        id: response.owner.id,
        name: response.owner?.name,
      },
      users:
        response.users?.map((user: any) => ({
          id: user.user.id,
          name: user.user?.name,
          email: user.user?.email,
          role: user.role,
        })) || [],
      invitations: response?.invitations,
    } as IOrganization;
  }
}
