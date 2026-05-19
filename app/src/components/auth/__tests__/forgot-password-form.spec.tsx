import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ReactNode } from "react";

import { ForgotPasswordForm } from "../forgot-password-form";

const forgotPasswordMock = vi.fn();

vi.mock("@/hooks/useServices", () => ({
  useServices: () => ({
    authService: { forgotPassword: forgotPasswordMock },
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Captcha disabled in tests; the form skips the Turnstile block.
vi.mock("@/lib/config", () => ({
  captcha: { enabled: false, siteKey: "" },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "pt" },
  }),
}));

const renderForm = (children: ReactNode) =>
  render(<MemoryRouter>{children}</MemoryRouter>);

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the email with the current i18n language as locale", async () => {
    forgotPasswordMock.mockResolvedValueOnce(undefined);

    renderForm(<ForgotPasswordForm />);

    await userEvent.type(screen.getByPlaceholderText("input.email"), "u@example.com");
    await userEvent.click(screen.getByRole("button", { name: "forgotPassword.submit" }));

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith({
        email: "u@example.com",
        captchaToken: "",
      });
    });
  });

  it("shows the success state after submit regardless of backend result (anti-enumeration)", async () => {
    forgotPasswordMock.mockResolvedValueOnce(undefined);

    renderForm(<ForgotPasswordForm />);

    await userEvent.type(screen.getByPlaceholderText("input.email"), "u@example.com");
    await userEvent.click(screen.getByRole("button", { name: "forgotPassword.submit" }));

    expect(await screen.findByText("forgotPassword.successDescription")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("input.email")).not.toBeInTheDocument();
  });

  it("rejects invalid emails before submitting", async () => {
    renderForm(<ForgotPasswordForm />);

    await userEvent.type(screen.getByPlaceholderText("input.email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "forgotPassword.submit" }));

    await waitFor(() => {
      expect(forgotPasswordMock).not.toHaveBeenCalled();
    });
  });
});
