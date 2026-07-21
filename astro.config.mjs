// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [react()],

  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true
    }
  },

  // Astro's dev server (unlike Netlify's static host) doesn't resolve directory
  // index.html for files served straight out of public/, so /admin and /admin/
  // 404 locally without this. Harmless in production since Netlify serves
  // /admin/index.html directly.
  redirects: {
    '/admin': '/admin/index.html'
  },

  vite: {
    plugins: [tailwindcss()]
  }
});