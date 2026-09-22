// Session-local evidence model. Fractional Beta counts are a transparent demo
// heuristic, not calibrated probabilities or proof of mastery. Replaceable API.
const prior = { unknown: .2, familiar: .5, known: .78, mastered: .9 };
export function createLearnerState(graph) {
  return { components: Object.fromEntries([...graph.values()].map(node => [node.id, {
    mastery: prior[node.learnerState] ?? .2, confidence: 0, evidence: 0,
    alpha: prior[node.learnerState] ?? .2, beta: 1 - (prior[node.learnerState] ?? .2),
    attempts: 0, correct: 0, reports: [], questionEvidence: {},
  }])), responses: [], answeredExposures: [], detours: [], actions: [], sequence: 0 };
}
export function recordResponse(state, question, choiceId, exposureId) {
  const kc = state.components[question.kcId];
  if (!kc || !question.choices.some(choice => choice.id === choiceId)) throw new Error('Response does not match a knowledge component and choice.');
  if (state.answeredExposures.includes(exposureId)) return null;
  const correct = choiceId === question.answer;
  const before = kc.mastery, previous = kc.questionEvidence[question.id];
  // A repeated item replaces its own contribution at reduced strength. It
  // cannot manufacture certainty through repeated clicks or memorized retries.
  const repetition = (previous?.attempts || 0) + 1;
  const strength = question.strength * (repetition > 1 ? .35 : 1);
  if (previous) { kc.alpha -= previous.success; kc.beta -= previous.failure; kc.evidence -= previous.strength; }
  const success = correct ? strength : 0, failure = correct ? 0 : strength;
  kc.alpha += success; kc.beta += failure; kc.evidence += strength;
  kc.mastery = kc.alpha / (kc.alpha + kc.beta);
  kc.confidence = kc.evidence / (kc.evidence + 3);
  kc.attempts++; kc.correct += Number(correct);
  kc.questionEvidence[question.id] = { success, failure, strength, attempts: repetition, correct };
  state.answeredExposures.push(exposureId);
  const response = { id: exposureId, kcId: question.kcId, questionId: question.id, choiceId, correct,
    strength, confidence: kc.confidence, before, after: kc.mastery, sequence: state.responses.length + 1 };
  state.responses.push(response); return response;
}
export function recordSelfReport(state, id, known) {
  const kc = state.components[id]; if (!kc) return;
  // Keep claims distinct from tested evidence. Do not silently turn a button
  // press into a successful assessment, nor infer mastery of descendants.
  kc.reports.push({ known, sequence: state.responses.length });
}
export function evidenceOverrides(state) {
  return Object.fromEntries(Object.entries(state.components).filter(([, kc]) => kc.attempts).map(([id, kc]) =>
    [id, kc.mastery > .7 ? 'known' : kc.mastery >= .35 ? 'familiar' : 'unknown']));
}
