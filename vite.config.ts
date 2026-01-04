import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three'],
          'mediapipe-vendor': [
            '@mediapipe/hands',
            '@mediapipe/camera_utils',
            '@mediapipe/drawing_utils'
          ]
        }
      }
    }
  }
});
