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
  integrations: [sitemap({ filter: (page) => !page.includes('/og') && !page.includes('/hero-') })],
  fonts: [
    // Overused Grotesk (OFL, by RandomMaerks), subset to the characters the site uses,
    // weights 400–900 in one variable file. Display and body.
    {
      provider: fontProviders.local(),
      name: 'Overused Grotesk',
      cssVariable: '--font-display',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/OverusedGrotesk.woff2'],
            weight: '400 900',
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
