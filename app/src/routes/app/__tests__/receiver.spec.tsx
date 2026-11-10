import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor, screen } from '@testing-library/react'
import { act, useContext } from 'react'
import { Receiver } from '../../app/receiver'
import { ControllerProvider, ControllerProviderContext } from '@/hooks/controller.provider'
import { createMockScheduleItem } from '@/test/mockData/scheduleItems'
import type { ISession } from '@/types'

vi.mock('i18next', () => ({
  default: { changeLanguage: vi.fn().mockResolvedValue(undefined) },
}))

// Slides need several content parts so selection.part stays in range
const makeMultiPartItem = (id: number, title: string) => ({
  ...createMockScheduleItem(id, title, 1),
  slides: [
    {
      id: `slide-${id}-0`,
      content: [
        { type: 'lyrics', text: `${title} part 0` },
        { type: 'lyrics', text: `${title} part 1` },
        { type: 'lyrics', text: `${title} part 2` },
      ],
    },
  ],
})

vi.mock('react-router-dom', () => ({
  useLoaderData: () => ({ session: loaderSession, themes: [] }),
  useParams: () => ({ orgId: '3', sessionId: '7', secret: 's3cr3t' }),
}))

const loaderSession = {
  id: 7,
  orgId: 3,
  schedule: [
    makeMultiPartItem(1, 'Amazing Grace'),
    makeMultiPartItem(2, 'How Great Thou Art'),
  ],
  // The controller was on item 0, slide 0, part 1 when the receiver reloads
  scheduleItem: makeMultiPartItem(1, 'Amazing Grace'),
  selection: { scheduleItem: 0, slide: 0, part: 1 },
  language: 'en',
} as unknown as ISession

const socketBuzz = vi.hoisted(() => ({
  config: null as any,
  driveJoinedSession: (data: unknown) => {
    socketBuzz.config?.onJoinedSession?.(data)
  },
}))

vi.mock('@/hooks/useSessionSocket', () => ({
  useSessionSocket: (config: any) => {
    socketBuzz.config = config
    return {
      connect: vi.fn(),
      socket: null,
      isConnected: false,
      reconnectAttempts: 0,
      joinSession: vi.fn(),
      leaveSession: vi.fn(),
      switchSession: vi.fn(),
      emit: vi.fn(),
    }
  },
}))

vi.mock('@/components/controller/selector-screen', () => ({
  SelectorScreen: () => <div data-testid="selector-screen" />,
}))

const Probe = ({ onValue }: { onValue: (context: any) => void }) => {
  const context = useContext(ControllerProviderContext)
  onValue(context)
  return null
}

describe('Receiver initial load', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
  })

  // This pins the regression where the part broadcast on initial load used to
  // be received only via socket streaming; when streaming is unavailable, the
  // loader data must place the receivers on the same part.
  it('restores schedule, item and part from loader data', async () => {
    let captured: any = null
    render(
      <ControllerProvider storeState={false}>
        <Receiver />
        <Probe onValue={(context) => { captured = context }} />
      </ControllerProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('selector-screen')).toBeInTheDocument()
    })

    // Schedule and item come from the loader
    await waitFor(() => {
      expect(captured.schedule).toHaveLength(2)
      expect(captured.scheduleItem?.title).toBe('Amazing Grace')
    })

    // Part must match the persisted selection (not reset to 0)
    await waitFor(() => {
      expect(captured.selection).toEqual({ scheduleItem: 0, slide: 0, part: 1 })
    })
  })

  it('applies part 0 selections exactly as sent', async () => {
    ;(loaderSession as any).selection = { scheduleItem: 0, slide: 0, part: 0 }

    let captured: any = null
    render(
      <ControllerProvider storeState={false}>
        <Receiver />
        <Probe onValue={(context) => { captured = context }} />
      </ControllerProvider>,
    )

    await waitFor(() => {
      expect(captured.selection).toEqual({ scheduleItem: 0, slide: 0, part: 0 })
    })
  })

  it('applies schedule, item and selection from a joined-session push', async () => {
    ;(loaderSession as any).selection = { scheduleItem: 0, slide: 0, part: 0 }

    let captured: any = null
    render(
      <ControllerProvider storeState={false}>
        <Receiver />
        <Probe onValue={(context) => { captured = context }} />
      </ControllerProvider>,
    )
    await waitFor(() => {
      expect(captured.schedule).toHaveLength(2)
    })

    const pushed = {
      schedule: [makeMultiPartItem(1, 'New Song'),
        makeMultiPartItem(2, 'Other Song')],
      scheduleItem: makeMultiPartItem(1, 'New Song'),
      selection: { scheduleItem: 1, slide: 0, part: 2 },
    }

    await act(async () => {
      socketBuzz.driveJoinedSession(pushed)
    })

    await waitFor(() => {
      expect(captured.schedule.map((i: any) => i.title)).toEqual(['New Song', 'Other Song'])
      // selection.scheduleItem = 1 → the second item becomes the active one
      expect(captured.scheduleItem?.title).toBe('Other Song')
      expect(captured.selection).toEqual({ scheduleItem: 1, slide: 0, part: 2 })
    })
  })
})