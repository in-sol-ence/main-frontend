import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSkateboardTransition } from '../dist/transition.js';
import * as THREE from '../dist/vendor/three/three.module.js';

function _fixture(reduced = false) {
  const motion = { matches: reduced };
  globalThis.matchMedia = () => motion;
  globalThis.document = { documentElement: { clientWidth: 1000 }, body: { classList: { add() {}, remove() {} } } };
  const pages = ['home', 'demo'].map((id, index) => ({
    id, inert: index > 0, style: {}, attributes: {}, focused: false,
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
  for (const elapsed of [10, 350, 700, 1050]) {
    transition.tick(start + elapsed);
    const x = positions.at(-1);
    assert.ok(x > 0 && x < 1000);
    assert.equal(pages[1].style.clipPath, `inset(0 ${1000 - x}px 0 0)`);
    assert.equal(pages[0].style.clipPath, `inset(0 0 0 ${x}px)`);
  }
  // Resize during a flight uses the current viewport in the very same tick.
  document.documentElement.clientWidth = 390;
  transition.tick(start + 1200);
  assert.equal(pages[1].style.clipPath, `inset(0 ${390 - positions.at(-1)}px 0 0)`);
  transition.tick(start + 1500);
  assert.equal(await navigation, true);
  assert.equal(pages[1].inert, false);
  assert.equal(pages[1].focused, true);
  assert.equal(transition.active, false);
  assert.deepEqual(finishes, ['demo']);
  const back = transition.navigate(pages[0]);
  transition.tick(performance.now() + 1500);
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

test('orthographic trailing edge projects to the same pixel at all viewport sizes', () => {
  const geometry = new THREE.BoxGeometry(1, .2, 6.7);
  const board = new THREE.Mesh(geometry);
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 30);
  camera.position.set(0, -8, 0);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const bounds = new THREE.Box3();
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const halfWidth = 4 * width / height;
    camera.left = -halfWidth; camera.right = halfWidth;
    camera.updateProjectionMatrix();
    for (const progress of [0, .1, .25, .5, .75, 1]) {
      board.position.set(0, 0, 0);
      board.rotation.set(Math.PI / 2, Math.PI / 2, 0);
      const noseDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(board.quaternion);
      const deckUp = new THREE.Vector3(0, 1, 0).applyQuaternion(board.quaternion);
      assert.ok(noseDirection.distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-9);
      assert.ok(deckUp.distanceTo(new THREE.Vector3(0, 0, 1)) < 1e-9);
      bounds.setFromObject(board, true);
      board.position.x = -halfWidth + progress * halfWidth * 2 - bounds.min.x;
      bounds.setFromObject(board, true);
      const projected = new THREE.Vector3(bounds.min.x, 0, 0).project(camera);
      assert.ok(Math.abs((projected.x + 1) * width / 2 - progress * width) < 1e-9);
    }
  }
  geometry.dispose();
});
