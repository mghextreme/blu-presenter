import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import tailwindPlugin from "./plugins/tailwind-config.js";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Docs | BluPresenter',
  tagline: 'Lyrics Made Easy',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://docs.blupresenter.com',
  baseUrl: '/',

  organizationName: 'mghextreme',
  projectName: 'blu-presenter',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt'],
    localeConfigs: {
      pt: {
        htmlLang: 'pt-BR',
      },
    }
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [tailwindPlugin],

  themeConfig: {
    // TODO: Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      // title: 'BluPresenter',
      logo: {
        alt: 'BluPresenter',
        src: 'img/blupresenter-logo.svg',
        srcDark: 'img/blupresenter-logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'documentationSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/mghextreme/blu-presenter',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'BluPresenter',
          items: [
            {
              label: 'Home',
              to: 'https://blupresenter.com',
            },
          ],
        },
        {
          title: 'Docs',
          items: [
            {
              label: 'Documentation',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/facebook/docusaurus',
            },
            {
              label: 'BuyMeACoffee',
              href: 'https://buymeacoffee.com/mghextreme',
            },
          ],
        },
      ],
      copyright: `Copyright © BluPresenter. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
