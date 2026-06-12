import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Azure Static Web Apps workflow expects the artifact in "build/", not "dist/"
    outDir: 'build',
    emptyOutDir: true,
  },
});