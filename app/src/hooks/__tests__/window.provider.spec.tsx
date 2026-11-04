import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { WindowProvider } from '../window.provider'

// Minimal fake for the popped-out window. Only the members used by
// WindowProvider are implemented.
const createFakeExternalWindow = () => ({
  document: {
    body: { appendChild: vi.fn() },
    head: { appendChild: vi.fn() },
  },
  closed: false,
  close: vi.fn(),
})

describe('WindowProvider', () => {
  let fakeExternalWindow: ReturnType<typeof createFakeExternalWindow>
  const openSpy = vi.spyOn(window, 'open')

  beforeEach(() => {
    vi.clearAllMocks()
    fakeExternalWindow = createFakeExternalWindow()
    openSpy.mockReturnValue(fakeExternalWindow as unknown as Window)
  })

  afterEach(() => {
    vi.useRealTimers()
    openSpy.mockReset()
  })

  it('renders children into the popped-out window', () => {
    let portalContainer: HTMLElement | undefined;
    fakeExternalWindow.document.body.appendChild = vi.fn((el: HTMLElement) => {
      portalContainer = el;
      return el;
    });

    render(
      <WindowProvider id="w1">
        <div>content</div>
      </WindowProvider>
    )

    expect(openSpy).toHaveBeenCalledWith('', 'w1', 'width=600,height=400,left=300,top=300')
    expect(portalContainer).toBeDefined()
    expect(portalContainer!.innerHTML).toContain('content')
  })

  it('calls onClose when the user closes the popped-out window', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    render(
      <WindowProvider id="w1" onClose={onClose}>
        <div>content</div>
      </WindowProvider>
    )

    // Window still open: no callback
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(onClose).not.toHaveBeenCalled()

    // User closes the popped-out window
    fakeExternalWindow.closed = true
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose again once notified', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    render(
      <WindowProvider id="w1" onClose={onClose}>
        <div>content</div>
      </WindowProvider>
    )

    fakeExternalWindow.closed = true
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes the popped-out window on unmount', () => {
    const { unmount } = render(
      <WindowProvider id="w1">
        <div>content</div>
      </WindowProvider>
    )

    unmount()
    expect(fakeExternalWindow.close).toHaveBeenCalled()
  })
})
