import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Cross-origin isolation is required so the interrupt buffer (a SharedArrayBuffer)
// works. These headers are a deployment requirement too; see CLAUDE.md.
const ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// The production policy. 'wasm-unsafe-eval' lets Pyodide compile WebAssembly
// without allowing eval(). Dev serving skips it because Vite injects inline scripts.
const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; " +
  "font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'";

function productionCsp(): Plugin {
  return {
    name: 'larkspur-production-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: PRODUCTION_CSP },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), productionCsp()],
  // Test hooks exist only when serving the dev server. The production build
  // replaces this with false, and scripts/check-production-hooks.mjs proves it.
  define: {
    __TEST_HOOKS__: JSON.stringify(command === 'serve'),
  },
  server: { headers: ISOLATION_HEADERS, port: 5173, strictPort: true },
  preview: { headers: ISOLATION_HEADERS, port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
}));
