"use client"

import * as React from "react";
import { Navigate } from "react-router-dom";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/auth.provider";

import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { SocialLogin } from "./social-login";

interface SignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {}

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function SignUpForm({ className, ...props }: SignUpFormProps) {

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { isLoggedIn, signUp } = useAuth();

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
      signUp({
        ...values,
        options: {
          emailRedirectTo: window.location.origin + '/app',
        },
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
                  <Input type="email" placeholder="Email" autoComplete="email" autoCorrect="off" autoCapitalize="none" disabled={isLoading} {...field} />
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
                  <Input type="password" placeholder="Password" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <Button disabled={isLoading}>
            {isLoading && (
              <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
            )}
            Sign up with Email
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <SocialLogin isLoading={isLoading} />
    </div>
    
  )
}
