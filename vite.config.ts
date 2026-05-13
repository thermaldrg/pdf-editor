import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron/simple';

const ELECTRON_OUT_DIR: string = 'dist-electron';
const isElectronBuild: boolean = process.env.ELECTRON === '1';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: (id: string): string | undefined => {
          if (id.includes('node_modules/pdfjs-dist/')) return 'pdfjs';
          if (id.includes('node_modules/pdf-lib/')) return 'pdf-lib';
          if (id.includes('node_modules/@libpdf/')) return 'libpdf';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(isElectronBuild
      ? [
          electron({
            main: {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: ELECTRON_OUT_DIR,
                  rollupOptions: {
                    output: {
                      format: 'es',
                      entryFileNames: 'main.mjs',
                    },
                  },
                },
              },
            },
            preload: {
              input: 'electron/preload.ts',
              vite: {
                build: {
                  outDir: ELECTRON_OUT_DIR,
                  rollupOptions: {
                    output: {
                      format: 'cjs',
                      entryFileNames: 'preload.cjs',
                    },
                  },
                },
              },
            },
          }),
        ]
      : []),
  ],
});
