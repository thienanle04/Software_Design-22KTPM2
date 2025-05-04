import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: [
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util'
    ],
    // Thêm cấu hình esbuild option nếu cần
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  worker: {
    format: 'es'
  }
})