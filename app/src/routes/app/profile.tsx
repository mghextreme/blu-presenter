/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

import { IProfile } from "@/types";
import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLoaderData } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function Profile() {

  const { t } = useTranslation("profile");
  const data = useLoaderData() as IProfile;

  const formSchema = z.object({
    email: z.string().email(),
    nickname: z.string().min(2),
    name: z.string().min(2).optional().or(z.literal('')),
  });

  const passwordChangeformSchema = z.object({
    currentPassword: z.string().min(8),
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

  const { usersService, authService } = useServices();

  if (!data) {
    throw new Error("Can't find user profile");
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: data.nickname ?? '',
      name: data.name ?? '',
      email: data.email ?? '',
    },
  });

  const passwordChangeForm = useForm<z.infer<typeof passwordChangeformSchema>>({
    resolver: zodResolver(passwordChangeformSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      usersService.update(values)
        .then(() => {
          toast.success(t('update.succeeded'));
        })
        .catch((e) => {
          toast.error(t('update.failed'), {
            description: e?.message || '',
          });
        })
    } finally {
      setLoading(false);
    }
  }

  const onChangePassword = async (values: z.infer<typeof passwordChangeformSchema>) => {
    try {
      setLoading(true);

      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.password,
      })

      toast.success(t('changePassword.succeeded'));
    } catch (e: any) {
      toast.error(t('changePassword.failed'), {
        description: e?.message || '',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">{t('update.title')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.email')}</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.nickname')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.name')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.update')}
            </Button>
            <Link to={'/app/profile'} reloadDocument={true}><Button className="flex-0" type="button" variant="secondary">{t('button.cancel')}</Button></Link>
          </div>
        </form>
      </Form>
      <h2 className="text-2xl mt-6 mb-4">{t('changePassword.title')}</h2>
      <Form {...passwordChangeForm}>
        <form onSubmit={passwordChangeForm.handleSubmit(onChangePassword)} className="max-w-lg space-y-3">
          <FormField
            control={passwordChangeForm.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.currentPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <FormField
            control={passwordChangeForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.newPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <FormField
            control={passwordChangeForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('input.confirmNewPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}></FormField>

          <div className="flex flex-row align-start space-x-2">
            <Button className="flex-0" type="submit" disabled={isLoading}>
              {isLoading && (
                <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
              )}
              {t('button.update')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
