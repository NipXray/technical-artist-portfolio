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
  'sparkle',
  'domain-slash'
] as const;

const AMBIENT_EFFECTS = ['none', 'smoke', 'embers', 'dust', 'snow', 'fireflies', 'fog'] as const;

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
    ambientEffectScope: z.enum(['all', 'first']).default('all'),
    ambientVideoUrl: z.string().optional(),
    galleryVideoPlayback: z.enum(['fixed', 'full']).default('fixed'),
    techStack: z.array(z.string()).default([]),
    description: z.string(),
    order: z.number().default(0),
    hidden: z.boolean().default(false)
  })
});

const history = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/history' }),
  schema: z.object({
    date: z.string(),
    title: z.string(),
    titleId: z.string().optional(),
    organization: z.string().optional(),
    organizationId: z.string().optional(),
    description: z.string(),
    descriptionId: z.string().optional(),
    tag: z.string().optional()
  })
});

const professional = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/professional' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    cover: z.string(),
    role: z.string(),
    date: z.string(),
    company: z.string().optional(),
    companyUrl: z.string().optional(),
    description: z.string(),
    order: z.number().default(0),
    hidden: z.boolean().default(false)
  })
});

export const collections = { projects, history, professional };
