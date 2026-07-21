import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    cover: z.string(),
    video: z.string().optional(),
    model: z.string().optional(),
    techStack: z.array(z.string()).default([]),
    description: z.string(),
    order: z.number().default(0)
  })
});

export const collections = { projects };
