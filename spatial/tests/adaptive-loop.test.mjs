import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourney } from '../src/journey-provider.js';
import { indexKnowledge } from '../src/knowledge-model.js';
import { createAdaptiveSession, emphasizeIntervention, navigationStep, learningActions } from '../src/adaptive-engine.js';
import { createLearnerState, recordResponse, recordSelfReport } from '../src/learner-model.js';
import { knowledgeChecks, validateChecks } from '../src/knowledge-checks.js';
import { createReconfiguration } from '../src/reconfiguration.js';

const journey = async () => (await buildJourney({ userGoal: 'I want to understand reinforcement learning.' })).map;
function answer(session, action, correct) {
  const question = session.question(action);
  return session.respond(action.id, correct ? question.answer : question.choices.find(c => c.id !== question.answer).id);
}

test('the visible Vectors trial advances on success and enters Components on failure', async () => {
  const map = await journey();
  const successful = createAdaptiveSession(map);
  const first = successful.start('vectors');
  assert.equal(successful.arrive(first), first, 'direct entry preserves the live question/action identity');
  const forward = answer(successful, first, true).action;
  assert.equal(forward.type, 'ADVANCE'); assert.equal(forward.targetId, 'matrices');
  assert.equal(successful.arrive(forward).type, 'QUESTION', 'arrival actually presents the next check');
  const restarted = createAdaptiveSession(structuredClone(map));
  assert.equal(restarted.state.components.vectors.mastery, .2);
  assert.equal(restarted.state.responses.length, 0);
  const initial = restarted.start('vectors');
  assert.equal(initial.questionId, first.questionId);
  const reinforcement = answer(restarted, initial, false).action;
  assert.equal(reinforcement.type, 'PREREQUISITE'); assert.equal(reinforcement.targetId, 'components');
  assert.equal(restarted.arrive(reinforcement).type, 'EXPLANATION');
  const practice = restarted.continue('components');
  assert.equal(practice.type, 'PRACTICE');
  const reconnect = answer(restarted, practice, true).action;
  assert.equal(reconnect.targetId, 'vectors'); assert.equal(reconnect.reconnect, true);
  const transfer = restarted.arrive(reconnect);
  assert.equal(transfer.type, 'QUESTION'); assert.notEqual(transfer.questionId, first.questionId);
  assert.equal(indexKnowledge(map).get('vectors').learnerState, 'unknown', 'baseline stays reusable');
});

test('identical learners diverge because of answers, not selected profiles', async () => {
  const map = await journey(), a = createAdaptiveSession(map), b = createAdaptiveSession(map);
  assert.deepEqual(a.state.components, b.state.components);
  const strong = answer(a, a.start('dot-product'), true);
  const struggling = answer(b, b.start('dot-product'), false);
  assert.ok(a.state.components['dot-product'].mastery > .7);
  assert.ok(b.state.components['dot-product'].mastery < .35);
  assert.equal(strong.action.type, 'ADVANCE');
  assert.equal(strong.action.targetId, 'vectors', 'success does not send the learner backward into an untested prerequisite');
  assert.equal(struggling.action.type, 'PREREQUISITE');
  assert.equal(struggling.action.targetId, 'components');
  assert.equal(b.state.responses.length, 1);
  assert.ok(b.state.responses[0].strength > 0 && b.state.responses[0].confidence > 0);
  assert.equal(b.state.components.vectors.mastery, .2, 'no invented evidence for another KC');
});

