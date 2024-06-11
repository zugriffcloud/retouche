import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-NZ',
  title: 'Retouche',
  description:
    'An experimental CMS for your Vite application. Annotate, Build, Edit.',
  head: [['link', { rel: 'icon', href: '/favicon.png' }]],
  themeConfig: {
    logo: {
      dark: '/zugriff-light.svg',
      light: '/zugriff-dark.svg',
    },
    externalLinkIcon: true,

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Examples',
        link: 'https://github.com/zugriffcloud/retouche/tree/main/examples/',
      },
      { text: 'Demo', link: '//cms.zugriff.app/?edit' },
      { text: 'zugriff', link: '//www.zugriff.eu' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [{ text: 'Get Started', link: '/get-started' }],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Adapters', link: '/adapters' },
          { text: 'Interactions', link: '/interactions' },
          { text: 'vite-plugin-retouche', link: '/vite-plugin-retouche' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zugriffcloud/retouche' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message:
        '<a href="//zugriff.eu/legal">Imprint</a> - <a href="//zugriff.eu/legal">Privacy Policy</a>',
    },
  },
});
