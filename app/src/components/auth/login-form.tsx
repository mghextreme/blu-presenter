"use client"

import * as React from "react";
import { Navigate } from "react-router-dom";

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialLogin } from "./social-login";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";

import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useToast } from "../ui/use-toast";

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {}

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm({ className, ...props }: LoginFormProps) {

  const { t } = useTranslation("auth");
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { isLoggedIn, signIn } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await signIn(values);
    } catch (e) {
      toast({
        title: t('signIn.error'),
        description: e?.message || '',
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
                  <Input type="email" placeholder={t('input.email')} autoComplete="email" autoCorrect="off" autoCapitalize="none" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
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

          <Button disabled={isLoading}>
            {isLoading && (
              <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
            )}
            {t('button.signIn')}
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
