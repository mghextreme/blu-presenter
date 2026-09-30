import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VcsClient, VcsHead, VcsTreeEntry } from './vcs-client.interface';

const API_BASE = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const MAX_ATTEMPTS = 4;
const RATE_LIMIT_MAX_WAIT_MS = 60_000;

export class GitHubClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubClientError';
  }
}

function parseRepo(repo: string): { owner: string; name: string } {
  const match = /^([^/\s]+)\/([^/\s]+)$/.exec(repo);
  if (!match) {
    throw new GitHubClientError(
      `Invalid repository "${repo}", expected the "owner/name" format`,
    );
  }
  return { owner: match[1], name: match[2] };
}

@Injectable()
export class GitHubClient implements VcsClient {
  private readonly logger = new Logger(GitHubClient.name);
  private readonly token: string | undefined;

  constructor(configService: ConfigService) {
    this.token =
      configService.get<string>('GITHUB_TOKEN') ?? process.env.GITHUB_TOKEN;
  }

  async resolveHead(repo: string, branch: string): Promise<VcsHead> {
    const { owner, name } = parseRepo(repo);
    const data = await this.request(
      `/repos/${owner}/${name}/branches/${encodeURIComponent(branch)}`,
    );
    const commitSha = data?.commit?.sha;
    const treeSha = data?.commit?.commit?.tree?.sha;
    if (typeof commitSha !== 'string' || typeof treeSha !== 'string') {
      throw new GitHubClientError(
        `Unexpected GitHub response resolving "${repo}" branch "${branch}"`,
      );
    }
    return { commitSha, treeSha };
  }

  async getTree(repo: string, treeSha: string): Promise<VcsTreeEntry[]> {
    const { owner, name } = parseRepo(repo);
    const data = await this.request(
      `/repos/${owner}/${name}/git/trees/${treeSha}?recursive=1`,
    );
    if (!Array.isArray(data?.tree)) {
      throw new GitHubClientError(
        `Unexpected GitHub response fetching tree ${treeSha}`,
      );
    }
    if (data.truncated === true) {
      throw new GitHubClientError(
        'GitHub returned a truncated tree (over 100k entries or 7MB). Reduce the source basePath or split the repository.',
      );
    }
    return data.tree
      .filter((entry: { type?: string }) => entry?.type === 'blob')
      .map((entry: { path: string; sha: string }) => ({
        path: entry.path,
        sha: entry.sha,
        type: 'blob',
      }));
  }

  async getBlob(repo: string, blobSha: string): Promise<Buffer> {
    const { owner, name } = parseRepo(repo);
    const data = await this.request(
      `/repos/${owner}/${name}/git/blobs/${blobSha}`,
    );
    if (typeof data?.content !== 'string') {
      throw new GitHubClientError(
        `Unexpected GitHub response fetching blob ${blobSha} (is the file larger than 1MB?)`,
      );
    }
    if (data.encoding === 'base64') {
      return Buffer.from(data.content.replace(/\n/g, ''), 'base64');
    }
    return Buffer.from(data.content, 'utf-8');
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request(path: string): Promise<any> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let response: Response;
      try {
        response = await fetch(`${API_BASE}${path}`, {
          headers: this.headers(),
        });
      } catch (error) {
        lastError = error as Error;
        if (attempt < MAX_ATTEMPTS) {
          await this.sleep(this.backoffMs(attempt));
          continue;
        }
        throw new GitHubClientError(
          `Network error requesting ${path}: ${(error as Error).message}`,
        );
      }

      if (response.ok) {
        return await response.json();
      }

      if (this.isRetryable(response) && attempt < MAX_ATTEMPTS) {
        const delay = this.retryDelayMs(response, attempt);
        this.logger.warn(
          `GitHub request failed with ${response.status}, retrying in ${Math.round(delay)}ms: ${path}`,
        );
        await this.sleep(delay);
        continue;
      }

      if (response.status === 404) {
        throw new GitHubClientError(
          `GitHub resource not found (404): ${path}. Check the repository, branch or token permissions.`,
        );
      }
      if (response.status === 401 || response.status === 403) {
        const body = await response.text();
        throw new GitHubClientError(
          `GitHub request unauthorized (${response.status}). Check GITHUB_TOKEN and its permissions. ${body.slice(0, 200)}`,
        );
      }
      const body = await response.text();
      throw new GitHubClientError(
        `GitHub request failed (${response.status}): ${body.slice(0, 200)}`,
      );
    }
    throw lastError ?? new GitHubClientError(`GitHub request failed: ${path}`);
  }

  private isRetryable(response: Response): boolean {
    if (response.status === 429) return true;
    if (response.status >= 500) return true;
    if (
      response.status === 403 &&
      response.headers.get('x-ratelimit-remaining') === '0'
    ) {
      return true;
    }
    return false;
  }

  private retryDelayMs(response: Response, attempt: number): number {
    const resetHeader = response.headers.get('x-ratelimit-reset');
    if (response.headers.get('x-ratelimit-remaining') === '0' && resetHeader) {
      const resetMs = parseInt(resetHeader, 10) * 1000 - Date.now();
      if (resetMs > 0) {
        return Math.min(resetMs + 1000, RATE_LIMIT_MAX_WAIT_MS);
      }
    }
    return this.backoffMs(attempt);
  }

  private backoffMs(attempt: number): number {
    return 500 * Math.pow(2, attempt - 1) + Math.random() * 250;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
