import test from 'node:test';
import assert from 'node:assert/strict';
import { resourceLibrary } from '../src/resource-library.js';
import { resourceUrl, videoEmbed } from '../src/resource-content.js';
import { createResourceBranches, fanShapeFor } from '../src/resource-branches.js';
import { openDuration } from '../src/resource-placement.js';
import { buildJourney } from '../src/journey-provider.js';
import { createLayer } from '../src/layer.js';

const find = (node, id) => node.id === id ? node : (node.children || []).map(child => find(child, id)).find(Boolean);

test('every resource set is attached to a real knowledge concept on the calculus map', async () => {
  const { map } = await buildJourney({ userGoal: 'Learn calculus from the beginning' });
  assert.deepEqual(Object.keys(resourceLibrary).sort(), ['calculus-2-0', 'calculus-3-0-1', 'calculus-6-1']);
  for (const [id, list] of Object.entries(resourceLibrary)) {
    const concept = find(map, id);
    assert.ok(concept, `${id} exists`);
    assert.equal(concept.children.length, 0, `${concept.title} is a leaf, so no descent is replaced`);
    assert.ok(list.length > 0);
    for (const resource of list) assert.ok(resource.id && resource.type && resource.title);
  }
  assert.equal(find(map, 'calculus-6-1').title, 'Motion');
  // Tangent Slopes already opens its understanding panel; resources never pre-empt that.
  assert.ok(find(map, 'calculus-3-0-1').explanation);
  assert.ok(!find(map, 'calculus-6-1').explanation);
});

test('lecture segments embed privately, cut to their own start and end', () => {
  const pumpkin = resourceLibrary['calculus-6-1'][0];
  const embed = new URL(videoEmbed(pumpkin));
  assert.equal(embed.hostname, 'www.youtube-nocookie.com');
  assert.equal(embed.pathname, '/embed/ryLdyDrBfvI');
  assert.equal(embed.searchParams.get('start'), '243');
  assert.equal(embed.searchParams.get('end'), '711');
  assert.equal(new URL(resourceUrl(pumpkin)).searchParams.get('t'), '243');
  for (const list of Object.values(resourceLibrary)) {
    for (const resource of list.filter(item => item.type === 'video')) {
      assert.ok(Number.isFinite(resource.start) && resource.end > resource.start, `${resource.title} is a segment`);
      assert.ok(videoEmbed(resource), `${resource.title} embeds`);
    }
  }
  // Nothing but a web link is ever opened, and non-video types never embed.
  assert.equal(resourceUrl({ url: 'javascript:alert(1)' }), null);
  assert.equal(videoEmbed({ ...pumpkin, type: 'lecture' }), null);
  assert.equal(videoEmbed({ ...pumpkin, url: 'https://www.youtube.com/watch?v=bad' }), null);
});

// A minimal DOM, as in the layer integration tests: real geometry, cameras,
// layer and fan lifecycle run; WebGL appearance does not.
function element(tag) {
  const listeners = {};
  return {
    tagName: tag.toUpperCase(), children: [], style: { setProperty(key, value) { this[key] = value; } }, dataset: {}, attributes: {},
    textContent: '', className: '', inert: false,
    append(...items) { for (const item of items) { item.owner = this; this.children.push(item); } },
    remove() { if (this.owner) this.owner.children.splice(this.owner.children.indexOf(this), 1); },
    setAttribute(key, value) { this.attributes[key] = value; },
    addEventListener(type, fn) { listeners[type] = fn; },
    click() { listeners.click?.(); },
    getContext() { return { font: '', measureText: text => ({ width: text.length * 11 }) }; },
  };
}

