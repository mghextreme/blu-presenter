import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act, useContext } from 'react'
import { ControllerProvider, ControllerProviderContext } from '../controller.provider'
import { BroadcastProvider } from '../broadcast.provider'
import { mockScheduleItems } from '@/test/mockData/scheduleItems'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useAuth } from '../useAuth'
import { IScheduleSong, ISlideTextContent } from '@/types'

const broadcastMocks = {
  setSchedule: vi.fn().mockResolvedValue(undefined),
  setScheduleItem: vi.fn().mockResolvedValue(undefined),
  setSelection: vi.fn().mockResolvedValue(undefined),
}

vi.mock('../useServices', () => ({
  useServices: () => ({
    broadcastService: broadcastMocks,
  }),
}))

const TestConsumer = () => {
  const context = useContext(ControllerProviderContext)
  const multiPartItem: IScheduleSong = {
    ...mockScheduleItems[0],
    id: 99,
    title: 'Multi-part song',
    slides: [
      {
        id: 's0',
        content: [
          { type: 'lyrics', text: 'part 0' } as ISlideTextContent,
          { type: 'lyrics', text: 'part 1' } as ISlideTextContent,
          { type: 'lyrics', text: 'part 2' } as ISlideTextContent,
        ],
      },
    ],
  }
  return (
    <div>
      <button onClick={() => context.addToSchedule(structuredClone(multiPartItem))}>Add Item</button>
      <button onClick={() => context.setScheduleItem(0)}>Set First Item</button>
      <button onClick={() => context.setSelection({ scheduleItem: 0, slide: 0, part: 2 })}>Select Part 2</button>
    </div>
  )
}

describe('BroadcastProvider (REST write path)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
    // REST auth is read from the auth store (zustand) by ApiService
    useAuth.setState({
      isLoggedIn: true,
      user: { id: 1, name: 'E2E' } as never,
      session: { access_token: 'token123', refresh_token: 'r' } as never,
    })
  })

  it('does not write without a broadcast session', async () => {
    render(
      <ControllerProvider storeState={false}>
        <BroadcastProvider>
          <TestConsumer />
        </BroadcastProvider>
      </ControllerProvider>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByText('Add Item'))
    await user.click(screen.getByText('Set First Item'))
    await user.click(screen.getByText('Select Part 2'))

    await waitFor(() => {
      expect(broadcastMocks.setSchedule).not.toHaveBeenCalled()
      expect(broadcastMocks.setSelection).not.toHaveBeenCalled()
    })
  })

  it('seeds the restored schedule on load without clearing the live item/part', async () => {
    sessionStorage.setItem(
      STORAGE_KEYS.broadcastSession,
      JSON.stringify({ id: 7, orgId: 3, secret: 's3cr3t' }),
    )

    const { getByText } = render(
      <ControllerProvider storeState={false}>
        <BroadcastProvider>
          <TestConsumer />
        </BroadcastProvider>
      </ControllerProvider>,
    )

    // Load push happens with the initial (empty) controller state
    await act(async () => { await Promise.resolve() })
    expect(broadcastMocks.setSchedule).toHaveBeenCalledWith(7, 3, [])
    expect(broadcastMocks.setScheduleItem).not.toHaveBeenCalled()
    expect(broadcastMocks.setSelection).not.toHaveBeenCalled()

    broadcastMocks.setSchedule.mockClear()

    // User-driven changes broadcast right away
    const user = userEvent.setup()
    await user.click(getByText('Add Item'))
    await waitFor(() => {
      expect(broadcastMocks.setSchedule).toHaveBeenCalledWith(
        7,
        3,
        expect.arrayContaining([expect.objectContaining({ id: 99 })]),
      )
    })
  })

  it('broadcasts item and part-only selection changes', async () => {
    sessionStorage.setItem(
      STORAGE_KEYS.broadcastSession,
      JSON.stringify({ id: 7, orgId: 3, secret: 's3cr3t' }),
    )

    const { getByText } = render(
      <ControllerProvider storeState={false}>
        <BroadcastProvider>
          <TestConsumer />
        </BroadcastProvider>
      </ControllerProvider>,
    )
    // Clear the load-time writes
    await act(async () => { await Promise.resolve() })
    broadcastMocks.setSchedule.mockClear()
    broadcastMocks.setScheduleItem.mockClear()
    broadcastMocks.setSelection.mockClear()

    const user = userEvent.setup()
    await user.click(getByText('Add Item'))

    // Selecting an item explicitly schedules the item broadcast
    await user.click(getByText('Set First Item'))
    await waitFor(() => {
      expect(broadcastMocks.setScheduleItem).toHaveBeenCalledWith(
        7,
        3,
        expect.objectContaining({ id: 99, uniqueId: expect.any(String) }),
      )
    })

    // Changing only the part must carry the schedule item index
    await user.click(getByText('Select Part 2'))
    await waitFor(() => {
      expect(broadcastMocks.setSelection).toHaveBeenCalledWith(
        7,
        3,
        expect.objectContaining({ scheduleItem: 0, slide: 0, part: 2 }),
      )
    })
  })
})
