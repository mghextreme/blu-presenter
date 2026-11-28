import { describe, expect, it, vi } from 'vite-plus/test';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';
import { AppErrorFallback } from '../app-error-fallback';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function Crash(): never {
  throw new Error('provider exploded');
}

describe('AppErrorFallback', () => {
  it('replaces a crashed app with the error and a way out', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary FallbackComponent={AppErrorFallback}>
        <Crash />
      </ErrorBoundary>,
    );

    expect(screen.getByText('title')).toBeTruthy();
    expect(screen.getAllByText(/provider exploded/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'actions.reload' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'actions.home' }).getAttribute('href')).toBe('/');
  });
});
