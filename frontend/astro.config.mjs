// @ts-check
import { defineConfig } from 'astro/config';
import icon from "astro-icon";

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  server: {
      port: (process.env.PORT) ? Number(process.env.PORT) : 8000,
      host: true
  },

  integrations: [react(), icon()]
});