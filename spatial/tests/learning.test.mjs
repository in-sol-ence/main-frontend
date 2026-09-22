import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourney } from '../src/journey-provider.js';
import { compileKnowledge, indexKnowledge } from '../src/knowledge-model.js';
import { addLearningContent, explanationFor, learningLibrary, validateLearning } from '../src/learning-content.js';
import { createLearningVisual, qTarget, qUpdated, descentPoint, transformVector, discountedReturn } from '../src/learning-visual.js';
import { LearningAttention, createLearning } from '../src/learning.js';
import { createLayer } from '../src/layer.js';
import { ExplorationHistory } from '../src/exploration.js';
import { readingAttenuation } from '../src/landmarks.js';

test('educational content uses the same tree, including every priority RL concept', async () => {
  const { map } = await buildJourney({ userGoal: 'reinforcement learning' });
  const index = indexKnowledge(map);
  for (const id of ['linear-algebra', 'vectors', 'matrices', 'probability', 'gradient-descent', 'mdp', 'q-learning', 'reinforcement-learning']) {
    const concept = index.get(id);
    assert.ok(concept?.explanation, id);
    assert.ok(concept.intuitiveExplanation && concept.advancedExplanation && concept.examples.length);
    assert.ok(concept.visualType);
  }
  const vector = index.get('vectors');
  assert.deepEqual(new Set(vector.children.map(node => node.id)), new Set(['components', 'vector-addition', 'dot-product']));
  assert.ok(index.get('components').children.length);
  const roundTrip = JSON.parse(JSON.stringify(map));
  assert.equal(indexKnowledge(roundTrip).get('vectors').visualData.components[0], 3);
});

test('black holes, calculus, and neural networks have domain-specific learning content', async () => {
  const expected = { 'black holes': 'horizon', calculus: 'derivative', 'neural networks': 'network' };
  for (const [userGoal, visual] of Object.entries(expected)) {
    const { map } = await buildJourney({ userGoal });
    assert.equal(map.visualType, visual);
    assert.ok(map.explanation);
    assert.ok([...indexKnowledge(map).values()].filter(node => node.visualType === visual).length >= 2);
  }
});

test('explanation variants follow learner context without changing the educational data', async () => {
  const { map } = await buildJourney({ userGoal: 'RL' });
  const vector = indexKnowledge(map).get('vectors');
  assert.equal(explanationFor(vector, {}).variant, 'intuitive');
  assert.match(explanationFor(vector, {}).intuition, /arrow/);
  const technical = explanationFor(vector, { userBackground: 'I know linear algebra and calculus' });
  assert.equal(technical.variant, 'advanced');
  assert.match(technical.intuition, /basis/);
  technical.visualData.components[0] = 99;
  assert.equal(vector.visualData.components[0], 3);
  assert.equal(explanationFor({ title: 'Unsupported concept' }), null);
});

test('understanding changes learner state without removing explanations or recursive children', async () => {
  const before = (await buildJourney({ userGoal: 'RL' })).map;
  const after = (await buildJourney({ userGoal: 'RL', overrides: { vectors: 'known' } })).map;
  const a = indexKnowledge(before), b = indexKnowledge(after);
  assert.equal(b.get('vectors').learnerState, 'known');
  assert.ok(b.get('vectors').importance < a.get('vectors').importance);
  assert.equal(b.get('vectors').explanation, a.get('vectors').explanation);
  assert.equal(b.size, a.size);
  assert.deepEqual(b.get('vectors').visualData, a.get('vectors').visualData);
});

test('learning attention eases in/out, respects reduced motion, and never mutates mastery', () => {
  for (const reduced of [false, true]) {
    const attention = new LearningAttention(); attention.open();
    const first = attention.update(1 / 60, reduced);
    assert.ok(first > 0 && first < 1);
    for (let i = 0; i < 180; i++) attention.update(1 / 60, reduced);
    assert.equal(attention.speedScale, 0);
    attention.close(true); assert.ok(attention.visible);
    for (let i = 0; i < 180; i++) attention.update(1 / 60, reduced);
    assert.equal(attention.presence, 0); assert.equal(attention.speedScale, 1);
    assert.equal(attention.understood, true); attention.open(); assert.equal(attention.understood, false);
  }
});

test('supported leaves can be understood without inventing children; other leaves remain leaves', () => {
  const history = new ExplorationHistory({ definition: {} });
  assert.equal(history.canEnter({ children: [], explanation: 'An authored explanation.' }), true);
  assert.equal(history.canEnter({ children: [] }), false);
  history.busy = true; assert.equal(history.canEnter({ children: [], explanation: 'Content' }), false);
});

