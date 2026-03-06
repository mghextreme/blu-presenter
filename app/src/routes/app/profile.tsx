/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

import { IProfile } from "@/types";
import { IUserIdentitiesResponse } from "@/types/auth";
import { useServices } from "@/hooks/useServices";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLoaderData } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { GoogleIcon } from "@/components/logos/google";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function Profile() {

  const { t } = useTranslation("profile");
  const loaderData = useLoaderData() as {
    profile: IProfile;
    identities: IUserIdentitiesResponse;
  };

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

  const setPasswordFormSchema = z.object({
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

  if (!loaderData?.profile) {
    throw new Error("Can't find user profile");
  }

  const [isLoading, setLoading] = useState<boolean>(false);
  const [identitiesData, setIdentitiesData] = useState<IUserIdentitiesResponse>(loaderData.identities);

  const googleIdentity = identitiesData.identities.find(i => i.provider === 'google');
  const hasPassword = identitiesData.hasPassword;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: loaderData.profile.nickname ?? '',
      name: loaderData.profile.name ?? '',
      email: loaderData.profile.email ?? '',
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

  const setPasswordForm = useForm<z.infer<typeof setPasswordFormSchema>>({
    resolver: zodResolver(setPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
      .finally(() => {
        setLoading(false);
      });
  }

  const onChangePassword = async (values: z.infer<typeof passwordChangeformSchema>) => {
    setLoading(true);

    authService.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.password,
    })
      .then(() => {
        toast.success(t('changePassword.succeeded'));
        passwordChangeForm.reset();
      })
      .catch((e) => {
        toast.error(t('changePassword.failed'), {
          description: e?.message || '',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const onSetPassword = async (values: z.infer<typeof setPasswordFormSchema>) => {
    setLoading(true);

    authService.setPassword({
      newPassword: values.password,
    })
      .then(async () => {
        toast.success(t('setPassword.succeeded'));
        setPasswordForm.reset();
        const updated = await authService.getIdentities();
        setIdentitiesData(updated);
      })
      .catch((e) => {
        toast.error(t('setPassword.failed'), {
          description: e?.message || '',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const onConnectGoogle = async () => {
    try {
      setLoading(true);
      const redirectData = await authService.linkIdentity('google');
      localStorage.setItem('link-identity-code-verifier', redirectData.codeVerifier);

      setTimeout(() => {
        window.open(redirectData.url, '_self');
      }, 500);
    }
    catch (e: any) {
      toast.error(t('connectedAccounts.connectFailed'), {
        description: e?.message || '',
      });
      setLoading(false);
    }
  }

  const onDisconnectGoogle = async () => {
    if (!googleIdentity) return;

    setLoading(true);

    authService.unlinkIdentity(googleIdentity.identityId)
      .then(async () => {
        toast.success(t('connectedAccounts.disconnected'));
        const updated = await authService.getIdentities();
        setIdentitiesData(updated);
      })
      .catch((e) => {
        toast.error(t('connectedAccounts.disconnectFailed'), {
          description: e?.message || '',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="p-2 sm:p-8">
      <title>{t('title') + ' - BluPresenter'}</title>
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
            <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app/profile'} reloadDocument={true}>{t('button.cancel')}</Link></Button>
          </div>
        </form>
      </Form>

      <h2 className="text-2xl mt-6 mb-4">{t('connectedAccounts.title')}</h2>
      <div className="max-w-lg space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <GoogleIcon className="size-5" />
            <div>
              <p className="font-medium">Google</p>
              {googleIdentity?.email && (
                <p className="text-sm text-muted-foreground">{googleIdentity.email}</p>
              )}
            </div>
          </div>
          {googleIdentity ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  {t('connectedAccounts.disconnect')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('connectedAccounts.confirmDisconnect.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('connectedAccounts.confirmDisconnect.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('connectedAccounts.confirmDisconnect.cancel')}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onDisconnectGoogle}>
                    {t('connectedAccounts.confirmDisconnect.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" size="sm" disabled={isLoading} onClick={onConnectGoogle}>
              {isLoading && (
                <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
              )}
              {t('connectedAccounts.connect')}
            </Button>
          )}
        </div>
      </div>

      {hasPassword ? (
        <>
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
        </>
      ) : (
        <>
          <h2 className="text-2xl mt-6 mb-4">{t('setPassword.title')}</h2>
          <Form {...setPasswordForm}>
            <form onSubmit={setPasswordForm.handleSubmit(onSetPassword)} className="max-w-lg space-y-3">
              <FormField
                control={setPasswordForm.control}
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
                control={setPasswordForm.control}
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
        </>
      )}
    </div>
  );
}
