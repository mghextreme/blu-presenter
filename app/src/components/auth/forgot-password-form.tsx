"use client"

import { HTMLAttributes, useState } from "react";
import { Link } from "react-router-dom";
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
import { useServices } from "@/hooks/useServices";
import { toast } from "sonner";
import { ApiError } from "@/types";

import { captcha } from "@/lib/config";

interface ForgotPasswordFormProps extends HTMLAttributes<HTMLDivElement> {}

const formSchema = z.object({
  email: z.string().email(),
});

export function ForgotPasswordForm({ className, ...props }: ForgotPasswordFormProps) {
  const { t } = useTranslation("auth");
  const { authService } = useServices();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (captcha.enabled && !captchaToken) {
        toast.error(t("errors.captcha verification process failed"));
        return;
      }

      setIsLoading(true);

      await authService.forgotPassword({
        email: values.email,
        captchaToken,
      });

      // Anti-enumeration: always show the success state regardless of result.
      setSubmitted(true);
    } catch (e: unknown) {
      const error = e as ApiError;
      const errorContent = await error?.raw?.json().catch(() => null);
      toast.error(t("forgotPassword.title"), {
        description: t("errors." + (errorContent?.message ?? "default")),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn("grid gap-4 text-center", className)} {...props}>
        <h2 className="text-lg font-semibold">{t("forgotPassword.successTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("forgotPassword.successDescription")}</p>
        <Button variant="link" asChild>
          <Link to="/login">{t("forgotPassword.backToLogin")}</Link>
        </Button>
      </div>
    );
  }

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
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
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
            {t("forgotPassword.submit")}
          </Button>
        </form>
      </Form>

      <Button variant="link" asChild>
        <Link to="/login">{t("forgotPassword.backToLogin")}</Link>
      </Button>
    </div>
  );
}
