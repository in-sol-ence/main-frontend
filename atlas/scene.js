import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const canvas = document.querySelector('#sculpture');
const host = document.querySelector('#scene-shell');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const environment = pmrem.fromScene(room, .04);
scene.environment = environment.texture;
scene.environmentIntensity = .55;
room.dispose(); pmrem.dispose();
const camera = new THREE.PerspectiveCamera(35, 1, .1, 60);
camera.position.set(7.9, 6.2, 10.5); camera.lookAt(0, 1.4, 0);
scene.add(new THREE.HemisphereLight(0xf5f5cf, 0x374927, 1.25));
const key = new THREE.DirectionalLight(0xffffdd, 3.3);
key.position.set(-3, 8, 5); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024); key.shadow.normalBias = .03;
key.shadow.radius = 4;
key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
scene.add(key);
const rim = new THREE.DirectionalLight(0xdeff9c, 2.5); rim.position.set(4, 4, -4); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, .8); fill.position.set(-6, 1, -1); scene.add(fill);

// A suspended, physical stack of ideas. The pieces separate as the map assembles.
const sculpture = new THREE.Group(); scene.add(sculpture);
const slabs = [];
const colors = [0x627645, 0xe8ebc9, 0xa4bd72, 0xd3df9e, 0xe4edbd];
const symbols = ['x y z', 'P(x)', '∂ / ∂x', '< / >', 'π'];
function inscription(index, size) {
  const drawing = document.createElement('canvas'); drawing.width = 768; drawing.height = 384;
  const ctx = drawing.getContext('2d');
  ctx.fillStyle = index === 0 ? '#e3e9bb' : '#2b391c';
  ctx.font = '20px monospace'; ctx.fillText(`ATLAS / 0${index + 1}`, 60, 65);
  ctx.font = 'italic 116px Georgia'; ctx.fillText(symbols[index], 65, 245);
  ctx.fillStyle = index === 0 ? '#e3e9bb88' : '#2b391c88';
  ctx.fillRect(61, 301, 637, 1); ctx.font = '16px monospace'; ctx.fillText('EVERY IDEA HAS A WAY IN', 60, 334);
  const tex = new THREE.CanvasTexture(drawing); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size * .91, 1.76), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2; plane.position.y = .246; return plane;
}
for (let index = 0; index < 5; index++) {
  const size = 4.45 - index * .19;
  const group = new THREE.Group();
  const material = new THREE.MeshPhysicalMaterial({ color: colors[index], roughness: index === 2 ? .12 : .26, metalness: index === 2 ? .22 : .05, clearcoat: 1, clearcoatRoughness: .18, ior: 1.47, transmission: index === 2 ? .27 : 0, thickness: .8 });
  const slab = new THREE.Mesh(new RoundedBoxGeometry(size, .48, 2.28, 5, .14), material);
  slab.castShadow = true; slab.receiveShadow = true;
  group.add(slab, inscription(index, size));
  const trim = new THREE.Mesh(new RoundedBoxGeometry(size - .13, .05, 2.16, 3, .025), new THREE.MeshPhysicalMaterial({ color: 0xced5b8, metalness: .92, roughness: .2 }));
  trim.position.y = -.237; group.add(trim);
  group.position.y = .47 + index * .65; group.rotation.y = (index - 2) * -.105;
  sculpture.add(group); slabs.push(group);
}

