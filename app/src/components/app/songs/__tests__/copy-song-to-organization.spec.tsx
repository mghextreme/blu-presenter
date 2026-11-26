import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/test-utils";

import { CopySongToOrganization } from "../copy-song-to-organization";

const authState = vi.hoisted(() => ({ organizations: [] as any[] }));
const songsService = vi.hoisted(() => ({ copyToOrganization: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/hooks/useServices", () => ({ useServices: () => ({ songsService }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

describe("CopySongToOrganization", () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  beforeEach(() => {
    vi.clearAllMocks();
    authState.organizations = [
      { id: 1, name: "Source", role: "owner" },
      { id: 3, name: "Guest only", role: "guest" },
      { id: 4, name: "Target", role: "member" },
    ];
  });

  const copyToTarget = async () => {
    render(<CopySongToOrganization songId={9} title="My song" sourceOrgId={1} />);
    await user.click(screen.getByTitle("actions.copyToOrganization"));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Target" }));
    await user.click(screen.getByText("button.confirm"));
  };

  it("copies the song to the selected organization", async () => {
    songsService.copyToOrganization.mockResolvedValue(undefined);

    await copyToTarget();

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("message.copyToOrganization.success"));
    expect(songsService.copyToOrganization).toHaveBeenCalledWith(9, 4, 1);
  });

  it("shows the error message when the copy fails", async () => {
    songsService.copyToOrganization.mockRejectedValue(new Error("Copy failed"));

    await copyToTarget();

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("error.copyToOrganization", { description: "Copy failed" }),
    );
  });
});
