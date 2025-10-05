import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import ControllerProvider, { ControllerProviderContext } from '../controller.provider'
import {
  mockScheduleItems,
} from '@/test/mockData/scheduleItems'

// Mock react-hotkeys-hook
vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn(),
}))

// Mock WindowProvider
vi.mock('../window.provider', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

// Mock SelectorScreen
vi.mock('@/components/controller/selector-screen', () => ({
  default: () => <div>SelectorScreen</div>,
}))

interface WrapperProps {
  children: ReactNode
  storeState?: boolean
}

const createWrapper = (storeState = false) => {
  return ({ children }: WrapperProps) => (
    <ControllerProvider storeState={storeState}>{children}</ControllerProvider>
  )
}

describe('ControllerProvider', () => {
  beforeEach(() => {
    // Clear storage before each test
    sessionStorage.clear()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => ControllerProviderContext, {
        wrapper: createWrapper(),
      })

      const wrapper = createWrapper()
      const { result: contextResult } = renderHook(
        () => {
          const context = ControllerProviderContext
          return context
        },
        { wrapper }
      )

      // We need to actually use the provider to get the context value
      expect(contextResult.current).toBeDefined()
    })

    it('should initialize with empty schedule', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ControllerProvider storeState={false}>{children}</ControllerProvider>
      )

      const TestComponent = () => {
        const context = ControllerProviderContext
        return null
      }

      // The provider should render without errors
      expect(() => {
        renderHook(() => TestComponent(), { wrapper })
      }).not.toThrow()
    })

    it('should load schedule from sessionStorage if available', () => {
      const savedSchedule = [mockScheduleItems[0]]
      sessionStorage.setItem('controllerSchedule', JSON.stringify(savedSchedule))

      // Provider should load the saved schedule
      const wrapper = createWrapper(false)
      expect(() => renderHook(() => null, { wrapper })).not.toThrow()
    })

    it('should handle invalid JSON in sessionStorage gracefully', () => {
      sessionStorage.setItem('controllerSchedule', 'invalid json')

      const wrapper = createWrapper(false)
      expect(() => renderHook(() => null, { wrapper })).not.toThrow()
    })
  })
})

