"use client"

import { HTMLAttributes, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useInvitation } from "@/hooks/invitation.provider";
import { useServices } from "@/hooks/useServices";
import { toast } from "sonner";
import { ApiError } from "@/types";

import { captcha } from "@/lib/config";

interface OtpRequestFormProps extends HTMLAttributes<HTMLDivElement> {}

const formSchema = z.object({
  email: z.string().email(),
});

export function OtpRequestForm({ className, ...props }: OtpRequestFormProps) {
  const { t } = useTranslation("auth");
  const { authService } = useServices();
  const navigate = useNavigate();
  const { email: invitedEmail, id, secret } = useInvitation();

  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: invitedEmail || "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (captcha.enabled && !captchaToken) {
        toast.error(t("errors.captcha verification process failed"));
        return;
      }

      setIsLoading(true);

      const inviteValues = id && secret ? { invite: { id, secret } } : {};

      await authService.requestSignInOtp({
        email: values.email,
        ...inviteValues,
        captchaToken,
      });

      // Forward to verify step. Invitation context flows via AuthLayout/provider
      // (URL query string id/secret), so it is preserved without extra plumbing.
      navigate("/login/otp/verify", { state: { email: values.email } });
    } catch (e: unknown) {
      const error = e as ApiError;
      const errorContent = await error?.raw?.json().catch(() => null);
      toast.error(t("otpSignIn.error"), {
        description: t("errors." + (errorContent?.message ?? "default")),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-col-1 space-y-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("input.email")}
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    disabled={isLoading || !!invitedEmail}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {invitedEmail && (
                  <Button variant="link" className="text-xs px-2 text-muted-foreground" asChild>
                    <Link to="/login">{t("invitation.notYourEmail")}</Link>
                  </Button>
                )}
              </FormItem>
            )}
          />

          {captcha.enabled && (
            <Turnstile
              siteKey={captcha.siteKey}
              onSuccess={(token) => setCaptchaToken(token)}
            />
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading && <ArrowPathIcon className="size-4 me-2 animate-spin" />}
            {t("otpSignIn.requestSubmit")}
          </Button>
        </form>
      </Form>

      <Button variant="link" asChild>
        <Link to="/login">{t("signIn.withPassword")}</Link>
      </Button>
    </div>
  );
}
