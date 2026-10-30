// Static server for the engine spike. It sends the cross-origin isolation headers
// (needed for SharedArrayBuffer) and a Content-Security-Policy. It does not
// compress, so the byte counts the harness reports are raw wire sizes.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.json': 'application/json; charset=utf-8',
  '.zip': 'application/zip',
  '.whl': 'application/zip',
};

const POLICIES = {
  // 'wasm-unsafe-eval' lets Pyodide compile WebAssembly without allowing eval().
  production: "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self'",
  noWasmEval: "default-src 'self'; script-src 'self'; worker-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self'",
};

export function startServer({ distDir, appDir, policy = 'production' }) {
  const headers = {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': POLICIES[policy],
  };
  const mounts = [
    ['/pyodide/', distDir],
    ['/app/', appDir],
  ];

  function resolveFile(pathname) {
    if (pathname === '/') return path.join(appDir, 'index.html');
    for (const [prefix, root] of mounts) {
      if (!pathname.startsWith(prefix)) continue;
      const target = path.resolve(root, decodeURIComponent(pathname.slice(prefix.length)));
      const inside = target.startsWith(path.resolve(root) + path.sep);
      return inside && fs.existsSync(target) && fs.statSync(target).isFile() ? target : null;
    }
    return null;
  }

  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const file = resolveFile(pathname);
    if (!file) {
      res.writeHead(404, headers);
      res.end('not found');
      return;
    }
    const { size } = fs.statSync(file);
    res.writeHead(200, {
      ...headers,
      'Content-Type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
      'Content-Length': size,
    });
    fs.createReadStream(file).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}
