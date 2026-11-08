import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = Number(env.VITE_LANDING_PORT || env.VITE_PORT || 3000);
  const backendPort = Number(env.PORT || 5000);

  return {
    root: fileURLToPath(new URL('./landing-page', import.meta.url)),
    envDir: fileURLToPath(new URL('.', import.meta.url)),
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./landing-page/src', import.meta.url)),
      },
    },
    build: {
      outDir: fileURLToPath(new URL('./dist/landing', import.meta.url)),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/lucide-react')) {
              return 'icons';
            }
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      port: frontendPort,
      open: false,
      host: true,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          xfwd: true,
        },
      },
    },
  };
});
