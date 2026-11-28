import { queryOptions } from '@tanstack/react-query';
import { ApiService } from './api.service';
import { secretQuery } from './secret-query';
import { ISchedule, ISchedulePlaylistSyncResult, SchedulePlaylistProviderId } from '@/types';
import { getOfflineScheduleById, searchOfflineSchedules } from '@/lib/offline/reads';

export interface ScheduleSearchPayload {
  query?: string;
  organizations?: number[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  itemsPerPage?: number;
}

const scheduleKeys = {
  all: ['schedules'] as const,
  detail: (scheduleId: number, secret?: string) =>
    ['schedules', 'id', scheduleId, secret || null] as const,
  search: (payload: ScheduleSearchPayload) => ['schedules', 'search', payload] as const,
};

export class SchedulesService extends ApiService {
  public invalidateCache(): Promise<void> {
    return this.queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
  }

  public searchQuery(payload: ScheduleSearchPayload) {
    return queryOptions({
      queryKey: scheduleKeys.search(payload),
      queryFn: () =>
        this.withOfflineFallback(
          async () =>
            (await this.postRequest('/schedules/search', JSON.stringify(payload), {
              'content-type': 'application/json',
            })) as ISchedule[],
          () => searchOfflineSchedules(payload),
        ),
    });
  }

  public async search(payload: ScheduleSearchPayload): Promise<ISchedule[]> {
    return await this.queryClient.query(this.searchQuery(payload));
  }

  public byIdQuery(scheduleId: number, secret?: string) {
    return queryOptions({
      queryKey: scheduleKeys.detail(scheduleId, secret),
      queryFn: () =>
        this.withOfflineFallback(
          async () =>
            (await this.getRequest(
              `/schedules/${scheduleId}${secretQuery(secret)}`,
            )) as ISchedule | null,
          () => getOfflineScheduleById(scheduleId),
        ),
    });
  }

  public async getById(scheduleId: number, secret?: string): Promise<ISchedule | null> {
    return await this.queryClient.query(this.byIdQuery(scheduleId, secret));
  }

  /** Requests the schedule from the API even when a fresh copy is cached. */
  public async fetchById(scheduleId: number, secret?: string): Promise<ISchedule | null> {
    return await this.fetchFresh(this.byIdQuery(scheduleId, secret));
  }

  public async add(value: Partial<ISchedule>, orgId: number): Promise<ISchedule | null> {
    const response = (await this.postRequest('/schedules', JSON.stringify(value), {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    })) as ISchedule;
    void this.invalidateCache();
    return response;
  }

  public async update(
    id: number,
    value: Partial<ISchedule>,
    orgId: number,
  ): Promise<ISchedule | null> {
    const response = (await this.putRequest(`/schedules/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    })) as ISchedule;
    void this.invalidateCache();
    return response;
  }

  public async delete(scheduleId: number, orgId: number): Promise<void> {
    await this.deleteRequest(`/schedules/${scheduleId}`, {
      Organization: orgId.toString(),
    });
    this.queryClient.removeQueries({ queryKey: ['schedules', 'id', scheduleId] });
    void this.invalidateCache();
  }

  /** Creates (or re-syncs) the schedule's auto-generated playlist on a
   * streaming service. */
  public async syncPlaylist(
    scheduleId: number,
    orgId: number,
    provider: SchedulePlaylistProviderId,
    options: { name?: string; isPublic?: boolean } = {},
  ): Promise<ISchedulePlaylistSyncResult> {
    try {
      return await this.postRequest(
        `/schedules/${scheduleId}/${provider}-playlist`,
        JSON.stringify({
          name: options.name,
          public: options.isPublic,
        }),
        {
          'content-type': 'application/json',
          Organization: orgId.toString(),
        },
      );
    } finally {
      // A failed creation may still have attached the (pending) playlist.
      void this.invalidateCache();
    }
  }

  /** Detaches the schedule's auto-generated playlist (it stays on the service). */
  public async removePlaylist(
    scheduleId: number,
    orgId: number,
    provider: SchedulePlaylistProviderId,
  ): Promise<void> {
    await this.deleteRequest(`/schedules/${scheduleId}/${provider}-playlist`, {
      Organization: orgId.toString(),
    });
    void this.invalidateCache();
  }
}