test('activating Motion grows its segments on screen, expands one in place, and collapses cleanly', async () => {
  const previous = globalThis.document; globalThis.document = { createElement: element };
  const labels = element('div'), host = element('div'), renderer = { render() {} }, dt = 1 / 60;
  try {
    const { map } = await buildJourney({ userGoal: 'Learn calculus from the beginning' });
    const applications = find(map, 'calculus-6');
    const layer = createLayer(applications, labels, 1); layer.resize(1440, 900);
    layer.presence = 1; // as the enter passage leaves it
    // Held where the viewer arrives in Applications, until its labels settle.
    let pose = layer.advance(0, true), motion;
    for (let time = 0; time < 3; time += dt) { layer.render(pose, dt, 1440, 900, renderer); }
    motion = layer.landmarks.candidates.find(item => item.concept.id === 'calculus-6-1' && item.depth > 6 && item.labelOpacity > .3);
    assert.ok(motion, 'Motion is legible, within the pointer’s hit window, on arrival in Applications');
    const scene = layer.world.scene.children.length;
    const fan = createResourceBranches({ host });
    const statuses = [];
    const list = resourceLibrary['calculus-6-1'];
    fan.open({ layer, key: motion.key, concept: motion.concept, anchor: motion.anchor, depth: motion.depth, resources: list,
      tint: '#b9c6bd', width: 1440, height: 900, onStatus: text => statuses.push(text) });
    assert.equal(fan.key, motion.key);
    assert.equal(host.children.length, list.length, 'one card per resource');
    assert.equal(layer.world.scene.children.length, scene + 1, 'the branches live in the layer’s own scene');
    assert.match(statuses[0], /^5 resources for Motion/);
    for (let time = 0; time <= openDuration(list.length) + .1; time += dt) {
      layer.render(pose, dt, 1440, 900, renderer);
      fan.update({ dt, width: 1440, height: 900 });
    }
    const positions = host.children.map(card => card.style.transform);
    assert.equal(new Set(positions).size, list.length, 'cards do not stack on each other');
    for (const card of host.children) {
      assert.equal(Number(card.style.opacity), 1, 'every card is fully revealed');
      assert.equal(card.inert, false);
      const [x, y] = card.style.transform.match(/-?[\d.]+/g).map(Number);
      assert.ok(x > 0 && x < 1440 && y > 0 && y < 900, `on screen at ${x}, ${y}`);
    }
    assert.ok(fan.hold > .85, 'travel is stilled while the resources are read');

    // Expanding the pumpkin-drop card attaches its lecture segment in place.
    host.children[0].children[0].click();
    const content = host.children[0].children[1];
    assert.equal(content.className, 'resource-content');
    assert.equal(host.children[0].children[0].attributes['aria-expanded'], 'true');
    assert.ok(content.children.some(node => node.className === 'resource-video-load'), 'the video segment is one click away');
    assert.ok(content.children.some(node => node.textContent === 'Segment: 243s to 711s'));
    fan.update({ dt, width: 1440, height: 900 });
    assert.equal(host.children[0].dataset.expanded, 'true');
    assert.equal(Number(host.children[1].style.opacity), .5, 'the others recede');
    host.children[0].children[0].click();
    assert.equal(host.children[0].children.length, 1, 'selecting again collapses it');

    fan.close();
    assert.equal(fan.key, null);
    for (let time = 0; time < 1 && fan.layer; time += dt) fan.update({ dt, width: 1440, height: 900 });
    assert.equal(fan.layer, null, 'the set is gone once collapsed');
    assert.equal(host.children.length, 0);
    assert.equal(layer.world.scene.children.length, scene);
    assert.equal(layer.learningWeight, 0, 'travel is released');

    // Reopening replaces rather than duplicates, and portrait climbs instead of spreading.
    fan.open({ layer, key: motion.key, concept: motion.concept, anchor: motion.anchor, depth: motion.depth, resources: list, tint: '#fff', width: 390, height: 844 });
    fan.open({ layer, key: motion.key, concept: motion.concept, anchor: motion.anchor, depth: motion.depth, resources: list, tint: '#fff', width: 390, height: 844 });
    assert.equal(host.children.length, list.length);
    assert.equal(fanShapeFor(390, 844).ladder, true);
    fan.dispose();
    assert.equal(host.children.length, 0);
    layer.dispose();
  } finally { globalThis.document = previous; }
});

test('after the lecture, the rest of the branch goes by and the journey reaches its empty end', async () => {
  const { PASS_DEPTH, PASS_HOLD, ARRIVAL_STOP, FINALE_LEAD, finaleReached } = await import('../src/handoff.js');
  const previous = globalThis.document; globalThis.document = { createElement: element };
  const renderer = { render() {} }, dt = 1 / 30;
  try {
    const { map } = await buildJourney({ userGoal: 'Learn calculus from the beginning', userBackground: 'I know algebra' });
    const limits = find(map, 'calculus-2');
    const layer = createLayer(limits, element('div'), 1); layer.resize(1440, 900);
    layer.presence = 1; layer.journey.time = 5; layer.journey.speed = 2.4;
    const forward = limits.route.forward, passed = new Set([forward[0]]);
    let passing = null, time = 0, done = false;
    // The demonstration's own loop, at the journey's own pace.
    for (; time < 60 && !done; time += dt) {
      const pose = layer.advance(dt, false); layer.render(pose, dt, 1440, 900, renderer);
      if (passing) passing.elapsed += dt;
      if (!passing || passing.elapsed >= PASS_HOLD) {
        const next = layer.landmarks.candidates.find(item => !passed.has(item.concept.id) && item.cycle === 0 && forward.includes(item.concept.id)
          && item.depth > 6 && item.depth < PASS_DEPTH && item.labelOpacity >= .3);
        if (next) { passing = { key: next.key, elapsed: 0 }; passed.add(next.concept.id); } else passing = null;
      }
      const held = passing && layer.landmarks.candidates.find(item => item.key === passing.key);
      layer.focus.update(held || null, dt);
      done = finaleReached({ distance: layer.journey.distance, routeEnd: limits.route.end, arcLength: layer.arc.length, forward, passed, passing });
    }
    assert.deepEqual([...passed], forward, 'every knowledge concept of the branch is selected in turn');
    assert.ok(done, 'the finale is reached by the journey itself, not by the safety limit');
    assert.ok(time > 12 && time < 30, `at a readable pace (${time.toFixed(1)}s)`);
    assert.ok(layer.journey.distance > limits.route.end * layer.arc.length - ARRIVAL_STOP - FINALE_LEAD);
    // The safety limit ends a demonstration that could never get there.
    assert.equal(finaleReached({ distance: 0, routeEnd: 1, arcLength: 100, forward: ['x'], passed: new Set(), passing: null, elapsed: 40 }), true);
    layer.dispose();
  } finally { globalThis.document = previous; }
});
