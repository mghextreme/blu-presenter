export class ApiError extends Error {
  public status: number;
  public message: string;
  public raw?: Response;

  constructor(
    status: number,
    message: string,
    raw?: Response,
  ) {
    super(message);
    this.status = status;
    this.message = message;
    this.raw = raw;
  }
}

export async function describeApiError(e: unknown): Promise<string> {
  try {
    const body = await (e as ApiError)?.raw?.json();
    return body?.message || (e as ApiError)?.message || '';
  } catch {
    return (e as ApiError)?.message || '';
  }
}
