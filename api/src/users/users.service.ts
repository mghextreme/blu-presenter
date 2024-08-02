import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Organization, User } from 'src/entities';
import { UpdateProfileDto } from 'src/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private _supabaseClient: SupabaseClient;
  private get supabase() {
    if (!this._supabaseClient) {
      this._supabaseClient = createClient(
        this.configService.get('SUPABASE_URL'),
        this.configService.get('SUPABASE_KEY'),
      );
    }

    return this._supabaseClient;
  }

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
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

  async update(id: number, profileDto: UpdateProfileDto): Promise<User | null> {
    let result;
    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const song = await usersRepository.findOneBy({ id });
      song.nickname = profileDto.nickname;
      song.name = profileDto.name;

      this.supabase.auth.updateUser({
        data: {
          nickname: profileDto.nickname,
          name: profileDto.name,
        },
      });

      result = await usersRepository.save(song);
    });

    return result as User;
  }

  async findOrganizations(userId: number): Promise<Partial<Organization>[]> {
    const orgs = await this.organizationsRepository.find({
      where: {
        users: {
          id: userId,
        },
      },
      order: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      },
    });

    return orgs;
  }
}
