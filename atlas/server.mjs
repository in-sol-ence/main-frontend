import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = new Map([['/', 'index.html'], ['/index.html', 'index.html'], ['/styles.css', 'styles.css'], ['/app.js', 'app.js'], ['/data.js', 'data.js'], ['/favicon.svg', 'favicon.svg']]);
const mime = { html: 'text/html', css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml' };
const port = Number(process.env.PORT || 4180);
for (const file of ['scene.js', 'sculpture.css', 'vendor/three.module.min.js', 'vendor/three.core.min.js', 'vendor/RoundedBoxGeometry.js', 'vendor/RoomEnvironment.js']) routes.set(`/${file}`, file);
createServer(async (request, response) => {
  const file = routes.get(new URL(request.url, 'http://localhost').pathname);
  if (!file) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const body = await readFile(new URL(file, import.meta.url));
    response.writeHead(200, { 'Content-Type': `${mime[file.split('.').pop()]}; charset=utf-8`, 'Cache-Control': 'no-store' });
    response.end(body);
  } catch { response.writeHead(500); response.end('Unable to load this file.'); }
}).listen(port, '127.0.0.1', () => console.log(`Atlas preview: http://127.0.0.1:${port}`));
