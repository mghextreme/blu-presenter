import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ScheduleOfflineButton } from "../schedule-offline-button";

const useServicesMock = vi.hoisted(() => vi.fn());
const useDownloadedScheduleIdsMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useServices", () => ({
  useServices: useServicesMock,
}));

vi.mock("@/hooks/use-offline-downloads", () => ({
  useDownloadedScheduleIds: useDownloadedScheduleIdsMock,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

const toastMock = vi.hoisted(() => ({
  promise: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const schedule = { id: 100, title: "Sunday", items: [] };

describe("ScheduleOfflineButton", () => {
  it("shows an outline download button when not downloaded", () => {
    useServicesMock.mockReturnValue({
      offlineDownloadsService: { downloadSchedule: vi.fn().mockResolvedValue(undefined) },
    });
    useDownloadedScheduleIdsMock.mockReturnValue(new Set<number>());

    render(<ScheduleOfflineButton schedule={schedule as any} />);

    expect(screen.getByTitle("actions.download")).toBeInTheDocument();
    expect(screen.queryByTitle("actions.remove")).toBeNull();
  });

  it("downloads on click", () => {
    const downloadSchedule = vi.fn().mockResolvedValue(undefined);
    useServicesMock.mockReturnValue({ offlineDownloadsService: { downloadSchedule } });
    useDownloadedScheduleIdsMock.mockReturnValue(new Set<number>());

    render(<ScheduleOfflineButton schedule={schedule as any} />);
    fireEvent.click(screen.getByTitle("actions.download"));

    expect(downloadSchedule).toHaveBeenCalledWith(100);
    expect(toastMock.promise).toHaveBeenCalled();
  });

  it("shows a green filled button with remove affordance when downloaded", () => {
    const removeSchedule = vi.fn().mockResolvedValue(undefined);
    useServicesMock.mockReturnValue({ offlineDownloadsService: { removeSchedule } });
    useDownloadedScheduleIdsMock.mockReturnValue(new Set([100]));

    render(<ScheduleOfflineButton schedule={schedule as any} />);

    const button = screen.getByTitle("actions.remove");
    expect(button.className).toContain("bg-green-700");
    expect(button.querySelector(".hidden.group-hover\\:block")).not.toBeNull();
    expect(button.textContent).toBe("");
  });

  it("removes on click when downloaded", () => {
    const removeSchedule = vi.fn().mockResolvedValue(undefined);
    useServicesMock.mockReturnValue({ offlineDownloadsService: { removeSchedule } });
    useDownloadedScheduleIdsMock.mockReturnValue(new Set([100]));

    render(<ScheduleOfflineButton schedule={schedule as any} />);
    fireEvent.click(screen.getByTitle("actions.remove"));

    expect(removeSchedule).toHaveBeenCalledWith(100);
    expect(toastMock.promise).toHaveBeenCalled();
  });
});
