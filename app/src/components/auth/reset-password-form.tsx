"use client"

import { HTMLAttributes, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

interface ResetPasswordFormProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Parses tokens placed by Supabase's implicit recovery flow into the URL hash
 * (e.g. `#access_token=...&refresh_token=...&type=recovery`). Returns the
 * `access_token` only when `type=recovery`, so non-recovery sessions can't
 * accidentally drive this form.
 */
function extractRecoveryAccessToken(hash: string): string | null {
  if (!hash || hash.length < 2) {
    return null;
  }
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("type") !== "recovery") {
    return null;
  }
  return params.get("access_token");
}

export function ResetPasswordForm({ className, ...props }: ResetPasswordFormProps) {
  const { t } = useTranslation("auth");
  const { authService } = useServices();
  const navigate = useNavigate();

  const accessToken = useMemo(
    () => extractRecoveryAccessToken(window.location.hash),
    [],
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Strip tokens from the URL so they don't linger in history/referrers.
    if (accessToken) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [accessToken]);

  const formSchema = z
    .object({
      password: z.string().min(8),
      confirmPassword: z.string().min(8),
    })
    .superRefine(({ confirmPassword, password }, ctx) => {
      if (confirmPassword !== password) {
        ctx.addIssue({
          code: "custom",
          message: t("input.messages.passwordsDontMatch"),
          path: ["confirmPassword"],
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!accessToken) {
      return;
    }

    try {
      setIsLoading(true);

      await authService.resetPassword({
        accessToken,
        newPassword: values.password,
      });

      toast.success(t("resetPassword.success"));
      navigate("/login");
    } catch (e: unknown) {
      const error = e as ApiError;
      const errorContent = await error?.raw?.json().catch(() => null);
      toast.error(t("resetPassword.error"), {
        description: t("errors." + (errorContent?.message ?? "default")),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <div className={cn("grid gap-4 text-center", className)} {...props}>
        <p className="text-sm text-muted-foreground">
          {t("resetPassword.missingToken")}
        </p>
        <Button variant="link" asChild>
          <Link to="/forgot-password">{t("forgotPassword.title")}</Link>
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("input.password")}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("input.confirmPassword")}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading && <ArrowPathIcon className="size-4 me-2 animate-spin" />}
            {t("resetPassword.submit")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
