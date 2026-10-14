import { GitHubClient, GitHubClientError } from '../github.client';

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  const headerMap = new Map(Object.entries(headers));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('GitHubClient', () => {
  let client: GitHubClient;
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  beforeEach(() => {
    fetchMock.mockReset();
    client = new GitHubClient({
      get: jest.fn().mockReturnValue('test-token'),
    } as never);
  });

  it('resolves the branch head to commit and tree SHAs', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        commit: { sha: 'commit1', commit: { tree: { sha: 'tree1' } } },
      }),
    );

    const head = await client.resolveHead('owner/songs', 'main');

    expect(head).toEqual({ commitSha: 'commit1', treeSha: 'tree1' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/owner/songs/branches/main');
    expect(options.headers.Authorization).toBe('Bearer test-token');
  });

  it('returns only blob entries from the tree', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        truncated: false,
        tree: [
          { path: 'songs', type: 'tree', sha: 'x' },
          { path: 'songs/en/song.md', type: 'blob', sha: 'blob1' },
        ],
      }),
    );

    const tree = await client.getTree('owner/songs', 'tree1');

    expect(tree).toEqual([
      { path: 'songs/en/song.md', sha: 'blob1', type: 'blob' },
    ]);
  });

  it('throws a clear error when the tree is truncated', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ truncated: true, tree: [] }),
    );

    await expect(client.getTree('owner/songs', 'tree1')).rejects.toThrow(
      GitHubClientError,
    );
  });

  it('decodes base64 blobs', async () => {
    const content = Buffer.from('---\nschemaVersion: 1\n---\n', 'utf-8');
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ content: content.toString('base64'), encoding: 'base64' }),
    );

    const blob = await client.getBlob('owner/songs', 'blob1');

    expect(blob.toString('utf-8')).toBe('---\nschemaVersion: 1\n---\n');
  });

  it('throws a descriptive error for 404s', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Not Found' }, 404));

    await expect(client.resolveHead('owner/missing', 'nope')).rejects.toThrow(
      /not found \(404\)/,
    );
  });

  it('throws a descriptive error for unauthorized requests', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Bad credentials' }, 401),
    );

    await expect(client.resolveHead('owner/songs', 'main')).rejects.toThrow(
      GitHubClientError,
    );
  });

  it('retries rate-limited requests and succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ message: 'rate limited' }, 429, {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) - 1),
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          commit: { sha: 'c', commit: { tree: { sha: 't' } } },
        }),
      );

    const head = await client.resolveHead('owner/songs', 'main');

    expect(head.commitSha).toBe('c');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
