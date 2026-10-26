// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Swap this for the real domain once it's connected in Vercel.
const SITE = process.env.SITE_URL ?? 'https://orhun-site.vercel.app';

export default defineConfig({
  site: SITE,
  devToolbar: { enabled: false },
  // small site, one CSS bundle: inlining removes a render-blocking request
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (page) => !page.includes('/og') })],
  fonts: [
    // Bricolage Grotesque, split into two optical sizes and subset (see README → Fonts):
    // the display cut is what the hero headline needs first, so only that one is preloaded.
    {
      provider: fontProviders.local(),
      name: 'Bricolage Display',
      cssVariable: '--font-display',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/BricolageDisplay.woff2'],
            weight: '400 800',
            stretch: '90% 100%',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Bricolage Text',
      cssVariable: '--font-text',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/BricolageText.woff2'],
            weight: '400 800',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      fallbacks: ['Consolas', 'monospace'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/JetBrainsMono.woff2'],
            weight: '100 800',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
});
