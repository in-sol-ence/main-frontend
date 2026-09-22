import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Only rebuild the embedded React visualization; preserve the static landing site.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist/knowledge',
    emptyOutDir: true,
    lib: { entry: 'src/demo-entry.jsx', formats: ['es'], fileName: () => 'knowledge.js' },
  },
})
