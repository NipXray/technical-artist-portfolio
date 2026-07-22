import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const CLICK_EFFECTS = [
  'none',
  'leaf',
  'smoke',
  'converge',
  'slash',
  'skull',
  'glass',
  'explosion',
  'bubble',
  'wind',
  'sparkle'
] as const;

const AMBIENT_EFFECTS = ['none', 'smoke', 'embers', 'dust', 'snow', 'fireflies'] as const;

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    cover: z.string(),
    gallery: z.array(z.string()).default([]),
    video: z.string().optional(),
    model: z.string().optional(),
    clickEffect: z.enum(CLICK_EFFECTS).default('none'),
    ambientEffect: z.enum(AMBIENT_EFFECTS).default('none'),
    ambientVideoUrl: z.string().optional(),
    techStack: z.array(z.string()).default([]),
    description: z.string(),
    order: z.number().default(0)
  })
});

const history = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/history' }),
  schema: z.object({
    date: z.string(),
    title: z.string(),
    description: z.string(),
    tag: z.string().optional()
  })
});

export const collections = { projects, history };
