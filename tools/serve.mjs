// Minimal static file server for local play: node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = +(process.argv[2] || process.env.PORT || 5173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // dev only: a page can POST a PNG here to keep a capture (the sprite browser and test tabs use it)
  if (req.method === 'POST' && path.startsWith('/__dev/shot/')) {
    const name = path.slice(12).replace(/[^a-z0-9_-]/gi, '').slice(0, 60) || 'shot';
    const chunks = []; for await (const c of req) chunks.push(c);
    await mkdir(join(ROOT, '.devshots'), { recursive: true });
    await writeFile(join(ROOT, '.devshots', name + '.png'), Buffer.concat(chunks));
    res.writeHead(200).end('ok'); return;
  }
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Realm on http://localhost:${PORT}`));
