import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RoozCalendarUi',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // React and the date engine stay external so consumers never get a
      // duplicate copy of either.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@rooz-calendar/core',
        /^@radix-ui\//,
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
      ],
      output: { globals: { react: 'React', 'react-dom': 'ReactDOM' } },
    },
    sourcemap: true,
    target: 'es2020',
    cssCodeSplit: false,
  },
});
