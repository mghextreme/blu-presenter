import { ApiService } from "./api.service";
import { ISchedule } from "@/types"

export class SchedulesService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['schedules'] });
  }

  public async getAll(): Promise<ISchedule[]> {
    return await this.getOrFetch({
      queryKey: ['schedules', 'all'],
      queryFn: async () => await this.getRequest('/schedules') as ISchedule[],
    });
  }

  public async getById(scheduleId: number): Promise<ISchedule | null> {
    return await this.getOrFetch({
      queryKey: ['schedules', 'id', scheduleId],
      queryFn: async () => await this.getRequest(`/schedules/${scheduleId}`) as ISchedule,
    });
  }

  public async add(value: Partial<ISchedule>): Promise<ISchedule | null> {
    const response = await this.postRequest('/schedules', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ISchedule;
    this.clearCache();
    return response;
  }

  public async update(id: number, value: Partial<ISchedule>): Promise<ISchedule | null> {
    const response = await this.putRequest(`/schedules/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ISchedule;
    this.clearCache();
    return response;
  }

  public async delete(scheduleId: number): Promise<void> {
    await this.deleteRequest(`/schedules/${scheduleId}`);
    this.clearCache();
  }

}
