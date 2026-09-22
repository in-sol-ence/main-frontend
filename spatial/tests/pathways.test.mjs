import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { concepts, conceptById, pathways } from '../src/concepts.js';
import { hierarchyFor } from '../src/hierarchy.js';
import { pathwayPoint, pathwaySpan, pathwayPresence } from '../src/pathway-layout.js';
import { pathwayGeometry } from '../src/pathways.js';
import { createArcTable, pointAt, tangentAt, PERIOD } from '../src/trajectory.js';
import { CameraRig } from '../src/camera.js';

const arc = createArcTable();
test('prerequisites resolve, are acyclic, and selective pathways encode real prerequisites', () => {
  const visiting = new Set(), complete = new Set();
  function visit(id) {
    assert.ok(!visiting.has(id), 'Prerequisite cycle');
    if (complete.has(id)) return;
    const concept = conceptById.get(id); assert.ok(concept);
    assert.ok(concept.importance >= 0 && concept.importance <= 1);
    visiting.add(id);
    concept.prerequisites.forEach(visit);
    visiting.delete(id); complete.add(id);
  }
  concepts.forEach(c => visit(c.id));
  assert.ok(pathways.length < concepts.reduce((n, c) => n + c.prerequisites.length, 0));
  for (const pathway of pathways) {
    assert.ok(conceptById.get(pathway.target).prerequisites.includes(pathway.source));
    assert.ok(conceptById.get(pathway.source).at < conceptById.get(pathway.target).at);
  }
  for (const target of ['optimization', 'reinforcement-learning']) {
    assert.equal(pathways.filter(p => p.target === target).length, 2);
  }
});

test('goal hierarchy is meaningfully stronger without giving supporting concepts illumination', () => {
  const minor = hierarchyFor(conceptById.get('foundations'));
  const supporting = hierarchyFor(conceptById.get('probability'));
  const major = hierarchyFor(conceptById.get('mdp'));
  const goal = hierarchyFor(conceptById.get('reinforcement-learning'));
  assert.ok(goal.weight > supporting.weight * 1.7);
  assert.ok(goal.markerRadius > minor.markerRadius * 2.5);
  assert.ok(major.brightness > supporting.brightness);
  assert.equal(supporting.illumination, 0);
  assert.ok(goal.illumination < .06);
});

test('secondary threads merge with correct endpoints and tangents, with real spatial relief', () => {
  for (const pathway of pathways) {
    const span = pathwaySpan(pathway, arc);
    for (const [u, distance] of [[0, span.start], [1, span.end]]) {
      const station = arc.stationAtDistance(distance);
      const end = pathwayPoint(pathway, arc, u);
      const root = pointAt(station, new THREE.Vector3());
      assert.ok(end.distanceTo(root) < 1e-8);
      const a = pathwayPoint(pathway, arc, Math.max(0, u - .00001));
      const b = pathwayPoint(pathway, arc, Math.min(1, u + .00001));
      const tangent = tangentAt(station, new THREE.Vector3());
      assert.ok(b.sub(a).normalize().dot(tangent) > .9999);
    }
    const middle = pathwayPoint(pathway, arc, .5);
    const primary = pointAt(arc.stationAtDistance((span.start + span.end) / 2), new THREE.Vector3());
    assert.ok(middle.distanceTo(primary) > 3);
    assert.ok(Math.abs(middle.y - primary.y) > 1);
    const next = pathwayPoint(pathway, arc, .5, 1);
    assert.ok(next.distanceTo(middle.clone().add(new THREE.Vector3(0, 0, -PERIOD))) < 1e-8);
  }
});

test('pathway geometry stays finite and visibility enters and exits smoothly', () => {
  for (const pathway of pathways) {
    const geometry = pathwayGeometry(pathway, arc);
    for (const attribute of Object.values(geometry.attributes)) {
      for (const value of attribute.array) assert.ok(Number.isFinite(value));
    }
    const span = pathwaySpan(pathway, arc);
    assert.equal(pathwayPresence(pathway, arc, span.start - 101), 0);
    assert.equal(pathwayPresence(pathway, arc, span.end + 30), 0);
    let previous = 0;
    for (let distance = span.start - 101; distance < span.end + 30; distance += .1) {
      const opacity = pathwayPresence(pathway, arc, distance);
      assert.ok(Math.abs(opacity - previous) < .01);
      previous = opacity;
    }
    geometry.dispose();
  }
});

test('every supporting pathway separates visibly from the ribbon in the traveling camera', () => {
  for (const pathway of pathways) {
    const span = pathwaySpan(pathway, arc);
    const camera = new THREE.PerspectiveCamera(53, 16 / 9, .08, 290);
    const rig = new CameraRig(camera);
    let seen = false;
    for (let distance = span.start - 30; distance < span.end - 6; distance += 2) {
      rig.update(arc.stationAtDistance(distance), 1 / 3);
      camera.updateMatrixWorld();
      for (const u of [.3, .5, .7]) {
        const p = pathwayPoint(pathway, arc, u).project(camera);
        const primary = pointAt(arc.stationAtDistance(span.start + (span.end - span.start) * u), new THREE.Vector3()).project(camera);
        const gap = Math.hypot((p.x - primary.x) * 640, (p.y - primary.y) * 360);
        if (p.z > -1 && p.z < 1 && Math.abs(p.x) < .9 && Math.abs(p.y) < .9 && gap > 15) seen = true;
      }
    }
    assert.ok(seen, `${pathway.id} does not read from the journey camera`);
  }
});
