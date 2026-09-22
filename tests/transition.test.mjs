import { readFileSync } from 'node:fs';
import { OBJLoader } from '../dist/vendor/three/OBJLoader.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSkateboardTransition } from '../dist/transition.js';
import * as THREE from '../dist/vendor/three/three.module.js';

function _fixture(reduced = false) {
  const motion = { matches: reduced };
  globalThis.matchMedia = () => motion;
  globalThis.document = { documentElement: { clientWidth: 1000 }, body: { classList: { add() {}, remove() {} } } };
  const pages = ['home', 'demo'].map((id, index) => ({
    id, inert: index > 0, style: {}, dataset: {}, attributes: {}, focused: false,
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
    querySelector() { return { focus: () => { this.focused = true; } }; }
  }));
  const positions = [];
  const finishes = [];
  const transition = createSkateboardTransition({ pages, viewer: {
    begin() {}, move(progress) { positions.push(progress * document.documentElement.clientWidth); return positions.at(-1); },
    finish(id) { finishes.push(id); }
  } });
  return { transition, pages, positions, finishes, motion };
}

test('single boundary reveals incoming while retaining complementary outgoing pixels', async () => {
  const { transition, pages, positions, finishes } = _fixture();
  const start = performance.now();
  const navigation = transition.navigate(pages[1]);
  assert.equal(pages[0].inert, true);
  assert.equal(await transition.navigate(pages[1]), false);
  for (const elapsed of [10, 600, 1200, 1800]) {
    transition.tick(start + elapsed);
    const x = positions.at(-1);
    assert.ok(x > 0 && x < 1000);
    assert.equal(pages[1].style.clipPath, `inset(0 ${1000 - x}px 0 0)`);
    assert.equal(pages[0].style.clipPath, `inset(0 0 0 ${x}px)`);
  }
  // Resize during a flight uses the current viewport in the very same tick.
  document.documentElement.clientWidth = 390;
  transition.tick(start + 2900);
  assert.equal(pages[1].style.clipPath, `inset(0 ${390 - positions.at(-1)}px 0 0)`);
  // The sweep is still running one frame before its 3200ms duration elapses.
  assert.equal(transition.active, true);
  transition.tick(start + 3300);
  assert.equal(await navigation, true);
  assert.equal(pages[1].inert, false);
  assert.equal(pages[1].focused, true);
  assert.equal(transition.active, false);
  assert.deepEqual(finishes, ['demo']);
  const back = transition.navigate(pages[0]);
  transition.tick(performance.now() + 3300);
  assert.equal(await back, true);
  assert.deepEqual(finishes, ['demo', 'home']);
});

test('reduced motion skips sweep and can finish an in-progress flight', async () => {
  const { transition, pages, positions, motion } = _fixture(true);
  assert.equal(await transition.navigate(pages[1]), true);
  assert.equal(positions.length, 0);
  assert.equal(pages[1].style.clipPath, 'inset(0)');
  motion.matches = false;
  const back = transition.navigate(pages[0]);
  motion.matches = true;
  transition.tick(performance.now());
  assert.equal(await back, true);
  assert.equal(pages[0].inert, false);
});

