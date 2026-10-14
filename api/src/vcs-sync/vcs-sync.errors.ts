export class VcsSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VcsSyncError';
  }
}

export class VcsSyncAbortError extends VcsSyncError {
  constructor(
    message: string,
    readonly entryPath?: string,
  ) {
    super(message);
    this.name = 'VcsSyncAbortError';
  }
}
