import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { concepts, conceptById } from '../src/concepts.js';
import { createArcTable, tangentAt } from '../src/trajectory.js';
import { createChoreography, encounterAt, landmarkAttention } from '../src/choreography.js';
import { CameraRig, MAX_ATTENTION_ANGLE } from '../src/camera.js';
import { Journey } from '../src/motion.js';

const arc = createArcTable();
const choreography = createChoreography({ concepts, arc });
function speedAt(distance) {
  const station = arc.stationAtDistance(distance);
  const a = tangentAt(station), b = tangentAt(station + 16);
  const turn = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  return Math.min(1 - Math.min(.42, turn * .65), choreography.speedScale(distance));
}

test('importance produces distinct continuous speed envelopes, never stop cues', () => {
  const atPeak = concepts.map(c => encounterAt(c, 22).speedScale);
  assert.ok(atPeak[0] > .9);
  assert.ok(atPeak[1] > .7);
  assert.ok(atPeak[3] < .52);
  assert.ok(atPeak[4] < atPeak[3]);
  assert.ok(Math.abs(atPeak[7] - .3) < 1e-10);
  for (const concept of concepts) {
    assert.equal(encounterAt(concept, 90).speedScale, 1);
    assert.equal(encounterAt(concept, -30).speedScale, 1);
    let previous = 1;
    for (let ahead = 90; ahead > -30; ahead -= .02) {
      const scale = encounterAt(concept, ahead).speedScale;
      assert.ok(scale >= .299 && scale <= 1);
      assert.ok(Math.abs(scale - previous) < .003);
      previous = scale;
    }
  }
});

test('encounters repeat continuously, including negative and future cycles', () => {
  for (let d = -20; d < arc.length; d += 1.1) {
    assert.ok(Math.abs(choreography.speedScale(d) - choreography.speedScale(d + arc.length)) < 1e-10);
  }
  const goalDistance = conceptById.get('reinforcement-learning').at * arc.length - 28;
  const a = choreography.sample(goalDistance), b = choreography.sample(goalDistance + arc.length);
  assert.ok(Math.abs(a.attention.strength - b.attention.strength) < 1e-10);
  assert.ok(Math.abs(a.attention.point.x - b.attention.point.x) < 1e-8);
});

test('real motor gives milestones breathing room, keeps moving, and recovers afterward', t => {
  const journey = new Journey({ startDistance: 39, speedAt });
  const exposures = new Map(concepts.map(c => [c.id, 0]));
  let maximumAcceleration = 0, minimumCruisingSpeed = Infinity, recoverySpeed = 0;
  for (let i = 0; i < 60 * 500 && journey.distance < arc.length + 35; i++) {
    journey.update(1 / 60);
    maximumAcceleration = Math.max(maximumAcceleration, Math.abs(journey.acceleration));
    if (journey.time > 10) minimumCruisingSpeed = Math.min(minimumCruisingSpeed, journey.speed);
    for (const c of concepts) {
      const ahead = c.at * arc.length - journey.distance;
      if (ahead >= 14 && ahead <= 32) exposures.set(c.id, exposures.get(c.id) + 1 / 60);
    }
    if (journey.distance > 380) recoverySpeed = Math.max(recoverySpeed, journey.speed);
  }
  assert.ok(journey.distance > arc.length, 'Journey must continue beyond the goal.');
  assert.ok(minimumCruisingSpeed > .7, 'Must not stall at landmarks.');
  assert.ok(maximumAcceleration < 3);
  assert.ok(recoverySpeed > 2);
  t.diagnostic(JSON.stringify({ readableSeconds: Object.fromEntries(exposures), minimumCruisingSpeed, maximumAcceleration, recoverySpeed }));
  for (const id of ['optimization', 'mdp', 'reinforcement-learning']) {
    assert.ok(exposures.get(id) > exposures.get('probability') * 1.25, `${id} needs more breathing room`);
  }
  assert.ok(exposures.get('reinforcement-learning') > exposures.get('mdp'));
});

test('attention is bounded, keeps the original position and lens, and never looks back', () => {
  const baselineCamera = new THREE.PerspectiveCamera(53, 16 / 9, .08, 290);
  const attentiveCamera = baselineCamera.clone();
  const baseline = new CameraRig(baselineCamera), attentive = new CameraRig(attentiveCamera);
  const journey = new Journey({ startDistance: 39, speedAt });
  const previous = new THREE.Quaternion(), direction = new THREE.Vector3();
  for (let i = 0; i < 60 * 150; i++) {
    journey.update(1 / 60);
    const station = arc.stationAtDistance(journey.distance);
    baseline.update(station, 1 / 60);
    attentive.update(station, 1 / 60, choreography.sample(journey.distance).attention);
    assert.ok(attentiveCamera.position.distanceTo(baselineCamera.position) < 1e-10);
    assert.equal(attentiveCamera.fov, baselineCamera.fov);
    assert.ok(attentiveCamera.quaternion.angleTo(baselineCamera.quaternion) < MAX_ATTENTION_ANGLE + .001);
    attentiveCamera.getWorldDirection(direction);
    assert.ok(direction.z < -.45);
    if (i) assert.ok(attentiveCamera.quaternion.angleTo(previous) < .012);
    previous.copy(attentiveCamera.quaternion);
  }
});

test('near focus is subtle, distant markers stay contextual, and passed concepts recede', () => {
  const goal = conceptById.get('reinforcement-learning');
  const minor = conceptById.get('foundations');
  assert.ok(landmarkAttention(goal, 24, 1).opacity > 1);
  assert.ok(landmarkAttention(goal, 24, 1).scale <= 1.06);
  assert.ok(landmarkAttention(minor, 55, 1).opacity < 1);
  assert.equal(landmarkAttention(goal, -20, 0).opacity, 0);
  assert.equal(encounterAt(goal, 2).gaze, 0);
  assert.equal(encounterAt(goal, -20).gaze, 0);
});

test('choreography is frame-rate stable and pause/reset do not advance knowledge', () => {
  const a = new Journey({ startDistance: 39, speedAt }), b = new Journey({ startDistance: 39, speedAt });
  for (let i = 0; i < 60 * 100; i++) a.update(1 / 60);
  for (let i = 0; i < 120 * 100; i++) b.update(1 / 120);
  assert.ok(Math.abs(a.distance - b.distance) < .2);
  const distance = a.distance;
  a.update(900, true); assert.equal(a.distance, distance);
  a.reset(); assert.equal(a.distance, 39); assert.equal(a.speed, 0);
});
