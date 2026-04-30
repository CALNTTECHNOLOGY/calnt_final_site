import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';

export default defineConfig({
  output: 'hybrid',          // static pages + serverless API routes
  adapter: netlify(),
  integrations: [react()],
});
