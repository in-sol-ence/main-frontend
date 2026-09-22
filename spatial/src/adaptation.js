// Deterministic demo inference, not an assessment or AI. Explicit concept
// corrections always win over inferred or inherited knowledge.
export const learnerStates = ['unknown', 'familiar', 'known', 'mastered'];
export const isKnown = state => state === 'known' || state === 'mastered';
const skills = {
  programming: /\b(python|programming|coding)\b/i, algebra: /\balgebra\b/i,
  linear: /\blinear algebra\b|\bvectors?\b|\bmatrices\b/i,
  probability: /\b(probability|statistics)\b/i, calculus: /\b(calculus|derivatives?|integrals?)\b/i,
  optimization: /\b(optimization|gradient descent)\b/i, physics: /\bphysics\b/i,
  graphics: /\b(computer graphics|rendering|shaders?)\b/i, control: /\bcontrol theory\b/i,
};
export function readLearner(background = '') {
  const knowledge = {};
  // Negation is clause-local: knowing Python but not probability is meaningful.
  for (const clause of background.toLowerCase().split(/\bbut\b|\bhowever\b|[.;]|,\s*(?=(?:not|no|never|i\b))/)) {
    const negative = /\b(not|no|never|don't|dont|can't|cannot|new to|very little|want to|need to|learning)\b/.test(clause);
    const state = negative ? 'unknown' : /\b(mastered|expert|advanced)\b/.test(clause) ? 'mastered' : /\b(some|little|familiar|basic)\b/.test(clause) ? 'familiar' : 'known';
    for (const [skill, pattern] of Object.entries(skills)) if (pattern.test(clause)) knowledge[skill] = state;
  }
  return knowledge;
}
function skillFor(node) {
  const title = node.title.toLowerCase();
  if (/linear algebra|vectors|matrices|matrix|eigen|linear transform/.test(title)) return 'linear';
  if (/probability|random variable|distribution|expected value/.test(title)) return 'probability';
  if (/calculus|derivative|integral|differential equation|limits/.test(title)) return 'calculus';
  if (/optimization|gradient/.test(title)) return 'optimization';
  if (/programming|algorithm|data structure|memory|control flow/.test(title)) return 'programming';
  if (/algebra|numbers|symbols|functions$/.test(title) && node.domain === 'mathematics') return 'algebra';
  if (title === 'foundations') return 'foundations';
  if (/control theory/.test(title)) return 'control';
  if (/computer graphics|rendering|shaders/.test(title)) return 'graphics';
  if (title === 'physics foundations' || title === 'physics') return 'physics';
  return null;
}
export function personalize(source, { userGoal = '', userBackground = '', overrides = {}, evidence = {} } = {}) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence) || Object.values(evidence).some(n => !Number.isFinite(n) || n < 0 || n > 1)) throw new Error('Invalid learner evidence.');
  const learner = readLearner(userBackground);
  if (isKnown(learner.linear)) learner.algebra = learner.linear;
  if (learner.programming && learner.algebra && learner.programming !== 'unknown' && learner.algebra !== 'unknown') learner.foundations = 'known';
  if (isKnown(learner.calculus) && isKnown(learner.linear)) learner.optimization ??= 'known';
  const theory = /\b(theory|mathematical|math|deep|research)\b/i.test(userGoal);
  const practical = /\b(build|implement|practical|code|project)\b/i.test(userGoal);
  const brief = /\b(overview|quick|basics|introduction)\b/i.test(userGoal);
  function adapt(node, inherited = 'unknown') {
    const explicit = overrides[node.id];
    if (explicit !== undefined && !learnerStates.includes(explicit)) throw new Error(`Invalid learner state: ${node.id}`);
    let state = explicit ?? learner[skillFor(node)] ?? inherited;
    // Answering a check about a parent idea is not evidence of mastery of all
    // its descendants. Preserve inherited background/manual personalization,
    // but keep assessed KCs local to the knowledge actually tested.
    const children = (node.children || []).map(child => adapt(child, isKnown(state) && !Object.hasOwn(evidence, node.id) ? state : 'unknown'));
    const needsReview = explicit === 'unknown' || children.some(child => child.needsReview);
    if (isKnown(state) && children.some(child => child.needsReview)) state = 'familiar';
    if (!explicit && state === 'unknown' && children.length && children.every(child => isKnown(child.learnerState))) state = 'familiar';
    let relevance = node.importance >= .95 ? 1 : .78;
    if (theory && ['mathematics', 'probability'].includes(node.domain)) relevance = .98;
    if (practical && ['computing', 'learning', 'reinforcement', 'graphics'].includes(node.domain)) relevance = .96;
    const stateFactor = { unknown: 1, familiar: .67, known: .16, mastered: .08 }[state];
    const importance = Math.min(1, Math.max(.055, (node.importance * .66 + relevance * .34) * stateFactor));
    const result = { ...node, children, needsReview, learnerState: state, relevanceToGoal: relevance,
      estimatedDifficulty: node.estimatedDifficulty ?? Math.min(.95, .2 + node.importance * .65),
      baseImportance: node.importance, importance, routeRole: isKnown(state) ? 'foundation' : 'journey', adaptive: true,
      depthPreference: brief ? 'overview' : theory ? 'deep' : 'balanced' };
    delete result.layout; delete result.pathways; delete result.at; delete result.role; delete result.lines;
    if (brief && node.importance < .65 && !isKnown(state)) result.importance *= .78;
    arrange(result); return result;
  }
  function arrange(region) {
    const remaining = [...region.children], ordered = [], resolved = new Set();
    while (remaining.length) {
      const ready = remaining.filter(node => isKnown(node.learnerState) || (node.prerequisites || []).every(id => resolved.has(id)));
      if (!ready.length) throw new Error(`Unresolved adaptive prerequisites: ${region.id}`);
      ready.sort((a, b) => Number(isKnown(b.learnerState)) - Number(isKnown(a.learnerState)) ||
        (theory || practical ? b.relevanceToGoal - a.relevanceToGoal : 0) ||
        Number(b.learnerState === 'familiar') - Number(a.learnerState === 'familiar') || remaining.indexOf(a) - remaining.indexOf(b));
      const next = ready[0]; remaining.splice(remaining.indexOf(next), 1); ordered.push(next); resolved.add(next.id);
    }
    const foundation = ordered.filter(node => isKnown(node.learnerState));
    const forward = ordered.filter(node => !isKnown(node.learnerState));
    let cursor = .075;
    foundation.forEach((node, index) => {
      node.layout = { at: .035 + index * Math.min(.025, .10 / Math.max(1, foundation.length - 1)), role: 'minor', height: .42, offset: index % 2 ? -.2 : .18 };
    });
    if (foundation.length) cursor = foundation.at(-1).layout.at + .05;
    forward.forEach((node, index) => {
      if (index) cursor += (.037 + .025 * node.importance) * (brief ? .82 : 1);
      node.layout = { at: cursor, role: node.importance > .82 ? 'milestone' : 'supporting', height: .6 + .5 * node.importance, offset: index % 2 ? -.26 : .2 };
    });
    const end = Math.max(.1, ...ordered.map(node => node.layout.at));
    if (end > .88) ordered.forEach(node => { node.layout.at *= .88 / end; });
    region.children = ordered;
    region.route = { forward: forward.map(node => node.id), foundations: foundation.map(node => node.id), end: Math.max(.12, ...ordered.map(node => node.layout.at)) };
    region.startAt = foundation.length ? Math.max(0, foundation.at(-1).layout.at - .045) : .018;
    region.startDistance = undefined;
  }
  return { source: adapt(structuredClone(source)), learner };
}
