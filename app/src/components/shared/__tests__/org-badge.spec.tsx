import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@/test/test-utils";

import { OrgBadge } from "../org-badge";

const useAuthMock = vi.hoisted(() => ({
  current: {
    organizations: [
      { id: 1, name: "Org One" },
      { id: 2, name: "Org Two" },
    ],
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => useAuthMock.current,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

describe("OrgBadge", () => {
  it("renders the organization name for a known organization", () => {
    render(<OrgBadge organization={{ id: 1, name: "Org One" }} />);

    expect(screen.getByText("Org One")).toBeInTheDocument();
  });

  it("renders a colored badge based on the organization index in the user's organizations", () => {
    const { container } = render(<OrgBadge organization={{ id: 2, name: "Org Two" }} />);

    // Index 1 maps to badge color-1 (blue) in the shared color palette.
    expect(container.querySelector(".bg-blue-900")).not.toBeNull();
  });

  it("renders a neutral badge for organizations the user does not belong to", () => {
    const { container } = render(<OrgBadge organization={{ id: 99, name: "Other Org" }} />);

    expect(screen.getByText("Other Org")).toBeInTheDocument();
    expect(container.querySelector(".bg-blue-900")).toBeNull();
  });

  it("renders the public archive badge for a null organization", () => {
    render(<OrgBadge organization={null} />);

    expect(screen.getByText("publicArchive")).toBeInTheDocument();
  });

  it("renders the public archive badge for an organization without an id", () => {
    render(<OrgBadge organization={{ role: undefined }} />);

    expect(screen.getByText("publicArchive")).toBeInTheDocument();
  });

  it("renders nothing when no organization info is available", () => {
    const { container } = render(<OrgBadge organization={undefined} />);

    expect(container.querySelector("[data-slot=badge]")).toBeNull();
  });
});
