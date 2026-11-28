import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OrganizationUser, User } from 'src/entities';
import { OrganizationMembership, UpdateProfileDto } from 'src/types';
import { fetchWithTimeout } from 'src/utils/fetch-with-timeout';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(OrganizationUser)
    private readonly organizationUsersRepository: Repository<OrganizationUser>,
    private readonly configService: ConfigService,
  ) {}

  async findByAuthId(authId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { authId },
    });
  }

  async findUserOrganizations(
    userId: number,
  ): Promise<OrganizationMembership[]> {
    return this.organizationUsersRepository.find({
      where: {
        userId,
      },
      relations: {
        organization: true,
      },
      order: {
        organization: {
          name: {
            direction: 'asc',
            nulls: 'first',
          },
        },
      },
      select: {
        organization: {
          id: true,
          name: true,
          disabledFeatures: true,
        },
        role: true,
      },
    });
  }

  async update(
    id: number,
    profileDto: UpdateProfileDto,
    accessToken: string,
  ): Promise<User> {
    const user = await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const user = await usersRepository.findOneByOrFail({ id });
      user.nickname = profileDto.nickname;
      // An omitted name keeps its stored value.
      if (profileDto.name !== undefined) {
        user.name = profileDto.name;
      }

      return await usersRepository.save(user);
    });

    // Mirrors the profile into the Supabase user metadata without blocking
    // the response: the database record is the source of truth.
    fetchWithTimeout(`${this.configService.get('supabase.url')}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: this.configService.get<string>('supabase.key') ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: { nickname: profileDto.nickname, name: profileDto.name },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          this.logger.warn(
            `Failed to sync profile ${id} to Supabase: ${response.status}`,
          );
        }
      })
      .catch((error: Error) => {
        this.logger.warn(
          `Failed to sync profile ${id} to Supabase: ${error.message}`,
        );
      });

    return user;
  }
}
