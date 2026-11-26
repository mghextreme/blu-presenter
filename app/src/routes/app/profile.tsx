import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useIsMutating, useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useServices } from "@/hooks/useServices";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PageContent } from "@/components/shared/page-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { GoogleConnection } from "@/components/app/profile/google-connection";
import { SpotifyConnection } from "@/components/app/profile/spotify-connection";

export function Profile() {

  const { t } = useTranslation("profile");

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
  const { data: profile } = useSuspenseQuery(usersService.getProfileQuery());
  const { data: identities } = useSuspenseQuery(authService.identitiesQuery());

  if (!profile) {
    throw new Error("Can't find user profile");
  }

  // Any write on the page (including connecting accounts) blocks the forms.
  const isMutating = useIsMutating() > 0;

  const hasPassword = identities.hasPassword;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: profile.nickname ?? '',
      name: profile.name ?? '',
      email: profile.email ?? '',
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

  const updateProfile = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => usersService.update(values),
    onSuccess: () => {
      toast.success(t('update.succeeded'));
    },
    onError: (e) => {
      toast.error(t('update.failed'), {
        description: e?.message || '',
      });
    },
  });

  const changePassword = useMutation({
    mutationFn: (values: z.infer<typeof passwordChangeformSchema>) => authService.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.password,
    }),
    onSuccess: () => {
      toast.success(t('changePassword.succeeded'));
      passwordChangeForm.reset();
    },
    onError: (e) => {
      toast.error(t('changePassword.failed'), {
        description: e?.message || '',
      });
    },
  });

  const setPassword = useMutation({
    mutationFn: (values: z.infer<typeof setPasswordFormSchema>) => authService.setPassword({
      newPassword: values.password,
    }),
    onSuccess: () => {
      toast.success(t('setPassword.succeeded'));
      setPasswordForm.reset();
    },
    onError: (e) => {
      toast.error(t('setPassword.failed'), {
        description: e?.message || '',
      });
    },
  });

  return (
    <PageContent>
      <title>{t('title') + ' - BluPresenter'}</title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => updateProfile.mutate(values))} className="max-w-lg space-y-3">
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
            <Button className="flex-0" type="submit" disabled={isMutating}>
              {updateProfile.isPending && (
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
        <GoogleConnection identities={identities} />

        <SpotifyConnection identities={identities} />
      </div>

      {hasPassword ? (
        <>
          <h2 className="text-2xl mt-6 mb-4">{t('changePassword.title')}</h2>
          <Form {...passwordChangeForm}>
            <form onSubmit={passwordChangeForm.handleSubmit((values) => changePassword.mutate(values))} className="max-w-lg space-y-3">
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
                <Button className="flex-0" type="submit" disabled={isMutating}>
                  {changePassword.isPending && (
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
            <form onSubmit={setPasswordForm.handleSubmit((values) => setPassword.mutate(values))} className="max-w-lg space-y-3">
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
                <Button className="flex-0" type="submit" disabled={isMutating}>
                  {setPassword.isPending && (
                    <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                  )}
                  {t('button.update')}
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </PageContent>
  );
}
