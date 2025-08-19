import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use relative asset paths so opening dist/index.html works from filesystem
// and when deploying under a subpath without server rewrites.
export default defineConfig({
  base: './',
  plugins: [react()],
});
