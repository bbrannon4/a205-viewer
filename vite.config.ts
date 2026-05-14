import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/a205-viewer/',  // for GitHub Pages deployment under a subpath
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 6000,  // plotly.js-dist-min is ~5MB minified by design
  },
})
