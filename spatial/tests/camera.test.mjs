import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { CameraRig } from '../src/camera.js';
import { createArcTable, pointAt, PERIOD } from '../src/trajectory.js';
import { createWorld } from '../src/world.js';

test('camera stays forward-facing, smooth, and near the path over repeated cycles', () => {
  const camera = new THREE.PerspectiveCamera(53, 16 / 9, .08, 290);
  const rig = new CameraRig(camera);
  const arc = createArcTable();
  const previous = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const path = new THREE.Vector3();
  const direction = new THREE.Vector3();
  let maxTurn = 0;
  for (let i = 0; i < 60 * 130; i++) {
    const station = arc.stationAtDistance(39 + i * 7.2 / 60);
    rig.update(station, 1 / 60);
    camera.getWorldDirection(direction);
    assert.ok(direction.z < -.5, 'Camera should look forward, never orbit or turn around.');
    pointAt(station, path);
    assert.ok(camera.position.distanceTo(path) < 6, 'Camera should stay inside the trajectory corridor.');
    if (i) {
      assert.ok(camera.position.distanceTo(previous) < .15, 'Position jumped.');
      const turn = camera.quaternion.angleTo(rotation);
      maxTurn = Math.max(maxTurn, turn);
      assert.ok(turn < .009, 'Orientation jumped.');
    }
    previous.copy(camera.position); rotation.copy(camera.quaternion);
  }
  assert.ok(maxTurn > .001, 'Camera must actually turn through the spline.');
});

test('mesh faces and geometry are valid and repeated sections remain contiguous', () => {
  const world = createWorld();
  const camera = new THREE.PerspectiveCamera();
  world.update(PERIOD * 3 + 1, camera);
  const meshes = world.scene.children;
  assert.deepEqual(meshes.map(mesh => mesh.position.z), [-2, -3, -4, -5].map(n => n * PERIOD));
  const geometry = meshes[0].geometry;
  const pos = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
  const index = geometry.index;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), expected = new THREE.Vector3();
  for (let i = 0; i < index.count; i += 111) {
    const triangle = i - i % 3;
    a.fromBufferAttribute(pos, index.getX(triangle));
    b.fromBufferAttribute(pos, index.getX(triangle + 1));
    c.fromBufferAttribute(pos, index.getX(triangle + 2));
    expected.fromBufferAttribute(normals, index.getX(triangle));
    const face = b.sub(a).cross(c.sub(a)).normalize();
    assert.ok(face.dot(expected) > .9, 'Face winding should agree with its lighting normal.');
  }
  for (const value of pos.array) assert.ok(Number.isFinite(value));
  world.dispose();
});
