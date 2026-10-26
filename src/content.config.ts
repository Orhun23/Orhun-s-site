import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A point on an image, in % of its width/height (0–100).
const pt = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]);

const builds = defineCollection({
  loader: glob({ base: './src/content/builds', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      code: z.string(), // part-number style label, e.g. "B-01"
      order: z.number(),
      started: z.coerce.date(),
      finished: z.coerce.date().optional(), // omit = still going
      summary: z.string(), // one blunt line for the index
      cover: image().optional(), // text-only builds are fine
      // the inspection bench: which exploded line model to show, and the edge scan for the x-ray lens
      model: z.enum(['tallbike', 'helmet', 'xwing', 'printer']).optional(),
      xray: image().optional(),
      coverAlt: z.string().optional(),
      specs: z.array(z.tuple([z.string(), z.string()])),
      // drawn over the cover: dimension lines and leader callouts
      dimensions: z
        .array(z.object({ from: pt, to: pt, label: z.string(), side: z.enum(['left', 'right', 'top', 'bottom']).default('right') }))
        .default([]),
      callouts: z.array(z.object({ at: pt, label: z.string(), dir: z.enum(['left', 'right']).default('right') })).default([]),
      gallery: z
        .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional(), wide: z.boolean().default(false) }))
        .default([]),
      video: z.object({ src: z.string(), poster: image(), alt: z.string(), caption: z.string().optional() }).optional(),
    }),
});

export const collections = { builds };
