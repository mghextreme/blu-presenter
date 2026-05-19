"use client"

import { HTMLAttributes, useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useInvitation } from "@/hooks/invitation.provider";
import { useServices } from "@/hooks/useServices";
import { toast } from "sonner";
import { ApiError } from "@/types";

interface OtpVerifyFormProps extends HTMLAttributes<HTMLDivElement> {}

const OTP_LENGTH = 6;

export function OtpVerifyForm({ className, ...props }: OtpVerifyFormProps) {
  const { t, i18n } = useTranslation("auth");
  const { authService } = useServices();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { id, secret } = useInvitation();

  const email = (location.state as { email?: string } | null)?.email;

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // Prevents the auto-submit-on-complete from firing twice (once on input
  // completion, again if React re-renders the effect).
  const autoSubmittedRef = useRef(false);

  const submit = useCallback(
    async (token: string) => {
      if (!email || token.length !== OTP_LENGTH) {
        return;
      }

      try {
        setIsLoading(true);

        const inviteValues = id && secret ? { invite: { id, secret } } : {};

        await authService.verifySignInOtp({
          email,
          token,
          ...inviteValues,
        });

        // isLoggedIn flips true via useAuth; the <Navigate/> guard below
        // handles the redirect (consistent with LoginForm).
      } catch (e: unknown) {
        const error = e as ApiError;
        const errorContent = await error?.raw?.json().catch(() => null);
        toast.error(t("otpSignIn.error"), {
          description: t("errors." + (errorContent?.message ?? "Invalid login credentials")),
        });
        autoSubmittedRef.current = false;
        setCode("");
      } finally {
        setIsLoading(false);
      }
    },
    [authService, email, i18n.language, id, secret, t],
  );

  useEffect(() => {
    if (code.length === OTP_LENGTH && !autoSubmittedRef.current && !isLoading) {
      autoSubmittedRef.current = true;
      submit(code);
    }
  }, [code, isLoading, submit]);

  const onResend = async () => {
    if (!email) {
      return;
    }
    try {
      setIsResending(true);
      await authService.requestSignInOtp({ email });
      toast.success(t("otpSignIn.resent"));
    } catch (e: unknown) {
      const error = e as ApiError;
      const errorContent = await error?.raw?.json().catch(() => null);
      toast.error(t("otpSignIn.error"), {
        description: t("errors." + (errorContent?.message ?? "default")),
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/app" />;
  }

  if (!email) {
    return <Navigate to="/login/otp" replace />;
  }

  return (
    <div className={cn("grid gap-6 justify-items-center", className)} {...props}>
      <InputOTP
        maxLength={OTP_LENGTH}
        value={code}
        onChange={setCode}
        disabled={isLoading}
        autoFocus
        onComplete={(value) => {
          // Belt-and-suspenders: input-otp's own complete callback also triggers submit.
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            submit(value);
          }
        }}
      >
        <InputOTPGroup>
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <Button
        type="button"
        className="w-full"
        disabled={isLoading || code.length !== OTP_LENGTH}
        onClick={() => {
          autoSubmittedRef.current = true;
          submit(code);
        }}
      >
        {isLoading && <ArrowPathIcon className="size-4 me-2 animate-spin" />}
        {t("otpSignIn.verifySubmit")}
      </Button>

      <div className="flex flex-col items-center gap-1 text-sm">
        <Button
          type="button"
          variant="link"
          className="text-muted-foreground"
          disabled={isResending || isLoading}
          onClick={onResend}
        >
          {isResending && <ArrowPathIcon className="size-4 me-2 animate-spin" />}
          {t("otpSignIn.resend")}
        </Button>
        <Button variant="link" className="text-muted-foreground" asChild>
          <Link
            to="/login/otp"
            // Re-navigate fresh so location.state is cleared and the user
            // can change their email cleanly.
            state={null}
          >
            {t("otpSignIn.changeEmail")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
