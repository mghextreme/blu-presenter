import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ReactNode } from "react";

import { ResetPasswordForm } from "../reset-password-form";

const resetPasswordMock = vi.fn();
const navigateMock = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/hooks/useServices", () => ({
  useServices: () => ({
    authService: { resetPassword: resetPasswordMock },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

const renderForm = (children: ReactNode) =>
  render(<MemoryRouter>{children}</MemoryRouter>);

const setHash = (hash: string) => {
  window.history.replaceState(null, "", `/reset-password${hash}`);
};

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setHash("");
  });

  it("shows the missing-token state when no recovery hash is present", () => {
    renderForm(<ResetPasswordForm />);
    expect(screen.getByText("resetPassword.missingToken")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("input.password")).not.toBeInTheDocument();
  });

  it("shows the missing-token state when the hash type is not 'recovery'", () => {
    setHash("#access_token=abc&type=magiclink");
    renderForm(<ResetPasswordForm />);
    expect(screen.getByText("resetPassword.missingToken")).toBeInTheDocument();
  });

  it("strips the access token from the URL on mount", () => {
    setHash("#access_token=abc&type=recovery");
    renderForm(<ResetPasswordForm />);
    expect(window.location.hash).toBe("");
  });

  it("submits the new password with the recovery token and redirects to /login", async () => {
    setHash("#access_token=recovery-jwt&type=recovery");
    resetPasswordMock.mockResolvedValueOnce(undefined);

    renderForm(<ResetPasswordForm />);

    await userEvent.type(screen.getByPlaceholderText("input.password"), "newSecret1");
    await userEvent.type(screen.getByPlaceholderText("input.confirmPassword"), "newSecret1");
    await userEvent.click(screen.getByRole("button", { name: "resetPassword.submit" }));

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith({
        accessToken: "recovery-jwt",
        newPassword: "newSecret1",
      });
    });

    expect(toastSuccess).toHaveBeenCalledWith("resetPassword.success");
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("blocks submission when passwords don't match", async () => {
    setHash("#access_token=recovery-jwt&type=recovery");

    renderForm(<ResetPasswordForm />);

    await userEvent.type(screen.getByPlaceholderText("input.password"), "newSecret1");
    await userEvent.type(screen.getByPlaceholderText("input.confirmPassword"), "different1");
    await userEvent.click(screen.getByRole("button", { name: "resetPassword.submit" }));

    await waitFor(() => {
      expect(resetPasswordMock).not.toHaveBeenCalled();
    });
  });
});
