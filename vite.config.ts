import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        vue(),
        legacy({
            targets: ['> 95%', 'not IE 11'],
            modernPolyfills: true,
            polyfills: true
        })
    ]
});
