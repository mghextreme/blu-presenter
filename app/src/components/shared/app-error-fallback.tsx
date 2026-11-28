import type { FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/**
 * Shown when something outside the routes fails (providers, the router
 * itself). Routes have their own `errorElement`; this renders above the
 * router, so it cannot use router links.
 */
export function AppErrorFallback({ error }: FallbackProps) {
  const { t } = useTranslation('errors');

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-card p-4">
      <div className="flex w-full min-w-0 max-w-md flex-col space-y-6">
        <div>
          <h1 className="text-5xl mb-3">{t('title')}</h1>
          <p className="text-2xl">{t('message')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>{t('actions.reload')}</Button>
          <Button variant="outline" asChild>
            <a href="/">{t('actions.home')}</a>
          </Button>
        </div>
        {error instanceof Error && (
          <div>
            <h4 className="text-md mb-1">{t('details')}</h4>
            <div className="text-sm text-muted-foreground">
              {error.message}
              <pre className="overflow-x-auto">{error.stack}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
