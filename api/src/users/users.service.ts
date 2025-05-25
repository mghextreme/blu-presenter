import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrganizationUser, User } from 'src/entities';
import { UpdateProfileDto } from 'src/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { Supabase } from 'src/supabase/supabase';

@Injectable()
export class UsersService {
  private supabaseClient: SupabaseClient;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    @Inject(Supabase)
    supabase: Supabase,
  ) {
    this.supabaseClient = supabase.getClient();
  }

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

  async update(id: number, profileDto: UpdateProfileDto): Promise<User | null> {
    let result;
    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const song = await usersRepository.findOneBy({ id });
      song.nickname = profileDto.nickname;
      song.name = profileDto.name;

      this.supabaseClient.auth.updateUser({
        data: {
          nickname: profileDto.nickname,
          name: profileDto.name,
        },
      });

      result = await usersRepository.save(song);
    });

    return result as User;
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
