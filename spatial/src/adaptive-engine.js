import { indexKnowledge } from './knowledge-model.js';
import { createLearnerState, recordResponse, recordSelfReport, evidenceOverrides } from './learner-model.js';
import { knowledgeChecks, validateChecks } from './knowledge-checks.js';

export const learningActions = Object.freeze(['QUESTION', 'EXPLANATION', 'EXAMPLE', 'PRACTICE', 'PREREQUISITE', 'ADVANCE']);

// No DOM, renderer, camera, timer, network, or named-concept decision branches.
// An eventual model only needs to return this same LearningAction contract.
export function createAdaptiveSession(map, checks = knowledgeChecks) {
  const graph = indexKnowledge(map), state = createLearnerState(graph);
  validateChecks(graph, checks);
  const bank = checks.filter(q => graph.has(q.kcId));
  let current = null;
  const mastery = id => state.components[id]?.mastery ?? 0;
  const available = id => bank.filter(q => q.kcId === id);
  function questionFor(id) {
    const evidence = state.components[id].questionEvidence;
    return available(id).find(q => !evidence[q.id]) || available(id).find(q => !evidence[q.id].correct && evidence[q.id].attempts < 2) || null;
  }
  function action(type, kcId, extras = {}) {
    if (!learningActions.includes(type) || !graph.has(kcId)) throw new Error('Invalid learning action.');
    current = { id: `action-${++state.sequence}`, type, kcId, targetId: kcId, reason: '', ...extras };
    state.actions.push({ ...current }); return current;
  }
  function test(id, type = 'QUESTION', reason = '') {
    const question = questionFor(id);
    return question ? action(type, id, { questionId: question.id, reason })
      : action('EXPLANATION', id, { reason: 'There is no fresh check here yet. Revisit the idea or explore freely.', exhausted: true });
  }
  function nextConcept(id) {
    const node = graph.get(id), siblings = graph.get(node.parent)?.children || node.children;
    const position = siblings.findIndex(n => n.id === id);
    const candidates = siblings.filter((n, i) => i > position && n.id !== id && n.explanation && mastery(n.id) <= .7);
    const ready = n => n.prerequisites.every(p => mastery(p) > .7);
    return candidates.find(n => n.prerequisites.includes(id) && ready(n)) || candidates.find(ready) || candidates[0] || null;
  }
  function decide(id, response) {
    const node = graph.get(id), estimate = mastery(id);
    if (estimate > .7) {
      const detour = state.detours.at(-1);
      if (detour?.prerequisiteId === id) {
        state.detours.pop();
        return action('ADVANCE', id, { targetId: detour.resumeId, reconnect: true,
          reason: `${node.title} is clearer now. Reconnect with ${graph.get(detour.resumeId).title}.` });
      }
      const next = nextConcept(id);
      return action('ADVANCE', id, { targetId: next?.id || node.parent || id,
        reason: next ? `Your answers support moving beyond ${node.title}. Next, ${next.title}.` : 'Your answers support moving on. Return to the surrounding journey.' });
    }
    if (estimate < .35) {
      // Some broad KCs (Vectors) contain their foundations rather than listing
      // them as sibling prerequisites. Reuse that existing recursive interior.
      const foundations = node.prerequisites.length ? node.prerequisites.map(pid => graph.get(pid)) : node.children;
      const prerequisite = foundations.filter(n => n?.explanation && mastery(n.id) < .55)
        .sort((a, b) => mastery(a.id) - mastery(b.id))[0];
      if (prerequisite && !state.detours.some(d => d.resumeId === id)) {
        state.detours.push({ resumeId: id, prerequisiteId: prerequisite.id });
        return action('PREREQUISITE', id, { targetId: prerequisite.id,
          reason: `${node.title} is still uncertain. Revisit ${prerequisite.title}, then return here.` });
      }
      return action('EXPLANATION', id, { reason: 'Let’s rebuild the idea before another check.', feedback: response?.feedback });
    }
    return action('EXAMPLE', id, { reason: 'There is some evidence of understanding. Work through one example, then check it another way.' });
  }
  return {
    graph, state, get current() { return current; },
    hasChecks: id => available(id).length > 0,
    question: item => bank.find(q => q.id === item?.questionId),
    start(id) { return test(id); },
    selfReport(id, known = true) { recordSelfReport(state, id, known); return available(id).length ? test(id, 'QUESTION', 'Let’s check that idea with one short question.') : null; },
    respond(actionId, choiceId) {
      if (!current || current.id !== actionId || !['QUESTION', 'PRACTICE'].includes(current.type)) return null;
      const question = bank.find(q => q.id === current.questionId);
      const response = recordResponse(state, question, choiceId, actionId);
      if (!response) return null;
      const next = decide(question.kcId, response);
      return { response, feedback: question.feedback, action: next };
    },
    continue(id) {
      const detour = state.detours.at(-1);
      if (!available(id).length && detour?.prerequisiteId === id) {
        state.detours.pop();
        return action('ADVANCE', id, { targetId: detour.resumeId, reconnect: true,
          reason: 'Take this explanation back to the original idea. Reading alone has not been counted as mastery.' });
      }
      return test(id, 'PRACTICE', 'Use the idea in one more situation.');
    },
    arrive(item) {
      if (['QUESTION', 'PRACTICE', 'EXPLANATION', 'EXAMPLE'].includes(item.type)) return item;
      if (item.type === 'PREREQUISITE') return action('EXPLANATION', item.targetId, { reason: `Strengthening a prerequisite for ${graph.get(item.kcId).title}.`, detour: true });
      if (item.reconnect) return test(item.targetId, 'QUESTION', 'Back on your original path. Try the idea again with this foundation in mind.');
      return available(item.targetId).length ? test(item.targetId, 'QUESTION', 'Ready to move forward. Try this idea next.') : action('EXPLANATION', item.targetId, { reason: item.reason });
    },
    cancel() { current = null; },
    overrides: () => evidenceOverrides(state),
    evidence: () => Object.fromEntries(Object.entries(state.components).filter(([, kc]) => kc.attempts).map(([id, kc]) => [id, kc.mastery])),
  };
}

export function navigationStep(graph, currentIds, targetId) {
  const path = []; let node = graph.get(targetId);
  if (!node) throw new Error('Unknown adaptive destination.');
  while (node) { path.unshift(node.id); node = graph.get(node.parent); }
  let shared = 0;
  while (shared < path.length && shared < currentIds.length && path[shared] === currentIds[shared]) shared++;
  if (!shared) throw new Error('Adaptive destination must belong to this journey.');
  if (shared < currentIds.length) return { type: 'return', depth: shared - 1 };
  if (shared < path.length) return { type: 'enter', id: path[shared] };
  return { type: 'arrived' };
}

export function emphasizeIntervention(map, session, action) {
  const result = structuredClone(map), nodes = indexKnowledge(result);
  if (!action) return result;
  const focus = new Set([action.kcId, action.targetId]);
  for (const id of [...focus]) {
    let node = nodes.get(id);
    while (node?.parent && node.parent !== result.id) { focus.add(node.parent); node = nodes.get(node.parent); }
  }
  for (const node of nodes.values()) {
    const estimate = session.state.components[node.id];
    if (estimate) { node.mastery = estimate.mastery; node.masteryConfidence = estimate.confidence; }
    if (focus.has(node.id) && (node.id === action.targetId || estimate?.mastery < .35)) {
      node.importance = Math.max(node.importance, .96); node.role = 'milestone';
    }
    for (const path of node.pathways) if (focus.has(path.source) && focus.has(path.target)) path.strength = 1.15;
  }
  return result;
}
