import { describe, it, expect, vi } from 'vite-plus/test';
import { act, render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

const createBrowserRouter = vi.hoisted(() => vi.fn(() => ({})));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  createBrowserRouter,
}));

vi.mock('react-router/dom', () => ({
  RouterProvider: () => null,
}));

import { AppRouter } from '../router';

describe('AppRouter', () => {
  it('creates the router once, even when the language changes', async () => {
    const i18n = i18next.createInstance();
    await i18n
      .use(initReactI18next)
      .init({ lng: 'en', resources: { en: { translation: {} }, pt: { translation: {} } } });

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <AppRouter />
      </I18nextProvider>,
    );
    await act(async () => {
      await i18n.changeLanguage('pt');
    });
    rerender(
      <I18nextProvider i18n={i18n}>
        <AppRouter />
      </I18nextProvider>,
    );

    expect(document.documentElement.lang).toBe('pt');
    expect(createBrowserRouter).toHaveBeenCalledTimes(1);
  });
});
