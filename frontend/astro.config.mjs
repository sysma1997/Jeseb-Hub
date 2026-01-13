// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  server: {
      port: (process.env.PORT) ? Number(process.env.PORT) : 4321,
      host: true
  },

  integrations: [react()]
});