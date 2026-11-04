import { create } from 'zustand'

export type ControllerPanel = 'plan' | 'schedule' | 'live'

interface ControllerPanelsState {
  /** Which controller panel is active (drives the mobile panel tabs). */
  activePanel: ControllerPanel
  /** Active tab inside the Plan panel. */
  planTab: string
  setActivePanel: (panel: ControllerPanel) => void
  setPlanTab: (tab: string) => void
  /** Opens the Plan panel on the configuration (broadcast settings) tab. */
  openBroadcastSettings: () => void
}

// Shared, non-persisted UI state for the controller panels. Lives outside the
// ControllerProvider context so controls in the navbar (e.g. the broadcast
// badge) can drive the panels rendered by the controller route.
export const useControllerPanels = create<ControllerPanelsState>()((set) => ({
  activePanel: 'plan',
  planTab: 'schedules',
  setActivePanel: (panel) => set({ activePanel: panel }),
  setPlanTab: (tab) => set({ planTab: tab }),
  openBroadcastSettings: () => set({ activePanel: 'plan', planTab: 'configuration' }),
}))