test('every authored visual is finite, bounded, deterministic, and disposes all geometry/materials', () => {
  for (const [id, content] of Object.entries(learningLibrary)) {
    validateLearning({ id, ...content });
    if (!content.visualType) continue;
    const visual = createLearningVisual(content.visualType, content.visualData);
    let resources = 0, disposed = 0;
    visual.group.traverse(object => {
      if (object.geometry) { resources++; object.geometry.addEventListener('dispose', () => disposed++); }
      if (object.material) { resources++; object.material.addEventListener('dispose', () => disposed++); }
    });
    const count = visual.group.children.length;
    for (const reduced of [false, true]) for (const time of [0, .1, 2, 7, 300]) {
      visual.update(time, .7, reduced);
      visual.group.traverse(object => {
        if (object.geometry) assert.ok([...object.geometry.attributes.position.array].every(Number.isFinite), id);
        if (object.material) assert.ok(object.material.opacity >= 0 && object.material.opacity <= .7);
        assert.ok(object.position.toArray().every(Number.isFinite));
      });
      assert.equal(visual.group.children.length, count);
    }
    assert.ok(visual.labels.length >= 2);
    visual.dispose(); assert.equal(disposed, resources, id);
  }
});

test('all primary RL destinations teach an idea, with distinct content down five recursive levels', async () => {
  const { map } = await buildJourney({ userGoal: 'RL' });
  for (const node of [map, ...map.children, ...map.children.flatMap(child => child.children)]) {
    assert.ok(node.explanation && node.intuitiveExplanation && node.intermediateExplanation && node.advancedExplanation && node.examples.length, node.title);
  }
  const index = indexKnowledge(map);
  const descent = ['vectors', 'components', 'component-coordinates', 'coordinate-axes', 'ordered-coordinates'].map(id => index.get(id));
  assert.equal(new Set(descent.map(node => node.explanation)).size, descent.length);
  assert.equal(index.get('components').visualData.mode, 'components');
  assert.equal(index.get('distributions').visualType, 'distribution');
  assert.ok([...index.values()].filter(node => node.explanation).length >= 60);
});

test('reading space only quiets overlapping typography and restores it continuously', () => {
  const label = { x: 30, y: 140, width: 100, height: 25 };
  const space = { x: 25, y: 110, width: 350, height: 230, presence: 1 };
  assert.equal(readingAttenuation(label, null), 1);
  assert.equal(readingAttenuation(label, { ...space, presence: 0 }), 1);
  assert.ok(readingAttenuation(label, space) < .03);
  assert.ok(readingAttenuation(label, { ...space, presence: .5 }) > .5);
  assert.equal(readingAttenuation({ ...label, x: 450 }, space), 1);
  assert.ok(readingAttenuation({ ...label, x: 390 }, space) > readingAttenuation(label, space));
});

test('intermediate content and example notation adapt without treating a goal as existing expertise', async () => {
  const { map } = await buildJourney({ userGoal: 'advanced RL research' });
  const vector = indexKnowledge(map).get('vectors');
  const beginner = explanationFor(vector, {});
  const familiar = explanationFor(vector, { userBackground: 'I know some linear algebra' });
  const advanced = explanationFor(vector, { userBackground: 'I know linear algebra' });
  assert.equal(beginner.variant, 'intuitive');
  assert.equal(familiar.variant, 'intermediate');
  assert.equal(advanced.variant, 'advanced');
  assert.equal(new Set([beginner.intuition, familiar.intuition, advanced.intuition]).size, 3);
  assert.equal(new Set([beginner.example, familiar.example, advanced.example]).size, 3);
  assert.equal(explanationFor(vector, { userBackground: 'I do not know linear algebra' }).variant, 'intuitive');
  assert.equal(explanationFor(vector, { userBackground: 'I know linear algebra', overrides: { vectors: 'unknown' } }).variant, 'intuitive');
  assert.equal(explanationFor({ ...vector, learnerState: 'familiar' }).variant, 'intermediate');
  assert.equal(JSON.parse(JSON.stringify(map)).children.find(node => node.id === 'linear-algebra').intermediateExplanation,
    map.children.find(node => node.id === 'linear-algebra').intermediateExplanation);
});

test('explanatory motion changes the represented quantities and settles to the authored answer', () => {
  const probability = createLearningVisual('distribution', learningLibrary.probability.visualData);
  const stem = probability.group.getObjectByName('probability-1');
  probability.update(0, 1); const low = stem.geometry.attributes.position.getY(1);
  probability.update(3.5, 1); const middle = stem.geometry.attributes.position.getY(1);
  probability.update(7, 1); const high = stem.geometry.attributes.position.getY(1);
  assert.ok(low < middle && middle < high);
  assert.ok(Math.abs(high - 1.1) < 1e-6);
  const matrix = createLearningVisual('matrix', learningLibrary.matrices.visualData);
  const arrow = matrix.group.getObjectByName('transformed-vector');
  matrix.update(0, 1); assert.equal(arrow.geometry.attributes.position.getX(1), 2);
  matrix.update(7, 1); assert.equal(arrow.geometry.attributes.position.getX(1), 3);
  const q = createLearningVisual('value-update', learningLibrary.q.visualData);
  q.update(0, 1); const start = q.group.getObjectByName('q-estimate').position.x;
  q.update(2, 1); assert.equal(q.group.getObjectByName('q-estimate').position.x, start, 'observe before updating');
  q.update(7, 1); assert.ok(q.group.getObjectByName('q-estimate').position.x > start);
  assert.ok(q.labels.some(label => label.text === 'Q(A, right) = 3.3'));
  assert.ok(Math.abs(discountedReturn(learningLibrary.values.visualData) - 5.23) < 1e-10);
  const returns = createLearningVisual('return', learningLibrary.values.visualData);
  returns.update(7, 1); assert.ok(returns.labels.some(label => label.text === 'sample return = 5.23'));
  for (const visual of [probability, matrix, q, returns]) visual.dispose();
});

