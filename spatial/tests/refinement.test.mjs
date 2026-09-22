import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { hierarchyFor } from '../src/hierarchy.js';
import { appearanceAt } from '../src/landmark-layout.js';
import { compileKnowledge } from '../src/knowledge-model.js';
import { knowledge } from '../src/knowledge.js';
import { createArcTable } from '../src/trajectory.js';
import { createChoreography } from '../src/choreography.js';
import { createPathways } from '../src/pathways.js';
import { LearnerFocus } from '../src/focus.js';
import { layerReveal } from '../src/exploration.js';

test('importance and physical distance produce distinct, unclamped distant type', () => {
  const minor = hierarchyFor({ importance: .25, role: 'minor' });
  const major = hierarchyFor({ importance: .95, role: 'milestone' });
  assert.ok(major.weight > minor.weight * 3);
  assert.equal(minor.illumination, 0); assert.ok(major.illumination < .06);
  for (const height of [720, 844, 1080]) {
    const near = appearanceAt(30, major.weight, height);
    const far = appearanceAt(120, major.weight, height);
    assert.ok(near.size > far.size * 2.7);
    assert.ok(near.opacity > far.opacity * 2);
    assert.ok(appearanceAt(150, minor.weight, height).size < 8);
  }
});

test('default regions have reproducible uneven spacing without changing the authored RL placements', () => {
  const child = (id, importance) => ({ id, importance, domain: 'mathematics', title: id, description: '', children: [] });
  const input = { ...child('root', 1), children: [child('one', .3), child('two', .5), child('three', 1), child('four', .4), child('five', .9)] };
  const first = compileKnowledge(input), second = compileKnowledge(input);
  assert.deepEqual(first, second);
  const gaps = first.children.slice(1).map((node, i) => node.at - first.children[i].at);
  assert.ok(Math.max(...gaps) - Math.min(...gaps) > .025);
  assert.ok(gaps.every(gap => gap > .1));
  assert.ok(first.children.every(node => Math.abs(node.offset) < .4 && node.height < 1.4));
  for (const node of knowledge.children) assert.equal(node.at, node.layout.at);
});

test('local domain illumination is bounded and disappears away from encounters', () => {
  const arc = createArcTable(), choreography = createChoreography({ concepts: knowledge.children, arc });
  for (let distance = 0; distance < arc.length; distance += 2) {
    const light = choreography.sample(distance).illumination;
    assert.ok(light.strength >= 0 && light.strength <= 1);
    assert.ok(light.point.toArray().every(Number.isFinite));
    assert.ok(light.tint.toArray().every(value => value >= 0 && value <= 1));
  }
  assert.equal(createChoreography({ concepts: [], arc }).sample(0).illumination.strength, 0);
});

test('dense prerequisite trajectories obey a smooth visual budget without adding geometry', () => {
  const scene = new THREE.Scene(), arc = createArcTable();
  const lookup = new Map(knowledge.children.map(node => [node.id, node]));
  const paths = createPathways({ scene, arc, pathways: knowledge.pathways, conceptById: lookup });
  const camera = new THREE.PerspectiveCamera();
  const meshes = scene.children[0].children;
  assert.equal(meshes.length, knowledge.pathways.length * 3);
  for (let distance = 0; distance < arc.length; distance += 3) {
    paths.update({ distance, camera, width: 1280, height: 720, dt: 1 / 60 });
    assert.ok(meshes.reduce((sum, mesh) => sum + mesh.material.uniforms.strength.value, 0) <= 2.300001);
  }
  paths.dispose(); assert.equal(scene.children.length, 0);
});

test('hover responds within a quarter second and recursive reveals leave quieter overlap', () => {
  const focus = new LearnerFocus();
  for (let i = 0; i < 15; i++) focus.update({ key: '0:test', concept: knowledge.children[4], cycle: 0 }, 1 / 60);
  assert.ok(focus.strength > .6 && focus.strength < .8);
  let previousParent = 1, previousChild = 0;
  for (let progress = 0; progress < 1; progress += .01) {
    const reveal = layerReveal(progress);
    assert.ok(reveal.parent <= previousParent && reveal.child >= previousChild);
    assert.ok(reveal.parent + reveal.child >= .4);
    previousParent = reveal.parent; previousChild = reveal.child;
  }
  assert.ok(layerReveal(.5).child < .3);
  assert.equal(layerReveal(1).child, 1);
});
