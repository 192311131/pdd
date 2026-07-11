import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works at the domain root AND under a sub-path
  // (e.g. GitHub Pages /repo/). All assets + the ONNX model resolve relatively.
  base: './',
  plugins: [react()],
})
