import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { createLayer } from '../src/layer.js';
import { knowledge } from '../src/knowledge.js';
import { indexKnowledge } from '../src/knowledge-model.js';
import { locateConcept } from '../src/landmark-layout.js';
import { buildJourney } from '../src/journey-provider.js';

// A minimal typography host keeps this test independent of a browser. Real
// Three.js geometry, cameras, focus, labels, and layer lifecycle still execute;
// WebGL appearance is separately checked in the actual preview.
function element(tag) {
  return {
    tag, children: [], dataset: {}, style: { setProperty(name, value) { this[name] = value; } },
    append(...items) { for (const item of items) { item.owner = this; this.children.push(item); } },
    remove() { if (this.owner) this.owner.children.splice(this.owner.children.indexOf(this), 1); },
    getContext() { return { font: '', measureText: text => ({ width: text.length * 11 }) }; },
  };
}

test('zero-time redraws and hover never reposition settled label anchors or resize fonts', async () => {
  const previous = globalThis.document; globalThis.document = { createElement: element };
  const host = element('div');
  try {
    const { map } = await buildJourney({ userGoal: 'Understand Reinforcement Learning' });
    const layer = createLayer(map, host); layer.resize(1280,720);
    const pose = layer.advance(0,true), renderer = { render() {} };
    for(let frame=0;frame<90;frame++) layer.render(pose,1/60,1280,720,renderer);
    const labels = host.children[0].children;
    const positions = labels.map(label => label.style.transform);
    const hit = layer.landmarks.candidates.find(candidate => candidate.labelOpacity > .1);
    assert.ok(hit);
    for(let frame=0;frame<90;frame++) {
      layer.focus.update(hit,1/60);
      layer.render(pose,0,1280,720,renderer);
      assert.deepEqual(labels.map(label => label.style.transform),positions);
      assert.ok(labels.every(label => label.style.fontSize === undefined));
    }
    const start = layer.journey.distance;
    layer.journey.takeControl(12,0,layer.arc.length);
    for(let frame=0;frame<120;frame++) layer.advance(1/60,true);
    assert.ok(layer.journey.distance > start + 11.9);
    layer.journey.takeControl(-8,0,layer.arc.length);
    for(let frame=0;frame<120;frame++) layer.advance(1/60,true);
    assert.ok(Math.abs(layer.journey.distance-start-4)<.001);
    layer.dispose();
  } finally { globalThis.document=previous; }
});

test('every authored interior uses the same layer, camera, landmark hit testing, and cleanup', () => {
  const previous = globalThis.document;
  globalThis.document = { createElement: element };
  const root = element('div');
  const index = indexKnowledge(knowledge);
  let interiors = 0;
  try {
    for (const region of index.values()) {
      if (!region.children.length) continue;
      let depth = 0, parent = region.parent;
      while (parent) { depth++; parent = index.get(parent).parent; }
      const layer = createLayer(region, root, depth);
      layer.frame.scale = .82 ** depth; layer.presence = 1;
      layer.resize(1280, 720);
      const renderer = { render(scene, camera) {
        assert.ok(scene.isScene); assert.ok(camera.position.toArray().every(Number.isFinite));
        assert.equal(camera.fov, camera.aspect < 1 ? 67 : 53);
      } };
      const pose = layer.advance(0, true);
      for (let i = 0; i < 12; i++) layer.render(pose, 1 / 60, 1280, 720, renderer);
      const concept = region.children[0];
      const projected = locateConcept(concept, 0, layer.arc).anchor.project(layer.viewCamera);
      const hit = layer.pick({ x: (projected.x + 1) * 640, y: (1 - projected.y) * 360 }, 1280, 720);
      assert.equal(hit?.concept.id, concept.id, `ray hit in ${region.id}`);
      for (let i = 0; i < 90; i++) layer.focus.update(hit, 1 / 60);
      assert.ok(layer.focus.strength > .99);
      assert.ok(layer.focus.speedScale < .8);
      layer.render(pose, 1 / 60, 1280, 720, renderer);
      assert.equal(root.children[0].children.length, region.children.length * 3);
      const objectCount = layer.world.scene.children.length;
      layer.resize(390, 844);
      layer.render(pose, 0, 390, 844, renderer);
      layer.resize(1280, 720);
      layer.render(pose, 0, 1280, 720, renderer);
      assert.equal(layer.world.scene.children.length, objectCount);
      for (const label of root.children[0].children) {
        assert.equal(label.children.filter(child => child.className === 'concept-annotation').length, 1);
        assert.ok(label.children.length >= 2);
      }
      layer.dispose(); assert.equal(root.children.length, 0);
      interiors++;
    }
    assert.equal(interiors, 39);
  } finally { globalThis.document = previous; }
});