const seed = new THREE.Group(); sculpture.add(seed); seed.position.set(0, 4.24, 0);
const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.35, 0), new THREE.MeshPhysicalMaterial({ color: 0xe2f5b9, metalness: .35, roughness: .07, clearcoat: 1, transmission: .15, thickness: .8 }));
seed.add(crystal);
const hoopMaterial = new THREE.MeshStandardMaterial({ color: 0xc4d894, metalness: .8, roughness: .2 });
const hoop = new THREE.Mesh(new THREE.TorusGeometry(.64, .012, 8, 96), hoopMaterial); hoop.rotation.x = Math.PI * .28; hoop.rotation.y = .35; seed.add(hoop);
const hoop2 = new THREE.Mesh(new THREE.TorusGeometry(.74, .006, 6, 96), hoopMaterial); hoop2.rotation.x = -Math.PI * .28; hoop2.rotation.y = -.5; seed.add(hoop2);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(35, 35), new THREE.ShadowMaterial({ color: 0x152109, opacity: .22 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -.64; ground.receiveShadow = true; scene.add(ground);
const terrainGeometry = new THREE.PlaneGeometry(23, 17, 100, 70);
const positions = terrainGeometry.attributes.position;
for (let index = 0; index < positions.count; index++) {
  const x = positions.getX(index), y = positions.getY(index);
  const edge = Math.pow(Math.min(1, Math.sqrt(x*x + y*y) / 9), 2);
  const h = (Math.sin(x * 1.1 + y * .45) * .28 + Math.cos(y * .8 - x * .3) * .4 + Math.sin(x * 2.7 + y * 1.3) * .06) * edge;
  positions.setZ(index, h - .84);
}
terrainGeometry.computeVertexNormals();
const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ color: 0x344823, roughness: .97, metalness: 0, transparent: true, opacity: .38 }));
terrain.rotation.x = -Math.PI / 2; terrain.position.y = -.9; terrain.position.z = -3; terrain.receiveShadow = true; scene.add(terrain);
const orbit = new THREE.Group(); scene.add(orbit);
const beads = [];
for (let index = 0; index < 16; index++) {
  const bead = new THREE.Mesh(new THREE.SphereGeometry(index % 4 === 0 ? .06 : .027, 12, 8), new THREE.MeshStandardMaterial({ color: 0xdcebb0, roughness: .1, metalness: .6 }));
  orbit.add(bead); beads.push(bead);
}
let pointerX = 0, pointerY = 0, currentX = 0, currentY = 0, time = 0, previous = 0, visible = true, hovered = -1;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let expansion = 0;
window.addEventListener('pointermove', event => { pointerX = event.clientX / innerWidth - .5; pointerY = event.clientY / innerHeight - .5; }, { passive: true });
document.querySelectorAll('[data-sculpture-topic]').forEach(button => {
  const index = Number(button.dataset.sculptureTopic);
  button.addEventListener('pointerenter', () => { hovered = index; });
  button.addEventListener('pointerleave', () => { hovered = -1; });
  button.addEventListener('focus', () => { hovered = index; });
  button.addEventListener('blur', () => { hovered = -1; });
});
function resize() {
  const width = host.clientWidth, height = host.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  const narrow = innerWidth < 761;
  camera.position.set(narrow ? 8.9 : 7.9, narrow ? 7 : 6.2, narrow ? 12 : 10.5); camera.lookAt(0, 1.5, 0);
}
new ResizeObserver(resize).observe(host);
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { rootMargin: '100px' }).observe(host);
function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - previous) / 1000, .05); previous = now;
  if (!visible || document.hidden) return;
  const motion = !motionQuery.matches && !document.body.classList.contains('motion-paused');
  if (motion) time += delta;
  const phase = document.body.dataset.phase;
  const targetExpansion = phase === 'building' ? 1 : 0;
  expansion += (targetExpansion - expansion) * .04;
  currentX += ((motion ? pointerX : 0) - currentX) * .035;
  currentY += ((motion ? pointerY : 0) - currentY) * .035;
  sculpture.rotation.y = -.28 + Math.sin(time * .25) * .18 + currentX * .3;
  sculpture.rotation.z = Math.sin(time * .3) * .025;
  sculpture.position.y = Math.sin(time * .8) * .055;
  for (let index = 0; index < slabs.length; index++) {
    const group = slabs[index];
    const spread = Math.sin(time * .7 + index * .8) * .045;
    group.position.y = .47 + index * (.65 + expansion * .24) + spread;
    group.rotation.y = (index - 2) * (-.105 - expansion * .16) + Math.sin(time * .48 + index * .48) * .06;
    group.position.x += ((hovered === index ? -.5 : 0) - group.position.x) * .08;
  }
  seed.position.y = 4.24 + expansion * 1.3 + Math.sin(time * .65) * .1;
  crystal.rotation.y = time * .25; crystal.rotation.z = time * .1;
  hoop.rotation.z = time * .11; hoop2.rotation.z = -time * .13;
  beads.forEach((bead, index) => { const a = index / 16 * Math.PI * 2 + time * .07; bead.position.set(Math.cos(a) * 3.5, 1.1 + Math.sin(a * 2) * 1.6, Math.sin(a) * 2.8); });
  camera.position.y = (innerWidth < 761 ? 7 : 6.2) + currentY * .5; camera.lookAt(0, 1.5, 0);
  renderer.render(scene, camera);
}
resize(); document.body.classList.add('sculpture-ready'); requestAnimationFrame(frame);
