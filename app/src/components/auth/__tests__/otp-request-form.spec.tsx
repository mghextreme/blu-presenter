import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ReactNode } from "react";

import { OtpRequestForm } from "../otp-request-form";

const requestSignInOtpMock = vi.fn();
const navigateMock = vi.fn();

const invitationMock = vi.hoisted(() => ({
  current: {} as { id?: number; secret?: string; email?: string },
}));

vi.mock("@/hooks/useServices", () => ({
  useServices: () => ({
    authService: { requestSignInOtp: requestSignInOtpMock },
  }),
}));

vi.mock("@/hooks/invitation.provider", () => ({
  useInvitation: () => invitationMock.current,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/config", () => ({
  captcha: { enabled: false, siteKey: "" },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "pt" },
  }),
}));

const renderForm = (children: ReactNode) =>
  render(<MemoryRouter>{children}</MemoryRouter>);

describe("OtpRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invitationMock.current = {};
  });

  it("requests an OTP and navigates to the verify step with the email in state", async () => {
    requestSignInOtpMock.mockResolvedValueOnce(undefined);

    renderForm(<OtpRequestForm />);

    await userEvent.type(screen.getByPlaceholderText("input.email"), "u@example.com");
    await userEvent.click(screen.getByRole("button", { name: "otpSignIn.requestSubmit" }));

    await waitFor(() => {
      expect(requestSignInOtpMock).toHaveBeenCalledWith({
        email: "u@example.com",
        captchaToken: "",
      });
    });

    expect(navigateMock).toHaveBeenCalledWith("/login/otp/verify", {
      state: { email: "u@example.com" },
    });
  });

  it("includes invitation data when present and pre-fills the email", async () => {
    invitationMock.current = { id: 42, secret: "s3cr3t", email: "invited@example.com" };
    requestSignInOtpMock.mockResolvedValueOnce(undefined);

    renderForm(<OtpRequestForm />);

    const emailInput = screen.getByPlaceholderText("input.email") as HTMLInputElement;
    expect(emailInput.value).toBe("invited@example.com");
    expect(emailInput).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "otpSignIn.requestSubmit" }));

    await waitFor(() => {
      expect(requestSignInOtpMock).toHaveBeenCalledWith({
        email: "invited@example.com",
        invite: { id: 42, secret: "s3cr3t" },
        captchaToken: "",
      });
    });
  });

  it("rejects invalid emails", async () => {
    renderForm(<OtpRequestForm />);

    await userEvent.type(screen.getByPlaceholderText("input.email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "otpSignIn.requestSubmit" }));

    await waitFor(() => {
      expect(requestSignInOtpMock).not.toHaveBeenCalled();
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
