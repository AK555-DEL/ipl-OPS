import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  const hmrDisabled = process.env.DISABLE_HMR === 'true';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: !hmrDisabled,
      ws: hmrDisabled ? (false as const) : undefined,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: hmrDisabled ? null : {},
    },
  };
});