test('each new goal renders through the unchanged recursive layer, including construction and disposal', async () => {
  const previous = globalThis.document;
  globalThis.document = { createElement: element };
  const host = element('div');
  try {
    for (const userGoal of ['black holes', 'calculus', 'neural networks', 'game engine', 'robotics']) {
      const { map } = await buildJourney({ userGoal });
      for (const region of indexKnowledge(map).values()) {
        if (!region.children.length) continue;
        const layer = createLayer(region, host);
        layer.resize(1280, 720);
        const pose = layer.advance(0, true);
        const renderer = { render() {} };
        layer.formation = { center: 25, radius: 0, labels: 0, relationships: 0 };
        layer.render(pose, 0, 1280, 720, renderer);
        assert.ok(host.children[0].children.every(label => label.style.visibility === 'hidden'));
        layer.formation = null;
        for (let frame=0;frame<12;frame++) layer.render(pose, 1/60, 1280, 720, renderer);
        assert.ok(host.children[0].children.some(label => label.style.visibility === 'visible'));
        const uniforms = layer.world.scene.children[0].material.uniforms;
        assert.equal(uniforms.formationRadius.value, 1000000);
        layer.dispose(); assert.equal(host.children.length, 0);
      }
    }
  } finally { globalThis.document = previous; }
});

test('live adaptation preserves camera and landmark objects, restores branches while paused, and disposes cleanly', async () => {
  const previous = globalThis.document;
  globalThis.document = { createElement: element };
  const host = element('div');
  try {
    const userGoal = 'Understand reinforcement learning';
    const original = (await buildJourney({ userGoal })).map;
    const known = (await buildJourney({ userGoal, overrides: { 'linear-algebra': 'known', components: 'known' } })).map;
    for (const regionId of [original.id, 'vectors']) {
      const region = indexKnowledge(original).get(regionId), target = indexKnowledge(known).get(regionId);
      const layer = createLayer(region, host);
      layer.resize(1280, 720);
      const pose = layer.advance(0, true), beforeCamera = layer.rigCamera.position.clone();
      const markerGroup = layer.world.scene.children.find(item => item.name === 'knowledge-landmarks');
      const markers = [...markerGroup.children], labels = [...host.children[0].children];
      const renderer = { render() {} };
      for (let pass = 0; pass < 4; pass++) {
        layer.retarget(pass % 2 ? region : target, { active: true, anchorId: regionId === original.id ? 'linear-algebra' : 'components' });
        for (let frame = 0; frame < 240; frame++) {
          layer.adapt(1 / 60);
          layer.render(pose, 1 / 60, 1280, 720, renderer);
        }
        assert.equal(layer.reconfiguring, false); assert.equal(layer.settling, false);
        assert.deepEqual(markerGroup.children, markers);
        assert.deepEqual(host.children[0].children, labels);
        assert.equal(layer.rigCamera.position.distanceTo(beforeCamera), 0);
        assert.equal(layer.world.scene.children.filter(item => item.name === 'prerequisite-pathways').length, 1);
        assert.ok(layer.world.scene.children[0].material.uniforms.routeExit.value < 1000000);
      }
      layer.dispose(); assert.equal(host.children.length, 0);
    }
  } finally { globalThis.document = previous; }
});
