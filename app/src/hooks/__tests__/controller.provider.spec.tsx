import { describe, it, expect, beforeEach, vi } from 'vite-plus/test';
import { act, render, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { ControllerProvider } from '../controller.provider';
import { useController } from '../useController';
import { ControllerState } from '../controller.store';
import { mockScheduleItems } from '@/test/mockData/scheduleItems';
import { STORAGE_KEYS } from '@/lib/storage-keys';

vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn(),
}));

vi.mock('../window.provider', () => ({
  WindowProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/controller/selector-screen', () => ({
  SelectorScreen: () => <div>SelectorScreen</div>,
}));

const providerWith =
  (storeState: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <ControllerProvider storeState={storeState}>{children}</ControllerProvider>
  );

const renderController = (storeState = false) =>
  renderHook(() => useController((s) => s), { wrapper: providerWith(storeState) });

describe('ControllerProvider', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('with stored state', () => {
    it('restores the schedule saved in localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.controllerSchedule, JSON.stringify([mockScheduleItems[0]]));

      const { result } = renderController(true);

      expect(result.current.schedule).toHaveLength(1);
    });

    it('falls back to the schedule saved in sessionStorage', () => {
      sessionStorage.setItem(
        STORAGE_KEYS.controllerSchedule,
        JSON.stringify([mockScheduleItems[0]]),
      );

      const { result } = renderController(true);

      expect(result.current.schedule).toHaveLength(1);
    });

    it('starts empty when the saved schedule is not valid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.controllerSchedule, 'invalid json');

      const { result } = renderController(true);

      expect(result.current.schedule).toEqual([]);
    });

    it('saves schedule and config changes', () => {
      const { result } = renderController(true);

      act(() => result.current.addToSchedule(mockScheduleItems[0]));
      act(() => result.current.setConfig({ autoAdvanceScheduleItem: true }));

      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.controllerSchedule)!)).toHaveLength(1);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.controllerConfig)!)).toEqual({
        autoAdvanceScheduleItem: true,
      });
    });
  });

  describe('without stored state', () => {
    it('neither reads nor writes browser storage', () => {
      localStorage.setItem(STORAGE_KEYS.controllerSchedule, JSON.stringify([mockScheduleItems[0]]));
      const { result } = renderController(false);

      expect(result.current.schedule).toEqual([]);

      act(() => result.current.replaceSchedule(mockScheduleItems));
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.controllerSchedule)!)).toHaveLength(1);
    });
  });

  it('gives each provider its own state', () => {
    const first = renderController();
    const second = renderController();

    act(() => first.result.current.replaceSchedule(mockScheduleItems));

    expect(first.result.current.schedule).toHaveLength(mockScheduleItems.length);
    expect(second.result.current.schedule).toEqual([]);
  });

  it('does not re-render components whose selected values did not change', () => {
    let scheduleLengthRenders = 0;
    let controller: ControllerState | undefined;

    const ScheduleLength = () => {
      scheduleLengthRenders++;
      return <span>{useController((s) => s.schedule.length)}</span>;
    };
    const Controls = () => {
      controller = useController((s) => s);
      return null;
    };

    render(
      <ControllerProvider>
        <ScheduleLength />
        <Controls />
      </ControllerProvider>,
    );
    act(() => controller!.replaceSchedule(mockScheduleItems));
    act(() => controller!.setScheduleItem(0));
    const rendersBeforeAdvancing = scheduleLengthRenders;
    const selectionBeforeAdvancing = controller!.selection;

    act(() => controller!.next());

    expect(controller!.selection).not.toEqual(selectionBeforeAdvancing);
    expect(scheduleLengthRenders).toBe(rendersBeforeAdvancing);
  });

  it('keeps the same selection object until the selection changes', () => {
    const { result } = renderController();
    act(() => result.current.replaceSchedule(mockScheduleItems));
    act(() => result.current.setScheduleItem(0));
    const selection = result.current.selection;

    act(() => result.current.addWindow({ id: 'w1', name: 'Window' } as never));
    expect(result.current.selection).toBe(selection);

    act(() => result.current.setSelection({ scheduleItem: 1, slide: 0, part: 0 }));
    expect(result.current.selection).not.toBe(selection);
    expect(result.current.selection.scheduleItem).toBe(1);
  });
});
