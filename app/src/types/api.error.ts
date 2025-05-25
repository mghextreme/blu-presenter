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
