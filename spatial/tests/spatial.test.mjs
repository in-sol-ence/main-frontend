import test from 'node:test';
import assert from 'node:assert/strict';
import { pointAt, tangentAt, createArcTable, PERIOD, SPACING } from '../src/trajectory.js';
import { Journey, dampSpring } from '../src/motion.js';

test('trajectory repeats without a position or tangent seam', () => {
  for (let s = -PERIOD; s < PERIOD; s += 3.7) {
    const a = pointAt(s), b = pointAt(s + PERIOD);
    assert.ok(Math.abs(a.x - b.x) < 1e-10);
    assert.ok(Math.abs(a.y - b.y) < 1e-10);
    assert.ok(Math.abs(a.z - b.z - PERIOD) < 1e-10);
    const ta = tangentAt(s), tb = tangentAt(s + PERIOD);
    assert.ok(Math.hypot(ta.x - tb.x, ta.y - tb.y, ta.z - tb.z) < 1e-10);
  }
});

test('knot transitions have continuous tangents and remain forward-facing', () => {
  for (let s = -PERIOD; s <= PERIOD; s += SPACING) {
    const a = tangentAt(s - .0001), b = tangentAt(s + .0001);
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < .0001);
    assert.ok(a.z < -.6);
  }
});

test('arc-length speed is uniform through bends and across repeated periods', () => {
  const arc = createArcTable();
  for (let distance = -10; distance < arc.length * 3; distance += .81) {
    const a = pointAt(arc.stationAtDistance(distance));
    const b = pointAt(arc.stationAtDistance(distance + .1));
    const step = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    assert.ok(Math.abs(step - .1) < .0001, `Unexpected step: ${step}`);
  }
});

test('speed starts at rest and smoothly slows for a custom zone', () => {
  const journey = new Journey({ speedAt: () => 1 });
  journey.update(1 / 60);
  assert.ok(journey.speed < .001);
  for (let i = 0; i < 900; i++) journey.update(1 / 60);
  assert.ok(journey.speed > 2.59 && journey.speed <= 2.6);
  journey.speedAt = () => .2;
  const previous = journey.speed;
  journey.update(1 / 60);
  assert.ok(journey.speed < previous && journey.speed > previous - .01);
  for (let i = 0; i < 600; i++) journey.update(1 / 60);
  assert.ok(Math.abs(journey.speed - .52) < .001);
});

test('motion is stable across frame rates, paused time, and a long background frame', () => {
  const a = new Journey(), b = new Journey();
  for (let i = 0; i < 60 * 40; i++) a.update(1 / 60);
  for (let i = 0; i < 120 * 40; i++) b.update(1 / 120);
  assert.ok(Math.abs(a.distance - b.distance) < .05);
  const previous = a.distance;
  a.update(600, true); assert.equal(a.distance, previous);
  a.update(600); assert.ok(a.distance - previous < .4);
});

test('analytic spring integrates consistently', () => {
  const one = dampSpring(0, 0, 8, 1.6, 1);
  let two = dampSpring(0, 0, 8, 1.6, .5);
  two = dampSpring(two.value, two.velocity, 8, 1.6, .5);
  assert.ok(Math.abs(one.value - two.value) < 1e-12);
  assert.ok(Math.abs(one.velocity - two.velocity) < 1e-12);
});
