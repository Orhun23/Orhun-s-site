// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Swap this for the real domain once it's connected in Vercel.
const SITE = process.env.SITE_URL ?? 'https://orhun-site.vercel.app';

export default defineConfig({
  site: SITE,
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !page.includes('/og') })],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-display',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/BricolageGrotesque.woff2'],
            weight: '200 800',
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