test('new learning schemas reject malformed variants and geometry', () => {
  for (const content of [
    { ...learningLibrary.vectors, intermediateExplanation: {} },
    { ...learningLibrary.components, visualData: { components: [3, 2], mode: 'broken' } },
    { ...learningLibrary.addition, visualData: { first: [1], second: [2, 3] } },
    { ...learningLibrary.rewards, visualData: { rewards: [1, 2, 3], discount: 1.2 } },
    { ...learningLibrary.probability, visualData: { ...learningLibrary.probability.visualData, caption: {} } },
  ]) assert.throws(() => validateLearning({ id: 'invalid', ...content }));
});

test('visual calculations agree with the displayed examples', () => {
  const data = learningLibrary.q.visualData;
  assert.equal(qTarget(data), 4.6);
  assert.equal(qUpdated(data), 3.3);
  assert.deepEqual(transformVector(learningLibrary.matrices.visualData.matrix, [2, 2]), [3, 1.4]);
  assert.ok(Math.abs(descentPoint(learningLibrary.gradient.visualData, 1) - 1.8) < 1e-12);
  assert.equal(learningLibrary.probability.visualData.probabilities.reduce((a, b) => a + b), 1);
});

test('compiler validates content, visual schemas, and preserves text-only generated explanations', () => {
  const source = { id: 'a', title: 'Example', domain: 'mathematics', importance: .5, description: 'A description.', children: [], explanation: 'A useful idea.', examples: ['One example.'] };
  assert.equal(compileKnowledge(source).explanation, source.explanation);
  assert.equal(addLearningContent(source).explanation, source.explanation);
  for (const change of [{ explanation: 4 }, { examples: '<script>' }, { visualType: 'unknown' }, { ...learningLibrary.vectors, visualData: { components: [NaN, 1] } }, { ...learningLibrary.probability, visualData: { probabilities: [.5, .7], outcomes: ['a', 'b'] } }]) {
    assert.throws(() => compileKnowledge({ ...source, ...change }));
  }
});

test('learning controller coexists with landmarks, eases travel, and cleans up on repeated entry', async () => {
  function element() {
    return { children: [], dataset: {}, style: { setProperty(key, value) { this[key] = value; } }, offsetHeight: 280,
      append(...items) { items.forEach(item => { item.owner = this; this.children.push(item); }); },
      remove() { if (this.owner) this.owner.children.splice(this.owner.children.indexOf(this), 1); },
      addEventListener() {}, getContext() { return { measureText: text => ({ width: text.length * 11 }) }; },
    };
  }
  const previous = globalThis.document;
  globalThis.document = { createElement: element };
  try {
    const { map } = await buildJourney({ userGoal: 'RL' });
    const host = element(), labelHost = element(), section = element(), slots = new Map();
    section.querySelector = key => { if (!slots.has(key)) slots.set(key, element()); return slots.get(key); };
    const learning = createLearning({ section, reopen: element(), labelsHost: labelHost, onContinue() {}, onUnderstand() {} });
    const layer = createLayer(indexKnowledge(map).get('vectors'), host, 2);
    layer.presence = 1; layer.resize(1280, 720);
    const renderer = { render() {} }; let pose = layer.advance(0, true);
    layer.render(pose, 0, 1280, 720, renderer);
    const landmarkCount = host.children[0].children.length, sceneCount = layer.world.scene.children.length;
    for (let repeat = 0; repeat < 3; repeat++) {
      layer.journey.speed = 7.2;
      assert.ok(learning.show(layer, {}, 1280, 720));
      const from = layer.journey.distance;
      for (let i = 0; i < 300; i++) {
        pose = layer.advance(1 / 60, false);
        learning.update(1 / 60, layer, 1280, 720);
        layer.render(pose, 1 / 60, 1280, 720, renderer);
      }
      assert.ok(layer.journey.distance > from);
      assert.ok(layer.journey.distance < from + 15);
      assert.ok(layer.journey.speed < .1);
      assert.equal(host.children[0].children.length, landmarkCount);
      assert.equal(section.dataset.variant, 'intuitive');
      assert.ok(labelHost.children.some(node => Number(node.style.opacity) > .5));
      learning.close(true);
      for (let i = 0; i < 180; i++) learning.update(1 / 60, layer, 1280, 720);
      assert.equal(learning.visible, false); assert.equal(labelHost.children.length, 0);
      assert.equal(layer.learningWeight, 0); assert.equal(layer.world.scene.children.length, sceneCount);
    }
    layer.dispose(); assert.equal(host.children.length, 0);
  } finally { globalThis.document = previous; }
});
