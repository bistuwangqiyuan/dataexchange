import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: netlify({
    edgeMiddleware: false,
  }),
  integrations: [react()],
  vite: {
    ssr: {
      external: ['@supabase/supabase-js'],
    },
  },
});

