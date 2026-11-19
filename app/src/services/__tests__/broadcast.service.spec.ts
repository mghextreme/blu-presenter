import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BroadcastService } from '../broadcast.service'

const callLog: string[] = []

type Deferred = { resolve: () => void };
describe('BroadcastService', () => {
  let service: BroadcastService
  let deferreds: Map<string, Deferred | undefined>

  beforeEach(() => {
    callLog.length = 0
    deferreds = new Map()
    service = new BroadcastService({} as never, { url: 'http://api.test' })
    // putRequest is protected — spy through the instance
    const putRequestSpy = vi.spyOn(service as never, 'putRequest') as any
    putRequestSpy.mockImplementation(async (path: unknown) => {
      const key = String(path)
      callLog.push(key)
      return await new Promise<void>((resolve) => {
        deferreds.set(key, { resolve })
      })
    })
  })

  it('serializes concurrent writes per channel order', async () => {
    // Fire two selection puts without awaiting: the payloads simulate rapid
    // part changes where the first request must land before the second.
    const first = service.setSelection(7, 3, { scheduleItem: 0, slide: 0, part: 1 })
    const second = service.setSelection(7, 3, { scheduleItem: 0, slide: 0, part: 2 })
    await Promise.resolve() // queue starts the first write in a microtask

    // Both requests are queued but only the first should have started
    expect(callLog).toEqual(['/sessions/7/broadcast/selection'])

    // The first PUT stalls; in the meantime the controller emits another
    // write (a schedule item change) — it must not jump the queue ahead of
    // the pending first selection either.
    const item = service.setScheduleItem(7, 3, { id: 1 })
    expect(callLog).toHaveLength(1)

    // Let everything settle: resolving the first write lets the queued
    // second write start (a few microtask layers later), which needs another
    // flush round. Macrotask boundaries let the whole chain drain.
    const settle = async () => {
      for (let i = 0; i < 25 && deferreds.size > 0; i++) {
        for (const [, deferred] of Array.from(deferreds)) deferred?.resolve()
        deferreds.clear()
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
    await settle()
    await Promise.allSettled([first, second, item])

    expect(callLog).toEqual([
      '/sessions/7/broadcast/selection',
      '/sessions/7/broadcast/selection',
      '/sessions/7/broadcast/schedule-item',
    ])
  })

  it('supersedes a queued write of the same state with the newest one', async () => {
    const first = service.setSelection(7, 3, { part: 1 })
    await Promise.resolve()
    // While the first PUT is in flight, three more selections arrive: only
    // the latest one still needs to be sent.
    const stale1 = service.setSelection(7, 3, { part: 2 })
    const stale2 = service.setSelection(7, 3, { part: 3 })
    const latest = service.setSelection(7, 3, { part: 4 })

    await expect(stale1).resolves.toBeUndefined()
    await expect(stale2).resolves.toBeUndefined()

    for (let i = 0; i < 25 && deferreds.size > 0; i++) {
      for (const [, deferred] of Array.from(deferreds)) deferred?.resolve()
      deferreds.clear()
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    await Promise.all([first, latest])

    expect(callLog).toEqual([
      '/sessions/7/broadcast/selection',
      '/sessions/7/broadcast/selection',
    ])
  })

  it('times out a stalled write so later writes still go out', async () => {
    vi.useFakeTimers()
    try {
      const stalled = service.setSelection(7, 3, { part: 1 })
      const next = service.setScheduleItem(7, 3, { id: 1 })
      stalled.catch(() => undefined)
      await vi.advanceTimersByTimeAsync(10_000)
      await expect(stalled).rejects.toThrow(/timed out/)
      expect(callLog).toEqual([
        '/sessions/7/broadcast/selection',
        '/sessions/7/broadcast/schedule-item',
      ])
      deferreds.get('/sessions/7/broadcast/schedule-item')?.resolve()
      await expect(next).resolves.toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('emits nothing offline', async () => {
    const onLine = navigator.onLine
    try {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      await service.setSelection(7, 3, { part: 1 })
      expect(callLog).toEqual([])
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: onLine, configurable: true })
    }
  })
})