test('MDP uncertainty selects probability, then demonstrated understanding reconnects to MDP', async () => {
  const session = createAdaptiveSession(await journey());
  const detour = answer(session, session.start('mdp'), false).action;
  assert.equal(detour.type, 'PREREQUISITE'); assert.equal(detour.targetId, 'probability');
  assert.equal(session.arrive(detour).type, 'EXPLANATION');
  const practice = session.continue('probability'); assert.equal(practice.type, 'PRACTICE');
  const reconnect = answer(session, practice, true).action;
  assert.equal(reconnect.type, 'ADVANCE'); assert.equal(reconnect.targetId, 'mdp'); assert.equal(reconnect.reconnect, true);
  assert.equal(session.state.detours.length, 0);
  const question = session.arrive(reconnect);
  assert.equal(question.type, 'QUESTION'); assert.equal(question.kcId, 'mdp');
  assert.equal(question.questionId, 'mdp-markov', 'different item tests transfer instead of memorization');
  const partial = answer(session, question, true).action;
  assert.equal(partial.type, 'EXAMPLE', 'one new success does not erase contradictory evidence');
  assert.ok(session.state.components.mdp.mastery > .35 && session.state.components.mdp.mastery <= .7);
});

test('self reports, reading, exposure, and skipping do not manufacture assessment mastery', async () => {
  const session = createAdaptiveSession(await journey());
  const before = session.state.components.vectors.mastery;
  session.selfReport('vectors'); session.cancel(); session.start('vectors'); session.cancel();
  assert.equal(session.state.components.vectors.mastery, before);
  assert.equal(session.state.responses.length, 0);
  assert.equal(session.state.components.vectors.reports.length, 1);
  assert.deepEqual(session.overrides(), {});
  const clean = createAdaptiveSession(await journey());
  assert.equal(clean.state.components.vectors.reports.length, 0, 'new journey resets the session');
});

test('parent assessment does not silently mark untested descendants as known', async () => {
  const session = createAdaptiveSession(await journey());
  answer(session, session.start('probability'), true);
  const { map } = await buildJourney({ userGoal: 'RL', overrides: session.overrides(), evidence: session.evidence() });
  const index = indexKnowledge(map);
  assert.equal(index.get('probability').learnerState, 'known');
  assert.equal(index.get('random-variables').learnerState, 'unknown');
  assert.equal(index.get('distributions').learnerState, 'unknown');
  assert.equal(session.state.components['random-variables'].attempts, 0);
  const legacy = await buildJourney({ userGoal: 'RL', overrides: { probability: 'known' } });
  assert.equal(indexKnowledge(legacy.map).get('distributions').learnerState, 'known', 'explicit existing personalization remains supported');
});

test('responses are single-use and stale/double submissions cannot advance twice', async () => {
  const session = createAdaptiveSession(await journey()), action = session.start('vectors');
  const question = session.question(action);
  assert.throws(() => session.respond(action.id, 'not-a-choice'));
  const result = session.respond(action.id, question.answer); assert.ok(result);
  const after = structuredClone(session.state);
  assert.equal(session.respond(action.id, question.answer), null);
  assert.deepEqual(session.state, after);
});

test('evidence strength affects mastery and repetition cannot farm confidence', async () => {
  const graph = indexKnowledge(await journey()), strong = createLearnerState(graph), weak = createLearnerState(graph);
  const q = knowledgeChecks.find(q => q.kcId === 'vectors');
  recordResponse(strong, q, q.answer, 'one');
  recordResponse(weak, { ...q, strength: .2 }, q.answer, 'one');
  assert.ok(strong.components.vectors.mastery > weak.components.vectors.mastery);
  const confidence = strong.components.vectors.confidence;
  for (let i = 0; i < 20; i++) recordResponse(strong, q, q.answer, `repeat-${i}`);
  assert.ok(strong.components.vectors.confidence < confidence);
  assert.ok(strong.components.vectors.mastery < 1);
  const previous = strong.responses.length;
  assert.equal(recordResponse(strong, q, q.answer, 'repeat-19'), null);
  assert.equal(strong.responses.length, previous);
  recordSelfReport(strong, 'vectors', false);
  for (const kc of Object.values(strong.components)) assert.ok(kc.mastery >= 0 && kc.mastery <= 1 && kc.confidence >= 0 && kc.confidence <= 1);
});

