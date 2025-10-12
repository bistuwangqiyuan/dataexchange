import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server', // 改为server模式以确保所有API routes作为SSR运行
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

