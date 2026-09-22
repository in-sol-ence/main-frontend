import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourney } from '../src/journey-provider.js';
import { constructionAt, resetAt, DISCOVERY_DURATION } from '../src/entry.js';
import { indexKnowledge } from '../src/knowledge-model.js';
import { sampleKnowledge } from '../src/knowledge.js';

test('five natural-language goals produce distinct validated recursive maps', async () => {
  const goals = ['I want to understand reinforcement learning', 'How do black holes work?', 'Learn calculus from the beginning', 'Understand how neural networks learn', 'Build my first game engine'];
  const roots = new Set();
  for (const userGoal of goals) {
    const result = await buildJourney({ userGoal });
    roots.add(result.map.id);
    assert.equal(result.fallback, false);
    assert.ok(result.map.children.length >= 7);
    assert.ok(result.map.children.every(node => node.children.length >= 2));
    const nodes = [...indexKnowledge(result.map).values()];
    assert.ok(nodes.some(node => node.parent && node.children.some(child => child.children.length)));
    assert.ok(nodes.every(node => !node.annotation.category.startsWith('undefined')));
    for (const node of nodes) for (const child of node.children) {
      assert.equal(child.parent, node.id);
      assert.ok(child.prerequisites.every(id => node.children.some(other => other.id === id)));
    }
  }
  assert.equal(roots.size, 5);
});

test('background moves familiar foundations out of the forward route without deleting their knowledge', async () => {
  const before = JSON.stringify(sampleKnowledge);
  const beginner = await buildJourney({ userGoal: 'RL', userBackground: 'I am a beginner' });
  const experienced = await buildJourney({ userGoal: 'RL', userBackground: 'I know basic Python and algebra' });
  assert.equal(beginner.map.children.length, 9);
  assert.equal(experienced.map.children.length, 9);
  assert.equal(experienced.adapted, true);
  assert.equal(experienced.map.children[0].id, 'foundations');
  assert.equal(experienced.map.children[0].learnerState, 'known');
  assert.ok(!experienced.map.route.forward.includes('foundations'));
  assert.notEqual(experienced.map.children[0].at, beginner.map.children[0].at);
  assert.equal(JSON.stringify(sampleKnowledge), before);
  for (const userBackground of ["I don't know algebra or Python", 'I want to learn algebra and programming', 'I know algebra', 'I know Python but not algebra']) {
    assert.ok(!(await buildJourney({ userGoal: 'RL', userBackground })).map.route.foundations.includes('foundations'));
  }
});

test('unsupported goals explicitly identify the RL demonstration and retain the request', async () => {
  const result = await buildJourney({ userGoal: 'Learn pottery', userBackground: 'A complete beginner' });
  assert.equal(result.fallback, true);
  assert.equal(result.map.title, 'Reinforcement Learning');
  assert.equal(result.request.userGoal, 'Learn pottery');
  assert.match(result.note, /Reinforcement Learning/);
  await assert.rejects(buildJourney({ userGoal: '  ' }));
});

test('discovery is bounded and ordered: departure, convergence, ribbon, concepts, relationships', () => {
  const initial = constructionAt(0);
  assert.equal(initial.prompt, 1);
  for (const key of ['seed', 'path', 'labels', 'relationships', 'travel']) assert.equal(initial[key], 0);
  assert.ok(constructionAt(1.3).camera > 0);
  assert.ok(constructionAt(1.3).convergence > 0);
  assert.equal(constructionAt(1.3).labels, 0);
  assert.equal(constructionAt(4).path, 0);
  assert.ok(constructionAt(8).path > 0);
  assert.equal(constructionAt(6).handoff, 0);
  assert.equal(constructionAt(4).relationships, 0);
  assert.equal(constructionAt(4).labels, 0);
  for (let time = 0; time <= DISCOVERY_DURATION + 1; time += .01) {
    const state = constructionAt(time);
    for (const value of Object.values(state)) if (typeof value === 'number') assert.ok(value >= 0 && value <= 1);
  }
  const final = constructionAt(DISCOVERY_DURATION);
  assert.equal(final.done, true); assert.equal(final.prompt, 0); assert.equal(final.seed, 0);
  for (const key of ['path', 'labels', 'relationships', 'travel', 'context']) assert.equal(final[key], 1);
  assert.equal(constructionAt(2, true).travel, 0);
  assert.equal(constructionAt(2, true).done, true);
  assert.equal(resetAt(0), 1); assert.equal(resetAt(2), 0);
});
