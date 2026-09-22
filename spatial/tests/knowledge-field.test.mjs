import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { createKnowledgeField, openingPose, discoveryPose, FIELD_STRANDS, FIELD_SEGMENTS, sampleFlow, flowLife } from '../src/knowledge-field.js';
import { constructionAt, DISCOVERY_DURATION } from '../src/entry.js';
import { CameraRig } from '../src/camera.js';
import { createArcTable, pointAt } from '../src/trajectory.js';

function destination(distance = 8) {
  const camera = new THREE.PerspectiveCamera(53, 16 / 9, .08, 290);
  const rig = new CameraRig(camera); rig.update(createArcTable().stationAtDistance(distance), 0);
  return { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
}

test('knowledge field is a single bounded mesh of curved strips, without particles or nodes', () => {
  const field = createKnowledgeField();
  assert.equal(field.scene.children.length, 1);
  const mesh = field.scene.children[0]; assert.equal(mesh.type, 'Mesh');
  assert.equal(field.geometry.attributes.position.count, FIELD_STRANDS * (FIELD_SEGMENTS + 1) * 2);
  assert.equal(field.geometry.index.count, FIELD_STRANDS * FIELD_SEGMENTS * 6);
  for (const attribute of Object.values(field.geometry.attributes)) assert.ok([...attribute.array].every(Number.isFinite));
  assert.ok(Math.max(...field.geometry.index.array) < field.geometry.attributes.position.count);
  assert.equal(field.material.depthWrite, false);
  field.dispose(); assert.equal(field.scene.children.length, 0);
});

test('selected strand uses the exact existing trajectory for every personalized starting point', () => {
  const field = createKnowledgeField(), expected = new THREE.Vector3();
  for (const start of [8, 29, 55]) {
    field.select(start);
    const positions = field.geometry.attributes.aSelected;
    for (let i = 0; i <= FIELD_SEGMENTS; i += 8) {
      pointAt(start - 64 + i / FIELD_SEGMENTS * 290, expected);
      const selectedVertex = (29 * (FIELD_SEGMENTS + 1) + i) * 2;
      assert.ok(new THREE.Vector3().fromBufferAttribute(positions, selectedVertex).distanceTo(expected) < .0001);
    }
  }
  field.dispose();
});

test('discovery departs forward, reaches the native camera exactly, and has no endpoint jump', () => {
  const from = openingPose();
  for (const distance of [8, 29, 55]) {
    const to = destination(distance);
    const start = discoveryPose(from, to, 0), end = discoveryPose(from, to, 1);
    assert.ok(start.position.distanceTo(from.position) < 1e-10);
    assert.ok(end.position.distanceTo(to.position) < 1e-10);
    assert.ok(end.quaternion.angleTo(to.quaternion) < 1e-7);
    const departure = discoveryPose(from, to, .1).position.sub(from.position);
    assert.ok(departure.dot(new THREE.Vector3(0, 0, -1).applyQuaternion(from.quaternion)) > 0);
    let previous = start;
    for (let time = 1 / 60; time <= DISCOVERY_DURATION; time += 1 / 60) {
      const pose = discoveryPose(from, to, constructionAt(time).camera);
      assert.ok(pose.position.toArray().every(Number.isFinite));
      assert.ok(pose.position.distanceTo(previous.position) < 1.2);
      assert.ok(pose.quaternion.angleTo(previous.quaternion) < .015);
      previous = pose;
    }
    assert.ok(discoveryPose(from, to, .9999).position.distanceTo(end.position) < .00001);
  }
});

test('handoff tracks a moving destination rather than resetting native journey motion', () => {
  const from = openingPose(), a = destination(9), b = destination(9.04);
  const outA = discoveryPose(from, a, 1), outB = discoveryPose(from, b, 1);
  assert.ok(outB.position.clone().sub(outA.position).distanceTo(b.position.clone().sub(a.position)) < 1e-10);
  assert.ok(outB.quaternion.angleTo(b.quaternion) < 1e-7);
});

test('reduced motion freezes field drift and hides the scene during its pose switch', () => {
  const field = createKnowledgeField(), pose = openingPose();
  field.update(2, pose); const time = field.material.uniforms.time.value;
  for (let i = 0; i < 60; i++) field.update(1 / 60, pose, { reduced: true });
  assert.equal(field.material.uniforms.time.value, time);
  const before = constructionAt(.699, true), after = constructionAt(.7, true);
  assert.equal(before.camera, 0); assert.equal(after.camera, 1);
  assert.equal(before.field, 0); assert.equal(after.arrival, 0);
  assert.equal(constructionAt(1.4, true).travel, 0);
  field.dispose();
});

test('resizing and repeated field selection reuse geometry and release owned resources', () => {
  const field = createKnowledgeField(), geometry = field.geometry;
  field.resize(390, 844); assert.equal(field.camera.fov, 67);
  field.promptBounds({ left: 22, top: 240, width: 346, height: 290 }, 390, 844);
  assert.ok(field.material.uniforms.promptSize.value.toArray().every(Number.isFinite));
  for (let i = 0; i < 10; i++) { field.select(i * 4); field.update(.016, openingPose(), constructionAt(i)); }
  assert.equal(field.geometry, geometry);
  field.resize(1280, 720); assert.equal(field.camera.fov, 53);
  let disposed = 0;
  geometry.addEventListener('dispose', () => disposed++); field.material.addEventListener('dispose', () => disposed++);
  field.dispose(); assert.equal(disposed, 2);
});


test('ambient geometry travels in depth and changes curvature rather than translating a static cage', () => {
  let depthChanges=0, shapeChanges=0;
  for(let line=0;line<FIELD_STRANDS;line++) {
    const a=sampleFlow(line,.3,4),b=sampleFlow(line,.65,4),c=sampleFlow(line,.3,7),d=sampleFlow(line,.65,7);
    if(Math.abs(a.z-c.z)>2)depthChanges++;
    if(Math.abs(a.distanceTo(b)-c.distanceTo(d))>.5)shapeChanges++;
  }
  assert.ok(depthChanges>40);assert.ok(shapeChanges>40);
});

test('lifecycle replacements occur only while invisible and selected geometry is not created on submit', () => {
  for(let line=0;line<FIELD_STRANDS;line++)for(let t=0;t<80;t+=.25) {
    const a=sampleFlow(line,.4,t),b=sampleFlow(line,.4,t+.001);
    if(a.distanceTo(b)>2){assert.ok(flowLife(line,t)<.001);assert.ok(flowLife(line,t+.001)<.001);}
  }
  const field=createKnowledgeField();field.update(3,openingPose());
  const before=field.geometry.attributes.position.array.slice(),mesh=field.scene.children[0];
  field.select(29);assert.equal(field.scene.children[0],mesh);
  assert.deepEqual(field.geometry.attributes.position.array,before);
  assert.ok(flowLife(field.selectedLine,3)>.9);field.dispose();
});

test('native ribbon handoff begins only once the ambient strand is aligned, before landmarks', () => {
  for(let t=0;t<DISCOVERY_DURATION;t+=.01){const s=constructionAt(t);if(s.handoff>0)assert.ok(s.convergence>=.82);if(s.labels>0)assert.ok(s.handoff>.15);}
  assert.equal(constructionAt(DISCOVERY_DURATION).handoff,1);
});

test('selection-guided camera remains continuous and exactly preserves endpoint poses', () => {
  const f=createKnowledgeField(),from=openingPose(),to=destination(29);f.select(29);let prev=from;
  for(let t=0;t<=DISCOVERY_DURATION;t+=1/60){const s=constructionAt(t);const pose=discoveryPose(from,to,s.camera,f.guide(s.convergence));assert.ok(pose.position.distanceTo(prev.position)<1.2);assert.ok(pose.quaternion.angleTo(prev.quaternion)<.025);f.update(1/60,pose,s);prev=pose;}
  const end=discoveryPose(from,to,1,f.guide(1));assert.ok(end.position.distanceTo(to.position)<1e-9);assert.ok(end.quaternion.angleTo(to.quaternion)<1e-7);f.dispose();
});