test('all six action types have a bounded supported path, including an unassessed prerequisite', async () => {
  const seen = new Set();
  const session = createAdaptiveSession(await journey());
  const initial = session.start('mdp'); seen.add(initial.type);
  const detour = answer(session, initial, false).action; seen.add(detour.type);
  seen.add(session.arrive(detour).type);
  const practice = session.continue('probability'); seen.add(practice.type);
  const foundational = answer(session, practice, false).action;
  assert.equal(foundational.targetId, 'foundations');
  session.arrive(foundational);
  const returnAfterReading = session.continue('foundations');
  assert.equal(returnAfterReading.type, 'ADVANCE'); seen.add(returnAfterReading.type);
  assert.equal(session.state.components.foundations.mastery, .2);
  const retry = session.arrive(returnAfterReading);
  const example = answer(session, retry, true).action; seen.add(example.type);
  assert.deepEqual(seen, new Set(learningActions));
});

test('adaptive travel uses the lowest common ancestor and preserves the original hierarchy', async () => {
  const map = await journey(), graph = indexKnowledge(map);
  assert.deepEqual(navigationStep(graph, ['rl-journey', 'mdp'], 'probability'), { type: 'return', depth: 0 });
  assert.deepEqual(navigationStep(graph, ['rl-journey'], 'probability'), { type: 'enter', id: 'probability' });
  assert.deepEqual(navigationStep(graph, ['rl-journey', 'probability'], 'probability'), { type: 'arrived' });
  assert.deepEqual(navigationStep(graph, ['rl-journey', 'linear-algebra', 'vectors', 'dot-product'], 'components'), { type: 'return', depth: 2 });
  assert.deepEqual(navigationStep(graph, ['rl-journey', 'linear-algebra', 'vectors'], 'components'), { type: 'enter', id: 'components' });
  assert.throws(() => navigationStep(graph, ['rl-journey'], 'missing'));
  assert.equal(indexKnowledge(map).size, 116);
});

test('new evidence retargets existing identities and emphasizes the needed prerequisite relationship', async () => {
  const map = await journey(), session = createAdaptiveSession(map);
  const intervention = answer(session, session.start('mdp'), false).action;
  const rebuilt = (await buildJourney({ userGoal: 'RL', overrides: session.overrides() })).map;
  const emphasized = emphasizeIntervention(rebuilt, session, intervention), index = indexKnowledge(emphasized);
  assert.ok(index.get('mdp').importance >= .96);
  assert.ok(index.get('probability').importance >= .96);
  assert.ok(emphasized.pathways.some(p => p.source === 'probability' && p.target === 'mdp' && p.strength > 1));
  const vector = map.children.find(n => n.id === 'linear-algebra');
  const plan = createReconfiguration(map, emphasized, { distance: 100, arcLength: 650, active: true, anchorId: 'probability' });
  plan.apply(.5); plan.apply(1);
  assert.equal(map.children.find(n => n.id === 'linear-algebra'), vector);
  assert.equal(indexKnowledge(map).size, index.size);
  assert.equal(indexKnowledge(map).get('mdp').mastery, session.state.components.mdp.mastery);
});

test('decision policy is driven by data, not RL concept names', () => {
  const child = (id, parent, prerequisites = []) => ({ id, title: id, parent, prerequisites, children: [], learnerState: 'unknown', explanation: 'A real explanation.' });
  const map = child('root', null); map.children = [child('support', 'root'), child('destination', 'root', ['support'])];
  const q = { id: 'arbitrary-question', kcId: 'destination', prompt: 'Which?', choices: [{ id: 'yes', text: 'Yes' }, { id: 'no', text: 'No' }], answer: 'yes', strength: 1.8, feedback: 'A reason.' };
  const session = createAdaptiveSession(map, [q]);
  const result = session.respond(session.start('destination').id, 'no');
  assert.equal(result.action.type, 'PREREQUISITE'); assert.equal(result.action.targetId, 'support');
  assert.throws(() => validateChecks(session.graph, [{ ...q, answer: 'missing' }]));
  assert.doesNotThrow(() => JSON.stringify(session.state));
});
