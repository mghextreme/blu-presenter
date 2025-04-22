import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateOrganizationDto, UpdateOrganizationDto } from 'src/types';
import { Organization, OrganizationUser } from 'src/entities';

@Injectable({ scope: Scope.REQUEST })
export class OrganizationsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
  ) {}

  async userRole(
    orgId: number,
    userId: number,
  ): Promise<'owner' | 'admin' | 'member' | null> {
    const orgUserRecord = this.organizationUsersRepository.findOneBy({
      orgId,
      userId,
    });

    if (!orgUserRecord) return null;

    return (await orgUserRecord).role;
  }

  async findOne(id: number): Promise<Organization | null> {
    return this.organizationsRepository.findOne({
      where: { id },
      relations: {
        users: {
          user: true,
        },
        owner: true,
      },
      select: {
        id: true,
        name: true,
        users: {
          user: {
            id: true,
            name: true,
          },
        },
        owner: {
          id: true,
          name: true,
        },
      },
    });
  }

  async create(
    createOrgDto: CreateOrganizationDto,
    userId: number,
  ): Promise<Organization> {
    let orgId: number;

    await this.dataSource.transaction(async (manager) => {
      const organizationsRepository = manager.getRepository(Organization);

      const result = await organizationsRepository.insert({
        name: createOrgDto.name,
        ownerId: userId,
      });
      orgId = result.raw[0].id;

      const organizationUsersRepository =
        manager.getRepository(OrganizationUser);
      await organizationUsersRepository.insert({
        orgId,
        userId: userId,
        role: 'owner',
      });
    });

    return this.findOne(orgId);
  }

  async update(
    id: number,
    updateOrgDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.organizationsRepository.findOneBy({ id });
    organization.name = updateOrgDto.name;

    const result = await this.organizationsRepository.save(organization);
    return result as Organization;
  }
}
