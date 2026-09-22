import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = ['index.html', 'style.css', 'src/main.js', 'src/world.js', 'src/camera.js', 'src/trajectory.js', 'src/motion.js', 'vendor/three.module.min.js', 'vendor/three.core.min.js'];
const routes = new Map(files.map(file => [`/${file}`, file]));
routes.set('/src/landing.js', 'src/landing.js');
for (const file of ['src/concepts.js', 'src/landmark-layout.js', 'src/landmarks.js']) routes.set(`/${file}`, file);
for (const file of ['src/hierarchy.js', 'src/pathway-layout.js', 'src/pathways.js']) routes.set(`/${file}`, file);
routes.set('/src/choreography.js', 'src/choreography.js');
for (const file of ['src/focus.js', 'src/annotations.js']) routes.set(`/${file}`, file);
routes.set('/', 'index.html');
for (const file of ['src/knowledge.js', 'src/exploration.js', 'src/layer.js']) routes.set(`/${file}`, file);
routes.set('/src/knowledge-model.js', 'src/knowledge-model.js');
for (const file of ['src/journey-provider.js', 'src/example-maps.js', 'src/entry.js']) routes.set(`/${file}`, file);
for (const file of ['src/adaptation.js', 'src/robotics.js', 'src/reconfiguration.js']) routes.set(`/${file}`, file);
const mime = { html: 'text/html', css: 'text/css', js: 'text/javascript' };
for (const file of ['src/learning-content.js', 'src/learning-visual.js', 'src/learning.js']) routes.set(`/${file}`, file);
const port = Number(process.env.PORT || 4181);
routes.set('/src/knowledge-field.js', 'src/knowledge-field.js');
routes.set('/src/handoff.js', 'src/handoff.js');
for (const file of ['src/route-plan.js', 'src/route-space.js']) routes.set(`/${file}`, file);
for (const file of ['src/knowledge-checks.js', 'src/learner-model.js', 'src/adaptive-engine.js']) routes.set(`/${file}`, file);
createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = routes.get(pathname);
  if (!file) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const body = await readFile(new URL(file, import.meta.url));
    response.writeHead(200, { 'Content-Type': `${mime[file.split('.').pop()]}; charset=utf-8`, 'Cache-Control': 'no-store' });
    response.end(body);
  } catch { response.writeHead(500); response.end('Unable to load this file.'); }
}).listen(port, '127.0.0.1', () => console.log(`Spatial study: http://127.0.0.1:${port}`));