test('actual OBJ sweep stays horizontal, exits fully, and clips at its projected center with a fixed perspective camera', () => {
  const model = new OBJLoader().parse(readFileSync(new URL('../dist/models/board.obj', import.meta.url), 'utf8'));
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  model.position.sub(bounds.getCenter(new THREE.Vector3()));
  const board = new THREE.Group();
  board.add(model);
  board.scale.setScalar(6.35 / size.z * 1.06);
  board.position.set(0, -.45, 0);
  board.rotation.set(-1.8151424220741028, 2.478367537831948, .06981317007977318);
  const ride = new THREE.Group();
  ride.add(board);
  const camera = new THREE.PerspectiveCamera(52, 1, .1, 30);
  camera.position.set(.1328305864251409, 2.077583808205999, 6.044717163173346);
  camera.up.set(-.9042679616674021, .24773014936104823, .3477487981279509);
  camera.lookAt(0, 0, .7);
  const source = readFileSync(new URL('../dist/skateboard.js', import.meta.url), 'utf8');
  // Execute the production viewer methods, not a second copy of the trajectory.
  const setup = source.slice(source.indexOf('  const homePosition'), source.indexOf('  for (const actions'));
  const container = { clientWidth: 1440, clientHeight: 900 };
  const volume = { style: {}, getBoundingClientRect: () => ({ left: 300, right: 800 }) };
  const document = { querySelector: () => volume, querySelectorAll: () => [], body: { dataset: {} } };
  const viewer = new Function('THREE', 'board', 'ride', 'model', 'size', 'camera', 'container', 'composer', 'controls', 'document', 'reducedMotion', 'createSkateboardTransition',
    'let resumeSpinTimer; ' + setup + '; return transition;')(
    THREE, board, ride, model, size, camera, container, { render() {} }, {}, document,
    { matches: false }, options => options.viewer);
  const original = { position: board.position.clone(), rotation: board.quaternion.clone(), scale: board.scale.clone() };
  const point = new THREE.Vector3();
  for (const [width, height] of [[1440, 900], [390, 844], [2560, 1080]]) {
    container.clientWidth = width; container.clientHeight = height;
    camera.aspect = width / height;
    camera.setViewOffset(width, height, -width * .23, height * .04, width, height);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const fixedCamera = camera.matrixWorld.toArray();
    const fixedLens = camera.projectionMatrix.toArray();
    viewer.begin();
    let previousCenter = -Infinity;
    let previousRoll = -Infinity;
    for (let frame = 0; frame <= 60; frame++) {
      const progress = frame / 60;
      const center = viewer.move(progress);
      let minX = Infinity, maxX = -Infinity;
      model.traverse(mesh => {
        if (!mesh.isMesh) return;
        const vertices = mesh.geometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
          point.fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld).project(camera);
          minX = Math.min(minX, (point.x + 1) * width / 2);
          maxX = Math.max(maxX, (point.x + 1) * width / 2);
        }
      });
      assert.ok(Math.abs(center - (minX + maxX) / 2) < 1e-8, 'clip follows the projected silhouette center');
      assert.ok(center > previousCenter, 'projected center never reverses');
      previousCenter = center;
      if (frame === 0) assert.ok(maxX < 0, 'whole board starts off-screen');
      if (frame === 30) assert.ok(minX < 0 && maxX > width, 'the board covers the whole viewport mid-sweep');
      if ([15, 30, 45].includes(frame)) {
        assert.ok(center > minX && center < maxX, `${frame / 60 * 100}% boundary is within the board`);
        const boundary = THREE.MathUtils.clamp(center, 0, width);
        assert.equal(volume.style.clipPath, `inset(0 ${Math.max(0, volume.getBoundingClientRect().right - boundary)}px 0 0)`);
      }
      if (frame === 60) assert.ok(minX > width, 'whole board exits before completion');
      assert.ok(maxX - minX > width, 'the board is wider than the viewport it sweeps');
      const relative = camera.quaternion.clone().invert().multiply(ride.quaternion);
      const nose = new THREE.Vector3(0, 0, 1).applyQuaternion(board.quaternion).applyQuaternion(relative);
      assert.ok(nose.x > Math.cos(THREE.MathUtils.degToRad(18)), 'nose keeps pointing along the sideways travel');
      assert.ok(Math.abs(nose.y) <= Math.sin(THREE.MathUtils.degToRad(10)) + 1e-9, 'only a slight tilt off horizontal');
      // The wheels are at model +Y, so -Y is the deck face that must meet the viewer.
      const deck = new THREE.Vector3(0, -1, 0).applyQuaternion(board.quaternion).applyQuaternion(relative);
      assert.ok(deck.z > Math.cos(THREE.MathUtils.degToRad(40)), 'deck top faces the viewer, never the wheels');
      const rotation = new THREE.Euler().setFromQuaternion(relative, 'ZYX');
      assert.ok(Math.abs(rotation.y) <= THREE.MathUtils.degToRad(12) + 1e-9);
      assert.ok(Math.abs(rotation.z - THREE.MathUtils.degToRad(10)) < 1e-9);
      const roll = THREE.MathUtils.degToRad(-90 + 34 * (2 * progress - 1));
      assert.ok(Math.abs(rotation.x - roll) < 1e-6, 'the board keeps rolling along its length');
      assert.ok(rotation.x > previousRoll, 'the roll never stalls or reverses');
      previousRoll = rotation.x;
      assert.deepEqual(camera.matrixWorld.toArray(), fixedCamera);
      assert.deepEqual(camera.projectionMatrix.toArray(), fixedLens);
    }
    viewer.finish('home');
    assert.ok(board.position.equals(original.position));
    assert.ok(board.quaternion.equals(original.rotation));
    assert.ok(board.scale.equals(original.scale));
    assert.ok(ride.position.length() === 0 && ride.quaternion.w === 1);
    assert.equal(volume.style.clipPath, 'inset(0 100% 0 0)');
  }
});
