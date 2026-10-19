import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { render } from "@/test/test-utils";

import { EditOrganization } from "../index";

vi.mock("@/hooks/useServices", () => ({
  useServices: () => ({
    organizationsService: {},
    authService: {},
  }),
}));

const useAuthMock = vi.hoisted(() => {
  const fn: any = () => ({
    user: null,
    setOrganizationById: vi.fn(),
    organizations: [],
  });
  fn.getState = () => ({
    user: null,
    setOrganizationById: vi.fn(),
    organizations: [],
  });
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

const routerMocks = vi.hoisted(() => ({
  useLoaderData: vi.fn(() => undefined),
  useNavigate: vi.fn(() => vi.fn()),
  useRevalidator: vi.fn(() => ({ revalidate: vi.fn() })),
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useLoaderData: routerMocks.useLoaderData,
  useNavigate: routerMocks.useNavigate,
  useRevalidator: routerMocks.useRevalidator,
}));

describe("EditOrganization", () => {
  it("renders the creation form when no organization is loaded (add mode)", () => {
    // Regression test: the add route has no loader, so useLoaderData() returns
    // undefined. The component must not assume loaded data is present.
    render(
      <MemoryRouter>
        <EditOrganization edit={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText("input.name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "button.add" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "button.cancel" })).toBeInTheDocument();
  });
});
