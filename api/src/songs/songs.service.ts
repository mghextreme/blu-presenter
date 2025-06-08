import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateSongDto, UpdateSongDto } from 'src/types';
import { Song } from 'src/entities';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class SongsService {
  constructor(
    @InjectRepository(Song) private songsRepository: Repository<Song>,
    @Inject(OrganizationsService) private organizationsService: OrganizationsService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  async findOne(orgId: number, id: number): Promise<Song | null> {
    return this.songsRepository.findOne({
      select: {
        id: true,
        title: true,
        artist: true,
        language: true,
        blocks: true,
      },
      where: {
        id,
        orgId,
      },
    });
  }

  async findAll(orgId: number): Promise<Song[]> {
    return this.songsRepository.find({
      select: {
        id: true,
        title: true,
        artist: true,
        language: true,
        blocks: true,
      },
      where: {
        orgId,
      },
      order: {
        title: 'asc',
        artist: 'asc',
      },
    });
  }

  async search(orgId: number, query: string): Promise<Song[]> {
    return await this.songsRepository.find({
      where: [
        { orgId, title: ILike(`%${query}%`) },
        { orgId, artist: ILike(`%${query}%`) },
        // TODO: search within song text
        // { blocks: { text: ILike(`%${query}%`) } },
      ],
      select: {
        id: true,
        title: true,
        artist: true,
        blocks: true,
      },
      order: {
        title: 'asc',
      },
    });
  }

  async create(orgId: number, createSongDto: CreateSongDto): Promise<Song> {
    const result = await this.songsRepository.insert({
      title: createSongDto.title,
      artist: createSongDto.artist,
      language: createSongDto.language,
      blocks: createSongDto.blocks,
      orgId,
    });
    const songId = result.raw[0].id;

    return this.findOne(orgId, songId);
  }

  async update(
    orgId: number,
    id: number,
    updateSongDto: UpdateSongDto,
  ): Promise<Song> {
    const song = await this.songsRepository.findOneBy({ id, orgId });
    if (!song) {
      throw new NotFoundException();
    }

    song.title = updateSongDto.title;
    song.artist = updateSongDto.artist;
    song.language = updateSongDto.language;
    song.blocks = updateSongDto.blocks;

    const result = await this.songsRepository.save(song);
    return result as Song;
  }

  async delete(orgId: number, id: number): Promise<void> {
    const song = await this.songsRepository.findOneBy({ id, orgId });
    if (!song) {
      throw new NotFoundException();
    }

    await this.songsRepository.delete(id);
  }

  async copyToOrganization(songId: number, organizationId: number): Promise<void> {
    const orgId = this.request.user['organization'];
    const song = await this.findOne(orgId, songId)
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const userId = this.request.user['internal']?.id;
    const userRole = await this.organizationsService.userRole(organizationId, userId);

    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      throw new NotFoundException('User does not have permission to copy songs to this organization');
    }

    this.create(
      organizationId,
      {
        title: song.title,
        artist: song.artist,
        language: song.language,
        blocks: song.blocks,
      }
    );
  }
}
