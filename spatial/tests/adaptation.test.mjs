import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourney } from '../src/journey-provider.js';
import { readLearner, isKnown } from '../src/adaptation.js';
import { compileKnowledge, indexKnowledge } from '../src/knowledge-model.js';
import { createReconfiguration } from '../src/reconfiguration.js';
import { encounterAt } from '../src/choreography.js';

const goal = 'I want to understand reinforcement learning';
const expert = 'I already know Python, linear algebra, probability, and calculus.';

test('same destination produces a shorter, differently structured forward route for an experienced learner', async () => {
  const beginner = (await buildJourney({ userGoal: goal, userBackground: "I'm new to machine learning" })).map;
  const experienced = (await buildJourney({ userGoal: goal, userBackground: expert })).map;
  assert.equal(beginner.route.forward.length, 9);
  assert.deepEqual(experienced.route.forward, ['mdp', 'policy-value', 'q-learning', 'policy-learning', 'reinforcement-learning']);
  assert.ok(experienced.route.end - experienced.startAt < (beginner.route.end - beginner.startAt) * .65);
  assert.equal(experienced.route.foundations.length, 4);
  assert.equal(experienced.children.length, beginner.children.length);
  for (const id of experienced.route.foundations) {
    const node = experienced.children.find(item => item.id === id), original = beginner.children.find(item => item.id === id);
    assert.ok(isKnown(node.learnerState)); assert.ok(node.children.length > 0);
    assert.ok(node.importance < original.importance * .2);
    assert.ok(node.at < original.at);
    assert.ok(encounterAt(node, 20).speedScale > encounterAt(original, 20).speedScale);
  }
});

test('inference preserves clause-local negation and distinguishes familiarity from mastery', () => {
  assert.deepEqual(readLearner('I know Python but not probability'), { programming: 'known', probability: 'unknown' });
  assert.equal(readLearner('I mastered linear algebra').linear, 'mastered');
  assert.equal(readLearner('I know basic programming').programming, 'familiar');
  assert.equal(readLearner('I want to learn probability').probability, 'unknown');
  assert.equal(readLearner('I know Python, not algebra').algebra, 'unknown');
});

test('goal focus, desired depth, and familiarity change priorities without changing the destination', async () => {
  const base = (await buildJourney({ userGoal: goal })).map;
  const familiar = (await buildJourney({ userGoal: goal, userBackground: 'I am familiar with linear algebra' })).map;
  assert.ok(familiar.route.forward.indexOf('linear-algebra') < familiar.route.forward.indexOf('probability'));
  const focused = await buildJourney({ userGoal: `${goal}, focusing on calculus and mathematical theory` });
  assert.equal(focused.example, 'reinforcement');
  assert.ok(focused.map.children.find(n => n.id === 'linear-algebra').relevanceToGoal > base.children.find(n => n.id === 'linear-algebra').relevanceToGoal);
  const overview = (await buildJourney({ userGoal: 'A quick overview of reinforcement learning' })).map;
  assert.ok(overview.route.end < base.route.end);
  assert.equal(overview.depthPreference, 'overview');
});

test('explicit need overrides inherited knowledge through the original recursive vector branch', async () => {
  const known = (await buildJourney({ userGoal: goal, userBackground: expert })).map;
  const corrected = (await buildJourney({ userGoal: goal, userBackground: expert, overrides: { components: 'unknown' } })).map;
  const index = indexKnowledge(corrected);
  assert.equal(index.get('components').learnerState, 'unknown');
  assert.equal(index.get('vectors').learnerState, 'familiar');
  assert.equal(index.get('linear-algebra').learnerState, 'familiar');
  assert.ok(corrected.route.forward.includes('linear-algebra'));
  assert.ok(index.get('components').children.length > 0);
  assert.equal(indexKnowledge(known).get('components').learnerState, 'known');
  for (const node of index.values()) {
    assert.ok(node.relevanceToGoal >= 0 && node.relevanceToGoal <= 1);
    assert.ok(node.estimatedDifficulty >= 0 && node.estimatedDifficulty <= 1);
    if (node.parent) assert.ok(Number.isFinite(node.position.at));
  }
});

test('robot navigation combines domains and asymmetric depths in one personalized route', async () => {
  const { map, example } = await buildJourney({ userGoal: 'Build a robot that can navigate autonomously', userBackground: 'I know Python and linear algebra' });
  assert.equal(example, 'robotics');
  assert.ok(new Set(map.children.map(node => node.domain)).size >= 5);
  assert.ok(map.route.foundations.includes('robot-programming'));
  assert.ok(map.route.forward.includes('robot-sensors'));
  const depth = node => 1 + Math.max(0, ...node.children.map(depth));
  assert.ok(depth(map.children.find(node => node.id === 'robot-geometry')) >= 5);
  assert.ok(depth(map.children.find(node => node.id === 'robot-programming')) < 4);
});

test('live reconfiguration is reversible and preserves identities while moving real positions', async () => {
  const base = (await buildJourney({ userGoal: goal })).map;
  const next = (await buildJourney({ userGoal: goal, overrides: { 'linear-algebra': 'known' } })).map;
  const current = structuredClone(base), identity = current.children.find(n => n.id === 'linear-algebra');
  const initial = identity.at;
  const plan = createReconfiguration(current, next, { anchorId: identity.id, distance: 80, arcLength: 420, active: true });
  plan.apply(0); assert.equal(identity.at, initial);
  plan.apply(.5); assert.notEqual(identity.at, initial);
  plan.apply(1); assert.equal(current.children.find(n => n.id === identity.id), identity);
  assert.equal(identity.learnerState, 'known'); assert.ok(!current.route.forward.includes(identity.id));
  const reverse = createReconfiguration(current, base, { anchorId: identity.id, distance: 80, arcLength: 420, active: true });
  reverse.apply(1); assert.equal(identity.learnerState, 'unknown');
  assert.ok(current.route.forward.includes(identity.id));
  assert.ok(Math.abs(identity.at * 420 - 114) < 1e-8);
});

test('known nodes do not conceal invalid prerequisite cycles or learner metadata', () => {
  const node = id => ({ id, title: id, domain: 'mathematics', importance: .5, description: '', learnerState: 'known', children: [] });
  assert.throws(() => compileKnowledge({ ...node('root'), adaptive: true, children: [{ ...node('a'), prerequisites: ['b'] }, { ...node('b'), prerequisites: ['a'] }] }), /cycle/);
  assert.throws(() => compileKnowledge({ ...node('root'), learnerState: 'wizard' }), /learner state/);
  assert.throws(() => compileKnowledge({ ...node('root'), estimatedDifficulty: 2 }), /estimatedDifficulty/);
});
