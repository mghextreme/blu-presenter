import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ApiService } from '../api.service'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/types'

class TestService extends ApiService {
  get(path: string) {
    return this.getRequest(path)
  }
}

const session = { access_token: 'old-access', refresh_token: 'old-refresh' }
const newSession = { access_token: 'new-access', refresh_token: 'new-refresh' }

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('ApiService session refresh', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  const service = () => new TestService({} as never, { url: 'http://api.test' })

  beforeEach(() => {
    useAuth.setState({ isLoggedIn: true, user: { id: 'u' } as never, session: session as never })
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const refreshCalls = () =>
    fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))

  it('refreshes on 401 and retries with the new token', async () => {
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return json(201, { user: { id: 'u' }, session: newSession })
      const auth = (init.headers as Record<string, string>)['Authorization']
      return auth === 'Bearer new-access' ? json(200, { ok: true }) : json(401)
    })

    await expect(service().get('/songs')).resolves.toEqual({ ok: true })
    expect(refreshCalls()).toHaveLength(1)
    expect(useAuth.getState().session).toEqual(newSession)
  })

  it('does not refresh on 403', async () => {
    fetchMock.mockResolvedValue(json(403))

    await expect(service().get('/songs')).rejects.toMatchObject({ status: 403 })
    expect(refreshCalls()).toHaveLength(0)
    expect(useAuth.getState().isLoggedIn).toBe(true)
  })

  it.each([500, 503, 429])('keeps the session when the refresh fails with %i', async (status) => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/auth/refresh') ? json(status) : json(401),
    )

    await expect(service().get('/songs')).rejects.toBeInstanceOf(ApiError)
    expect(useAuth.getState().isLoggedIn).toBe(true)
    expect(useAuth.getState().session).toEqual(session)
  })

  it('keeps the session when the refresh fails with a network error', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/auth/refresh')) throw new TypeError('Failed to fetch')
      return json(401)
    })

    await expect(service().get('/songs')).rejects.toBeInstanceOf(TypeError)
    expect(useAuth.getState().isLoggedIn).toBe(true)
  })

  it.each([400, 401, 403])('signs out when the refresh token is rejected with %i', async (status) => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/auth/refresh') ? json(status) : json(401),
    )

    await expect(service().get('/songs')).rejects.toMatchObject({ status: 401 })
    expect(useAuth.getState().isLoggedIn).toBe(false)
    expect(useAuth.getState().session).toBeNull()
  })

  it('shares one refresh across service instances', async () => {
    let resolveRefresh: (r: Response) => void = () => {}
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        return await new Promise<Response>((resolve) => { resolveRefresh = resolve })
      }
      const auth = (init.headers as Record<string, string>)['Authorization']
      return auth === 'Bearer new-access' ? json(200, { ok: true }) : json(401)
    })

    const a = service().get('/songs')
    const b = service().get('/themes')
    await vi.waitFor(() => expect(refreshCalls()).toHaveLength(1))
    resolveRefresh(json(201, { user: { id: 'u' }, session: newSession }))

    await expect(Promise.all([a, b])).resolves.toEqual([{ ok: true }, { ok: true }])
    expect(refreshCalls()).toHaveLength(1)
  })
})
