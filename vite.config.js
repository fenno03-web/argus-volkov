import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base './' so the same build works on GitHub Pages and inside the native apps
export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: { chunkSizeWarningLimit: 2000 }
});
