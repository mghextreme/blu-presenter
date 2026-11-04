import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { PwaManager } from "../pwa-manager";

const useRegisterSWMock = vi.hoisted(() => vi.fn());
const usePwaInstallMock = vi.hoisted(() => vi.fn());

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: useRegisterSWMock,
}));

vi.mock("@/hooks/use-pwa-install", () => ({
  usePwaInstall: usePwaInstallMock,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

function mockState(options: { isStandalone: boolean; needRefresh: boolean }) {
  usePwaInstallMock.mockReturnValue({
    isStandalone: options.isStandalone,
    canInstall: false,
    promptInstall: vi.fn(),
  });
  useRegisterSWMock.mockReturnValue({
    needRefresh: options.needRefresh,
    offlineReady: false,
    updateServiceWorker: vi.fn(),
  });
}

describe("PwaManager", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("does not show the update banner in a regular browser tab (not installed)", () => {
    mockState({ isStandalone: false, needRefresh: true });

    render(<PwaManager />);

    expect(screen.queryByText("update.title")).toBeNull();
  });

  it("shows the update banner in the installed app when an update is waiting", () => {
    mockState({ isStandalone: true, needRefresh: true });

    render(<PwaManager />);

    expect(screen.getByText("update.title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "update.action" })).toBeInTheDocument();
  });

  it("does not show the banner when no update is waiting", () => {
    mockState({ isStandalone: true, needRefresh: false });

    render(<PwaManager />);

    expect(screen.queryByText("update.title")).toBeNull();
  });

  it("dismisses the banner for the rest of the session", () => {
    mockState({ isStandalone: true, needRefresh: true });

    const { unmount } = render(<PwaManager />);
    fireEvent.click(screen.getByRole("button", { name: "update.dismiss" }));
    unmount();

    expect(screen.queryByText("update.title")).toBeNull();
    expect(sessionStorage.getItem("pwa-update-dismissed")).toBe("1");

    // A fresh mount (e.g. route change) stays dismissed within the session.
    render(<PwaManager />);
    expect(screen.queryByText("update.title")).toBeNull();
  });
});
