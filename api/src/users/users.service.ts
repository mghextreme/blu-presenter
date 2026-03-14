import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrganizationUser, User } from 'src/entities';
import { UpdateProfileDto } from 'src/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersBaseService {
  constructor(
    protected readonly dataSource: DataSource,
    @InjectRepository(User)
    protected readonly usersRepository: Repository<User>,
    @InjectRepository(OrganizationUser)
    protected readonly organizationUsersRepository: Repository<OrganizationUser>,
  ) {}

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneByOrFail({
      id,
    });
  }

  async findByAuthId(authId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { authId },
    });
  }

  async findUserOrganizations(
    userId: number,
  ): Promise<Partial<OrganizationUser>[]> {
    const orgs = await this.organizationUsersRepository.find({
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
        },
        role: true,
      },
    });

    return orgs;
  }
}

@Injectable()
export class UsersService extends UsersBaseService {
  constructor(
    protected readonly dataSource: DataSource,
    @InjectRepository(User)
    protected readonly usersRepository: Repository<User>,
    @InjectRepository(OrganizationUser)
    protected readonly organizationUsersRepository: Repository<OrganizationUser>,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    super(dataSource, usersRepository, organizationUsersRepository);
  }

  async update(id: number, profileDto: UpdateProfileDto, accessToken: string): Promise<User | null> {
    let result: User;
    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const song = await usersRepository.findOneBy({ id });
      song.nickname = profileDto.nickname;
      song.name = profileDto.name;

      result = await usersRepository.save(song);
    });

    // Update user metadata in Supabase asynchronously — non-critical, does not block the response
    fetch(`${this.configService.get('supabase.url')}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: this.configService.get('supabase.key'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { nickname: profileDto.nickname, name: profileDto.name } }),
    }).catch(() => {/* non-critical — DB record is already saved */});

    return result;
  }
}
