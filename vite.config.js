import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = Number(env.VITE_PORT || 3000);
  const backendPort = Number(env.PORT || 5000);

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      // Alias path — R29 (restrukturisasi folder).
      // Sebelumnya setiap berkas memakai import relatif '../../' yang rapuh:
      // memindahkan satu folder merusak puluhan berkas sekaligus. Dengan alias,
      // import jadi absolut & stabil terhadap perpindahan.
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@ui': fileURLToPath(new URL('./src/components/ui', import.meta.url)),
        '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
        '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
        '@context': fileURLToPath(new URL('./src/context', import.meta.url)),
        '@theme': fileURLToPath(new URL('./src/theme', import.meta.url)),
        '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Urutan penting: cek paling spesifik lebih dulu. Vite memanggil
            // fungsi ini per-modul, dan cabang pertama yang cocok menang.
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'charts';
            }
            if (id.includes('node_modules/exceljs')) {
              return 'excel';
            }
            if (id.includes('node_modules/pdfjs-dist')) {
              return 'pdfjs';
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
      warmup: {
        clientFiles: [
          './src/main.jsx',
          './src/App.jsx',
          './src/context/AppContext.jsx',
          './src/features/auth/LoginScreen.jsx',
        ],
      },
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
