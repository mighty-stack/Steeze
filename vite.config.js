import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development the API runs on :4000. Production uses the Vercel /api rewrite, keeping
// authentication cookies first-party on the canonical frontend domain.
const proxy = { '/api': 'http://localhost:4000', '/health': 'http://localhost:4000' };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy },
  preview: { port: 5173, proxy },
});
