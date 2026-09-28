import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/test-utils";

import { OrganizationBar } from "../index";

const authState = vi.hoisted(() => ({
  organizations: [
    { id: 1, name: "Org One" },
    { id: 2, name: "Org Two" },
  ],
  setOrganizationById: vi.fn(),
}));

const useAuthMock = vi.hoisted(() => {
  const fn: any = () => authState;
  fn.getState = () => authState;
  return { current: fn };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock.current,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

describe("OrganizationBar", () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  beforeEach(() => {
    authState.setOrganizationById.mockClear();
  });

  it("renders a read-only label with a single organization", () => {
    render(
      <OrganizationBar organizations={[{ id: 1, name: "Org One" }]} subtitle="My subtitle">
        <button>action</button>
      </OrganizationBar>,
    );

    expect(screen.getByText(/singular:/)).toBeInTheDocument();
    expect(screen.getByText("Org One")).toBeInTheDocument();
    expect(screen.getByText(/My subtitle/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "action" })).toBeInTheDocument();
  });

  it("renders a plural label when showing multiple organizations", () => {
    render(
      <OrganizationBar organizations={[{ id: 1, name: "Org One" }, null]} />,
    );

    expect(screen.getByText(/plural:/)).toBeInTheDocument();
    expect(screen.getByText("Org One, publicArchive")).toBeInTheDocument();
  });

  it("shows the selected organization in single-select mode and updates the last used org", async () => {
    const onOrganizationsChange = vi.fn();

    render(
      <OrganizationBar
        organizations={[{ id: 1, name: "Org One" }, { id: 2, name: "Org Two" }]}
        selected={[{ id: 1, name: "Org One" }]}
        editable
        onOrganizationsChange={onOrganizationsChange}
      />,
    );

    expect(screen.getByRole("button", { name: /Org One/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Org One/ }));
    await user.click(await screen.findByText("Org Two"));

    expect(onOrganizationsChange).toHaveBeenCalledWith([{ id: 2, name: "Org Two" }]);
    expect(authState.setOrganizationById).toHaveBeenCalledWith(2);
  });

  it("shows all organizations as placeholder in multi-select mode and forwards selections", async () => {
    const onOrganizationsChange = vi.fn();

    render(
      <OrganizationBar
        organizations={[{ id: 1, name: "Org One" }, { id: 2, name: "Org Two" }]}
        selected={[]}
        multiselect
        onOrganizationsChange={onOrganizationsChange}
      />,
    );

    expect(screen.getByText("all")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Org Two"));

    expect(onOrganizationsChange).toHaveBeenCalledWith([{ id: 2, name: "Org Two" }]);
  });

  it("maps the public archive option to a null organization", async () => {
    const onOrganizationsChange = vi.fn();

    render(
      <OrganizationBar
        organizations={[{ id: 1, name: "Org One" }, null]}
        selected={[]}
        multiselect
        onOrganizationsChange={onOrganizationsChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("publicArchive"));

    expect(onOrganizationsChange).toHaveBeenCalledWith([null]);
  });
});
