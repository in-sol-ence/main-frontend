import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Bundle the introduction and interactive lesson with one shared scene module; preserve static pages.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist/knowledge',
    emptyOutDir: true,
    lib: { entry: { knowledge: 'src/demo-entry.jsx', adaptive: 'src/adaptive-entry.jsx' }, formats: ['es'], fileName: (_, name) => `${name}.js` },
  },
})
