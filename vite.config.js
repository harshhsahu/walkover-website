import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const page = (name) => resolve(import.meta.dirname, `${name}.html`);

export default defineConfig({
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
      input: {
        home: page('index'),
        worlds: page('worlds'),
        lab: page('lab'),
        visionary: page('visionary'),
        footprints: page('footprints'),
        join: page('join'),
      },
    },
  },
});
