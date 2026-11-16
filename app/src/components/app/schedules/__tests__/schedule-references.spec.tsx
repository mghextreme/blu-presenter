import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { render } from "@/test/test-utils";
import { ScheduleReferences } from "../schedule-references";

const useServicesMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useServices", () => ({
  useServices: useServicesMock,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const schedule = {
  id: 5,
  title: "Sunday",
  date: "2026-11-15",
  organization: { id: 3, name: "Org", role: "member" },
  references: [],
  items: [
    {
      type: "song",
      id: 10,
      title: "Song A",
      references: [{ url: "https://open.spotify.com/track/abc" }],
    },
  ],
};

describe("ScheduleReferences", () => {
  const syncSpotifyPlaylist = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    syncSpotifyPlaylist.mockResolvedValue({ action: "created", url: "u", added: 1, skipped: [] });
    useServicesMock.mockReturnValue({
      spotifyService: {
        getStatusQuery: () => ({
          queryKey: ["spotify", "status"],
          queryFn: async () => ({ connected: true }),
        }),
      },
      schedulesService: {
        syncSpotifyPlaylist,
        clearCache: vi.fn(),
        fetchById: vi.fn().mockResolvedValue(null),
      },
    });
  });

  const openCreateDialog = async () => {
    const user = userEvent.setup();
    render(<ScheduleReferences schedule={schedule as never} onSynced={vi.fn()} />);
    const createButton = await screen.findByRole("button", { name: "spotify.create" });
    await waitFor(() => expect(createButton).toBeEnabled());
    await user.click(createButton);
    return user;
  };

  it("creates a private playlist by default", async () => {
    const user = await openCreateDialog();

    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(screen.getByText("spotify.privateDescription")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "spotify.createConfirm" }));

    await waitFor(() => {
      expect(syncSpotifyPlaylist).toHaveBeenCalledWith(5, 3, {
        name: "Sunday — 2026-11-15",
        isPublic: false,
      });
    });
  });

  it("asks whether the playlist is public in the create dialog", async () => {
    const user = await openCreateDialog();

    await user.click(screen.getByRole("switch"));
    expect(screen.getByText("spotify.publicDescription")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "spotify.createConfirm" }));

    await waitFor(() => {
      expect(syncSpotifyPlaylist).toHaveBeenCalledWith(5, 3, {
        name: "Sunday — 2026-11-15",
        isPublic: true,
      });
    });
  });
});
