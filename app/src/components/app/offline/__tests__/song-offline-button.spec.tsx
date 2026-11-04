import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SongOfflineButton } from "../song-offline-button";

const useServicesMock = vi.hoisted(() => vi.fn());
const useDownloadedSongIdsMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useServices", () => ({
  useServices: useServicesMock,
}));

vi.mock("@/hooks/use-offline-downloads", () => ({
  useDownloadedSongIds: useDownloadedSongIdsMock,
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

const song = { id: 5, title: "Song 5" };

describe("SongOfflineButton", () => {
  it("shows an outline download button when not downloaded", () => {
    useServicesMock.mockReturnValue({
      offlineDownloadsService: { downloadSong: vi.fn().mockResolvedValue(undefined) },
    });
    useDownloadedSongIdsMock.mockReturnValue(new Set<number>());

    render(<SongOfflineButton song={song as any} />);

    const button = screen.getByTitle("actions.download");
    expect(button.tagName).toBe("BUTTON");
    // No text content: labels are title-only.
    expect(button.textContent).toBe("");
    expect(screen.queryByTitle("actions.remove")).toBeNull();
  });

  it("downloads on click", () => {
    const downloadSong = vi.fn().mockResolvedValue(undefined);
    useServicesMock.mockReturnValue({ offlineDownloadsService: { downloadSong } });
    useDownloadedSongIdsMock.mockReturnValue(new Set<number>());

    render(<SongOfflineButton song={song as any} />);
    fireEvent.click(screen.getByTitle("actions.download"));

    expect(downloadSong).toHaveBeenCalledWith(5);
    expect(toastMock.promise).toHaveBeenCalled();
  });

  it("shows a green filled button whose icon changes to X (remove) when downloaded", () => {
    const removeSong = vi.fn().mockResolvedValue(undefined);
    useServicesMock.mockReturnValue({ offlineDownloadsService: { removeSong } });
    useDownloadedSongIdsMock.mockReturnValue(new Set([5]));

    render(<SongOfflineButton song={song as any} />);

    const button = screen.getByTitle("actions.remove");
    // Green (success variant), no hover color change.
    expect(button.className).toContain("bg-green-700");
    // Download icon visible, X icon present but hidden until hover (CSS).
    expect(button.querySelector(".group-hover\\:hidden")).not.toBeNull();
    expect(button.querySelector(".hidden.group-hover\\:block")).not.toBeNull();
    expect(button.textContent).toBe("");
  });

  it("removes on click when downloaded", () => {
    const removeSong = vi.fn().mockResolvedValue(undefined);
    useServicesMock.mockReturnValue({ offlineDownloadsService: { removeSong } });
    useDownloadedSongIdsMock.mockReturnValue(new Set([5]));

    render(<SongOfflineButton song={song as any} />);
    fireEvent.click(screen.getByTitle("actions.remove"));

    expect(removeSong).toHaveBeenCalledWith(5);
    expect(toastMock.promise).toHaveBeenCalled();
  });
});
