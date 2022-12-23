import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path';

const PKG = require('../../package.json');
const env = process.env.PJBLOG_ENV;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../../dist/advance'),
    emptyOutDir: true,
    lib: {
      entry: 'src/main.tsx',
      name: PKG.name.replace(/\-/g, '_'),
      fileName: env === 'development' ? 'index' : 'index.[hash]',
      formats: ['umd'],
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
