import { GatewayTimeoutException } from '@nestjs/common';
import { fetchWithTimeout } from '../fetch-with-timeout';

describe('fetchWithTimeout', () => {
  afterEach(() => jest.restoreAllMocks());

  /** A fetch that only settles when its signal aborts. */
  const hangingFetch = () =>
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener('abort', () =>
              reject(init.signal?.reason),
            ),
          ),
      );

  it('returns the response of a call that answers in time', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));

    const response = await fetchWithTimeout('https://api.example/x');

    expect(await response.text()).toBe('ok');
  });

  it('fails with a 504 naming the host when the call does not answer in time', async () => {
    hangingFetch();

    const error = await fetchWithTimeout('https://api.example/x', {}, 10).catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(GatewayTimeoutException);
    expect(error.message).toContain('api.example');
  });

  it("keeps the caller's own abort signal working", async () => {
    hangingFetch();
    const controller = new AbortController();

    const call = fetchWithTimeout('https://api.example/x', {
      signal: controller.signal,
    });
    controller.abort(new Error('cancelled'));

    await expect(call).rejects.toThrow('cancelled');
  });

  it('rethrows network errors unchanged', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));

    await expect(fetchWithTimeout('https://api.example/x')).rejects.toThrow(
      TypeError,
    );
  });
});
