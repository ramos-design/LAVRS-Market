import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
    server: {
        port: 5173,
        host: '0.0.0.0',
    },
    plugins: [react()],
    esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        }
    }
}));
