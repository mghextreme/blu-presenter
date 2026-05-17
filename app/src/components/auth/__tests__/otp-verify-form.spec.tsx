import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";

import { OtpVerifyForm } from "../otp-verify-form";

const verifySignInOtpMock = vi.fn();
const requestSignInOtpMock = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

const authState = vi.hoisted(() => ({ isLoggedIn: false }));
const invitationMock = vi.hoisted(() => ({
  current: {} as { id?: number; secret?: string; email?: string },
}));

vi.mock("@/hooks/useServices", () => ({
  useServices: () => ({
    authService: {
      verifySignInOtp: verifySignInOtpMock,
      requestSignInOtp: requestSignInOtpMock,
    },
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isLoggedIn: authState.isLoggedIn }),
}));

vi.mock("@/hooks/invitation.provider", () => ({
  useInvitation: () => invitationMock.current,
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "pt" },
  }),
}));

/**
 * Renders the form inside a MemoryRouter with the given location.state.
 * We use a route definition so `useLocation()` inside the form sees the
 * state we set on the initial entry.
 */
const renderWithState = (state: unknown, children: ReactNode = <OtpVerifyForm />) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/login/otp/verify", state }]}>
      <Routes>
        <Route path="/login/otp/verify" element={children} />
        <Route path="/login/otp" element={<div>otp-request-page</div>} />
        <Route path="/app" element={<div>app-page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("OtpVerifyForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isLoggedIn = false;
    invitationMock.current = {};
  });

  it("redirects to /login/otp when no email is in location.state", () => {
    renderWithState(null);
    expect(screen.getByText("otp-request-page")).toBeInTheDocument();
  });

  it("redirects to /app once the user is logged in", () => {
    authState.isLoggedIn = true;
    renderWithState({ email: "u@example.com" });
    expect(screen.getByText("app-page")).toBeInTheDocument();
  });

  it("auto-submits when 6 digits are entered and forwards email + token + locale", async () => {
    verifySignInOtpMock.mockResolvedValueOnce(undefined);

    renderWithState({ email: "u@example.com" });

    // input-otp renders a hidden input that absorbs keystrokes
    await userEvent.keyboard("123456");

    await waitFor(() => {
      expect(verifySignInOtpMock).toHaveBeenCalledWith({
        email: "u@example.com",
        token: "123456",
        locale: "pt",
      });
    });
  });

  it("includes invitation data when present", async () => {
    invitationMock.current = { id: 42, secret: "s3cr3t" };
    verifySignInOtpMock.mockResolvedValueOnce(undefined);

    renderWithState({ email: "u@example.com" });
    await userEvent.keyboard("123456");

    await waitFor(() => {
      expect(verifySignInOtpMock).toHaveBeenCalledWith({
        email: "u@example.com",
        token: "123456",
        invite: { id: 42, secret: "s3cr3t" },
        locale: "pt",
      });
    });
  });

  it("shows an error toast and clears the code on failure", async () => {
    verifySignInOtpMock.mockRejectedValueOnce({
      raw: { json: () => Promise.resolve({ message: "Invalid login credentials" }) },
    });

    renderWithState({ email: "u@example.com" });
    await userEvent.keyboard("000000");

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "otpSignIn.error",
        expect.objectContaining({ description: expect.any(String) }),
      );
    });
  });

  it("resend triggers requestSignInOtp with the same email + locale", async () => {
    requestSignInOtpMock.mockResolvedValueOnce(undefined);

    renderWithState({ email: "u@example.com" });

    await userEvent.click(screen.getByRole("button", { name: "otpSignIn.resend" }));

    await waitFor(() => {
      expect(requestSignInOtpMock).toHaveBeenCalledWith({
        email: "u@example.com",
        locale: "pt",
      });
    });
    expect(toastSuccess).toHaveBeenCalledWith("otpSignIn.resent");
  });
});
