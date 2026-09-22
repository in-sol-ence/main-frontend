import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { knowledge } from '../src/knowledge.js';
import { indexKnowledge } from '../src/knowledge-model.js';
import { concepts } from '../src/concepts.js';
import { annotations } from '../src/annotations.js';
import { createArcTable, pointAt } from '../src/trajectory.js';
import { locateConcept } from '../src/landmark-layout.js';
import { CameraRig } from '../src/camera.js';
import { CameraPassage, ExplorationHistory, frameAtConcept, identityFrame, layerReveal, worldPose, localPose } from '../src/exploration.js';
import { pathwayGeometry } from '../src/pathways.js';
import { pathwayPoint } from '../src/pathway-layout.js';

test('recursive definitions preserve the root curriculum and have local valid prerequisites', () => {
  const visited = new Set();
  function inspect(layer) {
    assert.ok(!visited.has(layer)); visited.add(layer);
    const lookup = new Map(layer.children.map(concept => [concept.id, concept]));
    for (const concept of layer.children) {
      assert.ok(concept.annotation || annotations[concept.id]);
      assert.ok(concept.importance > 0 && concept.importance <= 1);
      for (const id of concept.prerequisites) {
        assert.ok(lookup.has(id)); assert.ok(lookup.get(id).at < concept.at);
      }
      if (concept.children.length) inspect(concept);
    }
    for (const path of layer.pathways) {
      assert.ok(lookup.get(path.target).prerequisites.includes(path.source));
      const arc = createArcTable();
      const geometry = pathwayGeometry(path, arc, lookup);
      assert.ok([...geometry.getAttribute('position').array].every(Number.isFinite));
      const endpoint = pathwayPoint(path, arc, 1, 0, new THREE.Vector3(), lookup);
      assert.ok(endpoint.distanceTo(locateConcept(lookup.get(path.target), 0, arc).root) < 1e-8);
      geometry.dispose();
    }
  }
  inspect(knowledge); assert.equal(visited.size, 39);
  knowledge.children.forEach((concept, index) => {
    for (const key of Object.keys(concepts[index])) assert.deepEqual(concept[key], concepts[index][key]);
  });
});

test('each child path starts at the selected parent location even after nested/repeated travel', () => {
  const arc = createArcTable();
  const camera = new THREE.PerspectiveCamera(53, 1.6, .08, 290);
  new CameraRig(camera).update(arc.stationAtDistance(13), 0);
  const parent = { position: new THREE.Vector3(30, 5, -90), rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), .8) };
  const selected = locateConcept(concepts[2], 2, arc);
  const from = { position: new THREE.Vector3(60, 10, -600), quaternion: new THREE.Quaternion() };
  const { frame } = frameAtConcept(parent, selected, from, camera);
  const start = pointAt(0, new THREE.Vector3()).multiplyScalar(frame.scale).applyQuaternion(frame.rotation).add(frame.position);
  const selectedWorld = selected.root.clone().applyQuaternion(parent.rotation).add(parent.position);
  assert.ok(start.distanceTo(selectedWorld) < 1e-8);
  const pose = worldPose(camera, frame), back = camera.clone();
  localPose(pose, frame, back);
  assert.ok(back.position.distanceTo(camera.position) < 1e-8);
  assert.ok(back.quaternion.angleTo(camera.quaternion) < 1e-7);
  assert.equal(back.fov, camera.fov);
});

test('camera passage has exact endpoints, passes through the portal, and joins with continuous velocity', () => {
  const from = { position: new THREE.Vector3(0, 3, 0), quaternion: new THREE.Quaternion() };
  const to = { position: new THREE.Vector3(12, 5, -70), quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), .3) };
  const portal = new THREE.Vector3(8, 4, -48);
  const passage = new CameraPassage({ from, to, portal });
  assert.ok(passage.sample(0).position.distanceTo(from.position) < 1e-8);
  assert.ok(passage.sample(passage.duration).position.distanceTo(to.position) < 1e-8);
  const middle = passage.duration * passage.split, epsilon = .0001;
  assert.ok(passage.sample(middle).position.distanceTo(portal) < 1e-8);
  const left = passage.sample(middle).position.sub(passage.sample(middle - epsilon).position).divideScalar(epsilon);
  const right = passage.sample(middle + epsilon).position.sub(passage.sample(middle).position).divideScalar(epsilon);
  assert.ok(left.distanceTo(right) < .01);
  let prior = passage.sample(0);
  for (let time = 1 / 120; time < passage.duration; time += 1 / 120) {
    const next = passage.sample(time);
    assert.ok(next.position.distanceTo(prior.position) < .25);
    assert.ok(next.quaternion.angleTo(prior.quaternion) < .005);
    prior = next;
  }
});

test('layer emergence is continuous and preserves a faint parent at arrival', () => {
  assert.deepEqual(layerReveal(0), { parent: 1, child: 0 });
  assert.ok(Math.abs(layerReveal(1).parent - .14) < 1e-8);
  assert.equal(layerReveal(1).child, 1);
  for (let p = 0; p < 1; p += .001) {
    const a = layerReveal(p), b = layerReveal(p + .001);
    assert.ok(Math.abs(a.parent - b.parent) < .004);
    assert.ok(Math.abs(a.child - b.child) < .004);
  }
});

test('recursive history preserves parent state, guards rapid clicks, and leaves are inert', () => {
  const root = { definition: knowledge, journey: { distance: 122, speed: 3.2 }, frame: identityFrame() };
  const history = new ExplorationHistory(root);
  const algebra = knowledge.children.find(concept => concept.id === 'linear-algebra');
  assert.equal(history.canEnter(algebra), true);
  assert.equal(history.canEnter(indexKnowledge(knowledge).get('coordinate-axes')), false);
  history.busy = true;
  assert.equal(history.canEnter(algebra), false); assert.equal(history.canReturn, false);
  const child = { definition: algebra, journey: { distance: 13 } };
  history.push(child); history.busy = false;
  assert.equal(history.canEnter(child.definition.children[0]), true);
  const nested = { definition: child.definition.children[0] };
  history.push(nested);
  assert.equal(history.layers.length, 3);
  assert.equal(history.pop(), nested); assert.equal(history.active, child);
  assert.equal(history.pop(), child); assert.equal(history.active, root);
  assert.deepEqual(root.journey, { distance: 122, speed: 3.2 });
  assert.equal(history.pop(), null);
});
