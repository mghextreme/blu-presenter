import { useContext } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { ControllerStoreContext } from './controller.context';
import { ControllerState, ControllerStore } from './controller.store';

/**
 * Reads from the nearest ControllerProvider. The component re-renders only
 * when the selected values change (shallow comparison), so select just what
 * the component uses: `useController((s) => ({ next: s.next, mode: s.mode }))`.
 */
export function useController<T>(selector: (state: ControllerState) => T): T {
  return useStore(useControllerStore(), useShallow(selector));
}

function useControllerStore(): ControllerStore {
  const store = useContext(ControllerStoreContext);
  if (!store) throw new Error('useController must be used within a ControllerProvider');
  return store;
}
