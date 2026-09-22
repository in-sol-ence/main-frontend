import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { knowledge, sampleKnowledge } from '../src/knowledge.js';
import { compileKnowledge, indexKnowledge } from '../src/knowledge-model.js';
import { createArcTable } from '../src/trajectory.js';
import { locateConcept } from '../src/landmark-layout.js';
import { CameraRig } from '../src/camera.js';
import { frameAtConcept, identityFrame, worldPose, localPose, ExplorationHistory } from '../src/exploration.js';
import { encounterAt, createChoreography } from '../src/choreography.js';

const node = (id, prerequisites = [], children = []) => ({ id, title: `Sample ${id}`, domain: 'mathematics', importance: .6, description: `A short explanation of ${id}.`, prerequisites, children });

test('one serializable node contract covers every region and parent link', () => {
  const index = indexKnowledge(knowledge);
  assert.equal(index.size, 111);
  assert.equal(knowledge.parent, null);
  for (const item of index.values()) {
    for (const field of ['id', 'title', 'domain', 'importance', 'description', 'prerequisites', 'children', 'parent']) assert.ok(Object.hasOwn(item, field));
    assert.ok(Array.isArray(item.children));
    assert.equal(item.annotation.detail, item.description);
    if (item.parent !== null) assert.ok(index.get(item.parent).children.includes(item));
  }
  assert.equal(indexKnowledge(compileKnowledge(JSON.parse(JSON.stringify(sampleKnowledge)))).size, 111);
});

test('all major branches work, including three successive entries into vector components', () => {
  for (const id of ['probability', 'linear-algebra', 'optimization', 'mdp', 'q-learning', 'policy-value']) {
    assert.ok(knowledge.children.find(item => item.id === id).children.length >= 3);
  }
  const history = new ExplorationHistory({ definition: knowledge, distance: 91 });
  for (const id of ['linear-algebra', 'vectors', 'components', 'component-coordinates']) {
    const selected = history.active.definition.children.find(item => item.id === id);
    assert.ok(history.canEnter(selected)); history.push({ definition: selected });
  }
  for (const expected of ['components', 'vectors', 'linear-algebra', 'rl-journey']) {
    history.pop(); assert.equal(history.active.definition.id, expected);
  }
  assert.equal(history.active.distance, 91);
});

test('unfamiliar content receives generic layout, ordering, and relationships', () => {
  const input = node('unrelated-root', [], [node('beta', ['alpha'], [node('nested-one'), node('nested-two', ['nested-one'])]), node('alpha')]);
  const result = compileKnowledge(input);
  assert.deepEqual(result.children.map(item => item.id), ['alpha', 'beta']);
  assert.ok(result.children[0].at < result.children[1].at);
  assert.deepEqual(result.children[0].lines, ['Sample alpha']);
  assert.equal(result.pathways[0].source, 'alpha');
  assert.equal(result.pathways[0].target, 'beta');
  assert.equal(result.children[1].pathways[0].source, 'nested-one');
  assert.equal(input.children[0].parent, undefined);
});

test('malformed maps fail before rendering instead of creating broken journeys', () => {
  assert.throws(() => compileKnowledge(node('root', [], [node('same'), node('same')])), /duplicate/);
  assert.throws(() => compileKnowledge(node('root', [], [node('a', ['missing'])])), /Unresolved/);
  assert.throws(() => compileKnowledge(node('root', [], [node('a', ['b']), node('b', ['a'])])), /cycle/);
  assert.throws(() => compileKnowledge({ ...node('root'), importance: NaN }), /importance/);
  assert.throws(() => compileKnowledge({ ...node('root'), domain: 'unregistered' }), /domain/);
  assert.throws(() => compileKnowledge({ ...node('root'), children: {} }), /array/);
  assert.throws(() => compileKnowledge({ ...node('root'), pathways: {} }), /array/);
  assert.throws(() => compileKnowledge({ ...node('root'), startDistance: Infinity }), /distance/);
  assert.throws(() => compileKnowledge({ ...node('root'), layout: { lines: 'not-an-array' } }), /lines/);
  assert.throws(() => compileKnowledge({ ...node('root'), layout: { side: 9 } }), /side/);
  const cyclic = node('cycle'); cyclic.children.push(cyclic);
  assert.throws(() => compileKnowledge(cyclic), /acyclic/);
});

test('importance and bounded relationship density carry through every depth', () => {
  const arc = createArcTable();
  for (const region of indexKnowledge(knowledge).values()) {
    if (!region.children.length) continue;
    assert.ok(region.children.length <= 8);
    assert.ok(region.pathways.length <= region.children.length + 1);
    const weights = region.children.map(item => item.importance);
    assert.ok(Math.max(...weights) > Math.min(...weights));
    const choreography = createChoreography({ concepts: region.children, arc });
    for (const item of region.children) {
      const sample = choreography.speedScale(item.at * arc.length - 20);
      assert.ok(sample >= .299 && sample <= 1);
      assert.ok(encounterAt(item, 20).speedScale < 1);
    }
  }
});

test('nested scale shrinks smoothly while anchors, projection, and hit coordinates stay consistent', () => {
  const arc = createArcTable();
  const localCamera = new THREE.PerspectiveCamera(53, 16 / 9, .08, 290);
  new CameraRig(localCamera).update(arc.stationAtDistance(13), 0);
  let frame = identityFrame(), parent = knowledge;
  let pose = worldPose(localCamera, frame);
  for (const id of ['linear-algebra', 'vectors', 'components']) {
    const selected = parent.children.find(item => item.id === id);
    const location = locateConcept(selected, 0, arc);
    const anchor = location.root.clone().multiplyScalar(frame.scale).applyQuaternion(frame.rotation).add(frame.position);
    const oldScale = frame.scale;
    const next = frameAtConcept(frame, location, pose, localCamera);
    frame = next.frame;
    assert.ok(Math.abs(frame.scale / oldScale - .82) < 1e-12);
    pose = worldPose(localCamera, frame);
    const view = localCamera.clone(); localPose(pose, frame, view);
    assert.ok(view.position.distanceTo(localCamera.position) < 1e-8);
    const worldCamera = localCamera.clone();
    worldCamera.position.copy(pose.position); worldCamera.quaternion.copy(pose.quaternion); worldCamera.updateMatrixWorld();
    const point = new THREE.Vector3(5, 1, -80);
    const globalPoint = point.clone().multiplyScalar(frame.scale).applyQuaternion(frame.rotation).add(frame.position);
    assert.ok(point.clone().project(view).distanceTo(globalPoint.project(worldCamera)) < 1e-7);
    const entrance = new THREE.Vector3();
    // frameAtConcept exposes a portal directly above its physical origin.
    entrance.copy(next.portal); entrance.y -= 2.35 * frame.scale;
    assert.ok(entrance.distanceTo(anchor) < 1e-8);
    parent = selected;
  }
});
