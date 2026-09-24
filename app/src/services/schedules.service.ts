import { ApiService } from "./api.service";
import { ISchedule } from "@/types"

export class SchedulesService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['schedules'] });
  }

  public async search(payload: {
    query?: string;
    organizations?: number[];
    page?: number;
    itemsPerPage?: number;
  }): Promise<ISchedule[]> {
    return await this.postRequest('/schedules/search', JSON.stringify(payload), {
      'content-type': 'application/json',
    }) as ISchedule[];
  }

  public async getById(scheduleId: number, secret?: string, force = false): Promise<ISchedule | null> {
    const hasSecret = secret && secret.length > 0;
    const secretParam = hasSecret ? `?secret=${secret}` : '';
    const queryKey = ['schedules', 'id', scheduleId, hasSecret ? secret : null];

    if (force) {
      this.queryClient.removeQueries({ queryKey });
    }

    return await this.getOrFetch({
      queryKey,
      queryFn: async () => await this.getRequest(`/schedules/${scheduleId}${secretParam}`) as ISchedule,
    });
  }

  /** Fetches a schedule from the API, bypassing and then updating the cache. */
  public async fetchById(scheduleId: number, secret?: string): Promise<ISchedule | null> {
    return this.getById(scheduleId, secret, true);
  }

  public async add(value: Partial<ISchedule>, orgId: number): Promise<ISchedule | null> {
    const response = await this.postRequest('/schedules', JSON.stringify(value), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    }) as ISchedule;
    this.clearCache();
    return response;
  }

  public async update(id: number, value: Partial<ISchedule>, orgId: number): Promise<ISchedule | null> {
    const response = await this.putRequest(`/schedules/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    }) as ISchedule;
    this.clearCache();
    return response;
  }

  public async delete(scheduleId: number, orgId: number): Promise<void> {
    await this.deleteRequest(`/schedules/${scheduleId}`, {
      'Organization': orgId.toString(),
    });
    this.clearCache();
  }

}
