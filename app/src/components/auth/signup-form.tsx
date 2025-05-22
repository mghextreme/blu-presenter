"use client"

import * as React from "react";
import { Link, Navigate } from "react-router-dom";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { SocialLogin } from "./social-login";
import { useTranslation } from "react-i18next";
import { useToast } from "../ui/use-toast";
import { useInvitation } from "@/hooks/invitation.provider";

interface SignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SignUpForm({ className, ...props }: SignUpFormProps) {

  const { t } = useTranslation("auth");
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { isLoggedIn, signUp } = useAuth();
  const { email: invitedEmail } = useInvitation();

  const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  }).superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: t('input.messages.passwordsDontMatch'),
        path: ['confirmPassword']
      });
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: invitedEmail || '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const emailRedirect = window.location.origin + '/app'
      setIsLoading(true);
      await signUp({
        ...values,
        options: {
          emailRedirectTo: emailRedirect,
        },
      });
    } catch (e) {
      toast({
        title: t('signUp.error'),
        description: t('errors.' + e?.message || 'default'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoggedIn) {
    return <Navigate to="/app" />;
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
                  <Input type="email" placeholder={t('input.email')} autoComplete="email" autoCorrect="off" autoCapitalize="none" disabled={isLoading || invitedEmail} {...field} />
                </FormControl>
                <FormMessage />
                {invitedEmail && (
                  <Link to="/signup"><Button variant="link" className="text-xs px-2 text-muted-foreground">{t('invitation.notYourEmail')}</Button></Link>
                )}
              </FormItem>
            )}></FormField>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="password" placeholder={t('input.password')} disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder={t('input.confirmPassword')} disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}></FormField>

          <Button disabled={isLoading}>
            {isLoading && (
              <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
            )}
            {t('button.signUpWithEmail')}
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {t('socials.continueWith')}
          </span>
        </div>
      </div>
      <SocialLogin isLoading={isLoading} />
    </div>
    
  )
}
