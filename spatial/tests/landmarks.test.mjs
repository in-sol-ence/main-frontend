import test from 'node:test';
import assert from 'node:assert/strict';
import { concepts, domains } from '../src/concepts.js';
import { createArcTable, PERIOD, pointAt } from '../src/trajectory.js';
import { locateConcept, appearanceAt, resolveLabels, overlap, cycleForSlot, chooseLabelSide } from '../src/landmark-layout.js';

test('portrait labels can face inward but never jump sides while visible', () => {
  const layout = { side: 1, x: 300, labelWidth: 175, gap: 12, width: 390, opacity: 0, immediate: false };
  assert.equal(chooseLabelSide(layout), -1);
  assert.equal(chooseLabelSide({ ...layout, opacity: .8 }), 1);
  assert.equal(chooseLabelSide({ ...layout, opacity: .8, immediate: true }), -1);
  assert.equal(chooseLabelSide({ ...layout, x: 195, labelWidth: 240 }), 0);
  assert.equal(chooseLabelSide({ ...layout, x: 195, labelWidth: 240, opacity: .8 }), 1);
});

test('loop pooling never relocates landmarks that are still ahead of the camera', () => {
  for (let cycle = -2; cycle < 20; cycle++) {
    const assignments = [0, 1, 2].map(slot => cycleForSlot(slot, cycle)).sort((a, b) => a - b);
    assert.deepEqual(assignments, [cycle - 1, cycle, cycle + 1]);
    for (let slot = 0; slot < 3; slot++) {
      const before = cycleForSlot(slot, cycle);
      const after = cycleForSlot(slot, cycle + 1);
      if (before >= cycle) assert.equal(after, before);
    }
  }
});

test('eight distinct concept locations are ordered with quiet spacing', () => {
  assert.equal(concepts.length, 8);
  assert.equal(new Set(concepts.map(c => c.id)).size, 8);
  const arc = createArcTable();
  concepts.forEach((concept, index) => {
    assert.ok(domains[concept.domain]);
    assert.equal(concept.lines.join(' '), concept.title);
    assert.ok(concept.at > 0 && concept.at < 1);
    if (index) assert.ok((concept.at - concepts[index - 1].at) * arc.length > 30);
  });
});

test('landmarks are attached to the existing spline, with bounded side offsets', () => {
  const arc = createArcTable();
  for (const concept of concepts) {
    const p = locateConcept(concept, 0, arc);
    const root = pointAt(p.station);
    assert.ok(Math.hypot(root.x - p.root.x, root.y - p.root.y, root.z - p.root.z) < 1e-10);
    assert.ok(Math.abs(p.foot.distanceTo(p.root) - Math.abs(concept.offset)) < 1e-10);
    assert.ok(p.anchor.distanceTo(p.root) < 1.5);
    const next = locateConcept(concept, 1, arc);
    assert.ok(Math.abs(next.anchor.x - p.anchor.x) < 1e-8);
    assert.ok(Math.abs(next.anchor.y - p.anchor.y) < 1e-8);
    assert.ok(Math.abs(next.anchor.z - p.anchor.z + PERIOD) < 1e-8);
  }
});

test('near labels are stronger; distant labels recede; passed labels disappear', () => {
  const near = appearanceAt(22, 1, 720), far = appearanceAt(85, 1, 720);
  assert.ok(near.size > far.size * 1.8);
  assert.ok(near.opacity > far.opacity);
  assert.equal(appearanceAt(-1, 1, 720).opacity, 0);
  assert.equal(appearanceAt(2, 1, 720).opacity, 0);
  assert.equal(appearanceAt(200, 1, 720).opacity, 0);
  assert.ok(appearanceAt(22, 1.35, 720).size > near.size);
});

test('label collisions yield to the nearest location without moving labels', () => {
  const labels = [
    { x: 100, y: 100, width: 120, height: 30, depth: 65, opacity: .4 },
    { x: 110, y: 103, width: 130, height: 30, depth: 20, opacity: .9 },
    { x: 700, y: 220, width: 130, height: 25, depth: 90, opacity: .3 },
  ];
  resolveLabels(labels, 1280, 720);
  assert.equal(labels[0].targetOpacity, 0);
  assert.equal(labels[1].targetOpacity, .9);
  assert.equal(labels[2].targetOpacity, .3);
  assert.equal(labels[0].x, 100);
  assert.ok(overlap(labels[0], labels[1]));
  const edge = [{ x: -100, y: 100, width: 120, height: 30, depth: 20, opacity: .9 }];
  resolveLabels(edge, 390, 844);
  assert.equal(edge[0].targetOpacity, 0);
});
