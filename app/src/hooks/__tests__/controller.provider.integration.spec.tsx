import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import ControllerProvider, { ControllerProviderContext } from '../controller.provider'
import {
  mockScheduleItems,
} from '@/test/mockData/scheduleItems'
import { IWindow } from '@/types'

// Mock react-hotkeys-hook
vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn(),
}))

// Mock WindowProvider
vi.mock('../window.provider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock SelectorScreen
vi.mock('@/components/controller/selector-screen', () => ({
  default: () => <div>SelectorScreen</div>,
}))

// Test component that uses the controller context
const TestConsumer = ({
  onRender,
}: {
  onRender?: (context: any) => void
}) => {
  const context = useContext(ControllerProviderContext)

  if (onRender) {
    onRender(context)
  }

  return (
    <div>
      <div data-testid="mode">{context.mode}</div>
      <div data-testid="schedule-length">{context.schedule.length}</div>
      <div data-testid="schedule-item-title">
        {context.scheduleItem?.title || 'none'}
      </div>
      <div data-testid="windows-count">{context.windows.length}</div>
      <button onClick={() => context.addToSchedule(mockScheduleItems[0])}>
        Add Item
      </button>
      <button onClick={() => context.replaceSchedule(mockScheduleItems)}>
        Replace Schedule
      </button>
      <button onClick={() => context.setScheduleItem(0)}>
        Set First Item
      </button>
      <button onClick={() => context.next()}>Next</button>
      <button onClick={() => context.previous()}>Previous</button>
      <button onClick={() => context.setBlank()}>Set Blank</button>
      <button onClick={() => context.setLogo()}>Set Logo</button>
      <button onClick={() => context.clearOverrideSlide()}>
        Clear Override
      </button>
      <button
        onClick={() =>
          context.addWindow({ id: 'test-window', name: 'Test' } as IWindow)
        }
      >
        Add Window
      </button>
      <button onClick={() => context.closeWindow('test-window')}>
        Close Window
      </button>
      <button onClick={() => context.setMode('slide')}>Set Slide Mode</button>
      <button onClick={() => context.removeFromSchedule(0)}>
        Remove First
      </button>
      <button onClick={() => context.removeAllFromSchedule()}>
        Clear Schedule
      </button>
    </div>
  )
}

describe('ControllerProvider Integration Tests', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Schedule Management', () => {
    it('should add items to schedule', async () => {
      const user = userEvent.setup()
      const { getByText, getByTestId } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      expect(getByTestId('schedule-length')).toHaveTextContent('0')

      const addButton = getByText('Add Item')
      await user.click(addButton)

      await waitFor(() => {
        expect(getByTestId('schedule-length')).toHaveTextContent('1')
      })
    })

    it('should replace schedule', async () => {
      const user = userEvent.setup()
      const { getByText, getByTestId } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      const replaceButton = getByText('Replace Schedule')
      await user.click(replaceButton)

      await waitFor(() => {
        expect(getByTestId('schedule-length')).toHaveTextContent(
          mockScheduleItems.length.toString()
        )
      })
    })

    it('should remove item from schedule', async () => {
      const user = userEvent.setup()
      const { getByText, getByTestId } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      // First add items
      await user.click(getByText('Replace Schedule'))

      await waitFor(() => {
        expect(getByTestId('schedule-length')).toHaveTextContent('3')
      })

      // Then remove first item
      await user.click(getByText('Remove First'))

      await waitFor(() => {
        expect(getByTestId('schedule-length')).toHaveTextContent('2')
      })
    })

    it('should clear all items from schedule', async () => {
      const user = userEvent.setup()
      const { getByText, getByTestId } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      // First add items
      await user.click(getByText('Replace Schedule'))

      await waitFor(() => {
        expect(getByTestId('schedule-length')).toHaveTextContent('3')
      })

      // Then clear all
      await user.click(getByText('Clear Schedule'))

      await waitFor(() => {
        expect(getByTestId('schedule-length')).toHaveTextContent('0')
      })
    })
  })

  describe('Schedule Item Selection', () => {
    it('should set schedule item', async () => {
      const user = userEvent.setup()
      const { getByText, getByTestId } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      // First add items
      await user.click(getByText('Replace Schedule'))

      await waitFor(() => {
        expect(getByTestId('schedule-length')).toHaveTextContent('3')
      })

      // Then select first item
      await user.click(getByText('Set First Item'))

      await waitFor(() => {
        expect(getByTestId('schedule-item-title')).toHaveTextContent(
          mockScheduleItems[0].title || ''
        )
      })
    })
  })

  describe('Mode Management', () => {
    it('should switch modes', async () => {
      const user = userEvent.setup()
      const { getByText, getByTestId } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      expect(getByTestId('mode')).toHaveTextContent('part')

      await user.click(getByText('Set Slide Mode'))

      await waitFor(() => {
        expect(getByTestId('mode')).toHaveTextContent('slide')
      })
    })
  })

  describe('Override Slides', () => {
    it('should set blank slide', async () => {
      const user = userEvent.setup()
      let capturedContext: any = null

      const { getByText } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer
            onRender={(context) => {
              capturedContext = context
            }}
          />
        </ControllerProvider>
      )

      await user.click(getByText('Set Blank'))

      await waitFor(() => {
        expect(capturedContext?.overrideSlide).toBeDefined()
        expect(capturedContext?.overrideSlide?.id).toBe('blank')
      })
    })

    it('should set logo slide', async () => {
      const user = userEvent.setup()
      let capturedContext: any = null

      const { getByText } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer
            onRender={(context) => {
              capturedContext = context
            }}
          />
        </ControllerProvider>
      )

      await user.click(getByText('Set Logo'))

      await waitFor(() => {
        expect(capturedContext?.overrideSlide).toBeDefined()
        expect(capturedContext?.overrideSlide?.id).toBe('logo')
      })
    })

    it('should clear override slide', async () => {
      const user = userEvent.setup()
      let capturedContext: any = null

      const { getByText } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer
            onRender={(context) => {
              capturedContext = context
            }}
          />
        </ControllerProvider>
      )

      // First set blank
      await user.click(getByText('Set Blank'))

      await waitFor(() => {
        expect(capturedContext?.overrideSlide).toBeDefined()
      })

      // Then clear
      await user.click(getByText('Clear Override'))

      await waitFor(() => {
        expect(capturedContext?.overrideSlide).toBeUndefined()
      })
    })
  })

  describe('Window Management', () => {
    it('should add and remove windows', async () => {
      const user = userEvent.setup()
      const { getByText, getByTestId } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      expect(getByTestId('windows-count')).toHaveTextContent('0')

      await user.click(getByText('Add Window'))

      await waitFor(() => {
        expect(getByTestId('windows-count')).toHaveTextContent('1')
      })

      await user.click(getByText('Close Window'))

      await waitFor(() => {
        expect(getByTestId('windows-count')).toHaveTextContent('0')
      })
    })
  })

  describe('State Persistence', () => {
    it('should persist schedule to sessionStorage', async () => {
      const user = userEvent.setup()
      const { getByText } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      await user.click(getByText('Replace Schedule'))

      await waitFor(() => {
        const saved = sessionStorage.getItem('controllerSchedule')
        expect(saved).toBeTruthy()
        const parsed = JSON.parse(saved!)
        expect(parsed).toHaveLength(mockScheduleItems.length)
      })
    })

    it('should persist schedule to localStorage when storeState is true', async () => {
      const user = userEvent.setup()
      const { getByText } = render(
        <ControllerProvider storeState={true}>
          <TestConsumer />
        </ControllerProvider>
      )

      await user.click(getByText('Replace Schedule'))

      await waitFor(() => {
        const saved = localStorage.getItem('controllerSchedule')
        expect(saved).toBeTruthy()
        const parsed = JSON.parse(saved!)
        expect(parsed).toHaveLength(mockScheduleItems.length)
      })
    })

    it('should not persist to localStorage when storeState is false', async () => {
      const user = userEvent.setup()
      const { getByText } = render(
        <ControllerProvider storeState={false}>
          <TestConsumer />
        </ControllerProvider>
      )

      await user.click(getByText('Replace Schedule'))

      await waitFor(() => {
        const sessionSaved = sessionStorage.getItem('controllerSchedule')
        expect(sessionSaved).toBeTruthy()

        const localSaved = localStorage.getItem('controllerSchedule')
        expect(localSaved).toBeNull()
      })
    })
  })
})

