import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { LearnerFocus, pickConcept, focusAppearance } from '../src/focus.js';
import { concepts } from '../src/concepts.js';
import { annotations } from '../src/annotations.js';
import { Journey } from '../src/motion.js';
import { resolveLabels } from '../src/landmark-layout.js';

const camera = new THREE.PerspectiveCamera(53, 1280 / 720, .08, 290);
camera.updateMatrixWorld();
const item = (depth = 30, concept = concepts[3], cycle = 0) => ({
  key: `${cycle}:${concept.id}`, concept, cycle, depth,
  anchor: new THREE.Vector3(0, 0, -depth), foot: new THREE.Vector3(0, -1, -depth),
  presence: .7, labelOpacity: .7, label: { x: 660, y: 330, width: 170, height: 26 },
});
const pick = (pointer, candidates, retainedKey = null) => pickConcept({ pointer, candidates, camera, width: 1280, height: 720, retainedKey });

test('ray hits landmark and stem independently of typography, including distant concepts', () => {
  const target = item(); target.label = null;
  assert.equal(pick({ x: 640, y: 360 }, [target]), target);
  assert.equal(pick({ x: 640, y: 380 }, [target]), target);
  assert.equal(pick({ x: 300, y: 100 }, [target]), null);
  const distant = item(130); distant.label = null;
  assert.equal(pick({ x: 650, y: 360 }, [distant]), distant);
  assert.equal(pick(null, [target]), null);
});

test('overlaps choose nearest physical depth, not list order or importance', () => {
  const near = item(20, concepts[0]), far = item(80, concepts[7]);
  assert.equal(pick({ x: 640, y: 360 }, [far, near]), near);
  assert.equal(pick({ x: 730, y: 340 }, [far, near]), near);
  near.presence = 0; near.labelOpacity = 0;
  assert.equal(pick({ x: 640, y: 360 }, [near, far]), far);
});

test('behind-camera, atmospheric, and hidden text targets are not hoverable', () => {
  for (const depth of [-10, 3, 180]) assert.equal(pick({ x: 640, y: 360 }, [item(depth)]), null);
  const hidden = item(); hidden.labelOpacity = 0;
  assert.equal(pick({ x: 770, y: 340 }, [hidden]), null);
  hidden.presence = .001;
  assert.equal(pick({ x: 640, y: 360 }, [hidden]), null);
});

test('small retention margin prevents boundary chatter but always releases away', () => {
  const target = item(); target.label = null;
  assert.equal(pick({ x: 660, y: 360 }, [target]), null);
  assert.equal(pick({ x: 660, y: 360 }, [target], target.key), target);
  assert.equal(pick({ x: 690, y: 360 }, [target], target.key), null);
});

test('focus eases in/out, switches without snapping, and exactly restores baseline', () => {
  const focus = new LearnerFocus(), a = item(), b = item(65, concepts[4]);
  focus.update(a, 1 / 60);
  assert.ok(focus.strength > 0 && focus.strength < .02);
  for (let i = 0; i < 100; i++) focus.update(a, 1 / 60);
  assert.ok(focus.strength > .99);
  const before = focus.weight(a.key);
  focus.update(b, 1 / 60);
  assert.ok(focus.weight(a.key) > before - .02);
  assert.ok(focus.weight(b.key) < .02);
  for (let i = 0; i < 200; i++) focus.update(null, 1 / 60);
  assert.equal(focus.strength, 0); assert.equal(focus.speedScale, 1);
  assert.equal(focus.entries.size, 0); assert.equal(focus.targetKey, null);
});

test('focus honors hierarchy and prerequisites without affecting another repeated cycle', () => {
  const focus = new LearnerFocus(), target = item();
  for (let i = 0; i < 100; i++) focus.update(target, 1 / 60);
  assert.ok(focusAppearance(focus, concepts[3], 0).scale > 1.13);
  assert.ok(focusAppearance(focus, concepts[0], 0).presence < .71);
  assert.equal(focusAppearance(focus, concepts[2], 0).presence, 1);
  assert.ok(focus.pathway('linear-algebra', 'optimization', 0) > .99);
  assert.equal(focus.pathway('mdp', 'policy-value', 0), 0);
  assert.equal(focus.weight('1:optimization'), 0);
  assert.equal(focus.pathway('linear-algebra', 'optimization', 1), 0);
  focus.reset(); assert.equal(focus.speedScale, 1);
});

test('journey slows without a stop or reset, recovers, and is frame-rate stable', () => {
  const run = hz => {
    const focus = new LearnerFocus(), target = item(30, concepts[7]);
    const journey = new Journey({ speedAt: () => .3 * focus.speedScale });
    let minimum = Infinity, peakAcceleration = 0, previous = 0;
    for (let i = 0; i < hz * 30; i++) {
      const time = i / hz;
      focus.update(time >= 8 && time < 18 ? target : null, 1 / hz);
      journey.update(1 / hz);
      assert.ok(journey.distance >= previous); previous = journey.distance;
      if (time > 8) minimum = Math.min(minimum, journey.speed);
      peakAcceleration = Math.max(peakAcceleration, Math.abs(journey.acceleration));
    }
    assert.ok(minimum > .32 && minimum < .40);
    assert.ok(journey.speed > .77); assert.ok(peakAcceleration < 1);
    return journey.distance;
  };
  assert.ok(Math.abs(run(60) - run(120)) < .1);
});

test('all concepts have brief editorial context, without changing importance or positions', () => {
  for (const concept of concepts) {
    assert.ok(annotations[concept.id].category.length < 55);
    assert.ok(annotations[concept.id].detail.length < 65);
  }
});

test('visible annotation retains focus; its space stays clear of other labels', () => {
  const target = item();
  target.annotation = { x: 660, y: 270, width: 200, height: 60 };
  assert.equal(pick({ x: 730, y: 290 }, [target], target.key), target);
  const focused = { depth: 35, opacity: .8, x: 660, y: 330, width: 170, height: 26, learner: { weight: 1 }, annotationBounds: target.annotation };
  const other = { depth: 30, opacity: .7, x: 730, y: 285, width: 140, height: 24 };
  resolveLabels([other, focused], 1280, 720);
  assert.equal(other.targetOpacity, 0);
  assert.equal(focused.targetOpacity, .8);
});
