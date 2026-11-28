import { generateKeyPairSync } from 'node:crypto';
import { JwksKeyStore } from '../jwks-key-store';

describe('JwksKeyStore', () => {
  const JWKS_URL = 'https://supabase.local/auth/v1/.well-known/jwks.json';
  const jwk = {
    ...generateKeyPairSync('ec', { namedCurve: 'P-256' }).publicKey.export({
      format: 'jwk',
    }),
    kid: 'key-1',
  };

  let now: number;
  let fetchMock: jest.SpyInstance;
  let store: JwksKeyStore;

  const jwksResponse = () =>
    new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });

  beforeEach(() => {
    now = 1_000_000;
    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jwksResponse());
    store = new JwksKeyStore(JWKS_URL, () => now);
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns a known key as PEM and serves it from cache', async () => {
    const first = await store.getPublicKey('key-1');
    now += 60_000;
    const second = await store.getPublicKey('key-1');

    expect(first).toContain('BEGIN PUBLIC KEY');
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not refetch for every unknown key id', async () => {
    await store.getPublicKey('key-1');

    expect(await store.getPublicKey('forged')).toBeNull();
    expect(await store.getPublicKey('forged')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refetches an unknown key id after the minimum interval (key rotation)', async () => {
    await store.getPublicKey('key-1');
    now += 31_000;

    await store.getPublicKey('rotated');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shares one fetch between concurrent callers', async () => {
    await Promise.all([
      store.getPublicKey('key-1'),
      store.getPublicKey('key-1'),
      store.getPublicKey('key-1'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps serving stale keys while the endpoint fails', async () => {
    const pem = await store.getPublicKey('key-1');
    now += 11 * 60_000;
    fetchMock.mockResolvedValue(new Response('down', { status: 503 }));

    expect(await store.getPublicKey('key-1')).toBe(pem);
  });
});
