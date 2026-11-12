import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = Number(env.VITE_ADMIN_PORT || 3001);
  const backendPort = Number(env.PORT || 5000);

  return {
    root: fileURLToPath(new URL('./admin-dashboard-web', import.meta.url)),
    envDir: fileURLToPath(new URL('.', import.meta.url)),
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./admin-dashboard-web/src', import.meta.url)),
        '@ui': fileURLToPath(new URL('./admin-dashboard-web/src/components/ui', import.meta.url)),
        '@lib': fileURLToPath(new URL('./admin-dashboard-web/src/lib', import.meta.url)),
        '@data': fileURLToPath(new URL('./admin-dashboard-web/src/data', import.meta.url)),
        '@context': fileURLToPath(new URL('./admin-dashboard-web/src/context', import.meta.url)),
        '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      },
    },
    build: {
      outDir: fileURLToPath(new URL('./dist/admin', import.meta.url)),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'charts';
            }
            if (id.includes('node_modules/exceljs')) {
              return 'excel';
            }
            if (id.includes('node_modules/@supabase/')) {
              return 'supabase-sdk';
            }
            if (id.includes('node_modules/@headlessui/')) {
              return 'headlessui';
            }
            if (id.includes('node_modules/sonner')) {
              return 'sonner';
            }
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
