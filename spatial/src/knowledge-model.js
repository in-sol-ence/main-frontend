import { domains } from './concepts.js';
import { learnerStates, isKnown } from './adaptation.js';
import { validateLearning } from './learning-content.js';

const domainNames = { foundations: 'Core knowledge', mathematics: 'Mathematics', probability: 'Probability', learning: 'Machine learning', reinforcement: 'Reinforcement learning', physics: 'Physics', spacetime: 'Spacetime', computing: 'Computer science', graphics: 'Computer graphics' };
function titleLines(title) {
  const lines = []; let line = '';
  for (const word of title.split(' ')) {
    if (line && `${line} ${word}`.length > 21) { lines.push(line); line = word; }
    else line += `${line ? ' ' : ''}${word}`;
  }
  if (line) lines.push(line);
  return lines;
}

// JSON in, validated recursive nodes out. No renderer-specific concept names,
// parent object cycles, network calls, or assumptions about an AI provider.
export function compileKnowledge(input) {
  const ids = new Set(), ancestors = new Set();
  function compile(source, parent = null, depth = 0) {
    if (!source || typeof source !== 'object' || ancestors.has(source) || depth > 64) throw new Error('Knowledge must be an acyclic tree, at most 64 levels deep.');
    if (typeof source.id !== 'string' || !source.id.trim() || ids.has(source.id)) throw new Error(`Missing or duplicate concept id: ${source.id}`);
    if (typeof source.title !== 'string' || !source.title.trim()) throw new Error(`Missing title: ${source.id}`);
    if (!domains[source.domain]) throw new Error(`Unknown domain: ${source.domain}`);
    if (!Number.isFinite(source.importance) || source.importance < 0 || source.importance > 1) throw new Error(`Invalid importance: ${source.id}`);
    if (typeof source.description !== 'string') throw new Error(`Missing description: ${source.id}`);
    validateLearning(source);
    if (source.learnerState !== undefined && !learnerStates.includes(source.learnerState)) throw new Error(`Invalid learner state: ${source.id}`);
    for (const field of ['relevanceToGoal', 'estimatedDifficulty', 'baseImportance']) if (source[field] !== undefined && (!Number.isFinite(source[field]) || source[field] < 0 || source[field] > 1)) throw new Error(`Invalid ${field}: ${source.id}`);
    if (source.startAt !== undefined && (!Number.isFinite(source.startAt) || source.startAt < 0 || source.startAt >= 1)) throw new Error(`Invalid start position: ${source.id}`);
    if (source.secondaryDomain && !domains[source.secondaryDomain]) throw new Error(`Unknown secondary domain: ${source.id}`);
    if (source.startDistance !== undefined && (!Number.isFinite(source.startDistance) || source.startDistance < 0)) throw new Error(`Invalid start distance: ${source.id}`);
    if (source.pathways !== undefined && !Array.isArray(source.pathways)) throw new Error(`Pathways must be an array: ${source.id}`);
    if (source.layout !== undefined) {
      const layout = source.layout;
      if (!layout || typeof layout !== 'object' || Array.isArray(layout)) throw new Error(`Invalid layout: ${source.id}`);
      if (layout.lines !== undefined && (!Array.isArray(layout.lines) || !layout.lines.length || layout.lines.some(line => typeof line !== 'string' || !line.trim()))) throw new Error(`Invalid title lines: ${source.id}`);
      if (layout.side !== undefined && ![-1, 0, 1].includes(layout.side)) throw new Error(`Invalid label side: ${source.id}`);
      if (layout.role !== undefined && !['minor', 'supporting', 'milestone', 'goal'].includes(layout.role)) throw new Error(`Invalid role: ${source.id}`);
    }
    if (source.children !== undefined && !Array.isArray(source.children)) throw new Error(`Children must be an array: ${source.id}`);
    if (source.prerequisites !== undefined && (!Array.isArray(source.prerequisites) || source.prerequisites.some(id => typeof id !== 'string'))) throw new Error(`Invalid prerequisites: ${source.id}`);
    ids.add(source.id); ancestors.add(source);
    const children = (source.children || []).map(child => compile(child, source.id, depth + 1));
    ancestors.delete(source);
    const lookup = new Map(children.map(child => [child.id, child]));
    for (const child of children) for (const prerequisite of child.prerequisites) {
      if (!lookup.has(prerequisite) || prerequisite === child.id) throw new Error(`Unresolved local prerequisite: ${child.id} -> ${prerequisite}`);
    }
    const visiting = new Set(), checked = new Set();
    function checkCycle(node) {
      if (visiting.has(node.id)) throw new Error(`Prerequisite cycle inside ${source.id}`);
      if (checked.has(node.id)) return;
      visiting.add(node.id); node.prerequisites.forEach(id => checkCycle(lookup.get(id)));
      visiting.delete(node.id); checked.add(node.id);
    }
    children.forEach(checkCycle);
    // Stable topological ordering lets a generated map omit spatial positions.
    const ordered = [], remaining = [...children], resolved = new Set();
    while (remaining.length) {
      const index = remaining.findIndex(child => (source.adaptive && isKnown(child.learnerState)) || child.prerequisites.every(id => resolved.has(id)));
      if (index < 0) throw new Error(`Prerequisite cycle inside ${source.id}`);
      const [child] = remaining.splice(index, 1); ordered.push(child); resolved.add(child.id);
    }
    // Deterministic spacing gives important locations a little more approach
    // room. Original authored positions remain untouched. No random reshuffle.
    const variation = id => [...id].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7) % 101 / 100;
    const intervals = ordered.slice(1).map((child, i) => .78 + .5 * child.importance ** 2 + .22 * ordered[i].importance + .3 * variation(child.id));
    const span = intervals.reduce((sum, gap) => sum + gap, 0) || 1;
    let traveled = 0;
    ordered.forEach((child, index) => {
      if (index) traveled += intervals[index - 1];
      const layout = child.layout || {};
      Object.assign(child, {
        at: layout.at ?? .11 + .72 * traveled / span,
        side: layout.side ?? (index % 2 ? -1 : 1),
        offset: layout.offset ?? (index % 2 ? -1 : 1) * (.12 + .22 * variation(child.id)),
        height: layout.height ?? .48 + child.importance * .65 + .12 * variation(child.id),
        lines: layout.lines || titleLines(child.title),
        role: layout.role || (child.importance >= .78 ? 'milestone' : child.importance < .36 ? 'minor' : 'supporting'),
      });
      if (!(child.at > 0 && child.at < 1) || !Number.isFinite(child.height) || !Number.isFinite(child.offset)) throw new Error(`Invalid spatial placement: ${child.id}`);
      child.position = { at: child.at, offset: child.offset, height: child.height, side: child.side };
    });
    const paths = source.pathways ? source.pathways.map(path => ({ ...path })) : [];
    if (!source.pathways) {
      for (const child of ordered) for (const prerequisite of child.prerequisites.slice(0, 2)) {
        if (source.adaptive && isKnown(child.learnerState)) continue;
        if (paths.length >= ordered.length + 1) break;
        const index = paths.length, sign = index % 2 ? 1 : -1;
        paths.push({ id: `${prerequisite}--${child.id}`, source: prerequisite, target: child.id,
          bend: sign * (3.4 + index % 4 * .65), lift: -sign * (1.2 + index % 3 * .35), drift: sign * .02, strength: .6 + .3 * child.importance });
      }
    }
    const pathIds = new Set();
    for (const path of paths) {
      if (typeof path.id !== 'string' || !path.id || pathIds.has(path.id) || !lookup.get(path.target)?.prerequisites.includes(path.source) || !lookup.has(path.source)) throw new Error(`Invalid pathway inside ${source.id}`);
      if (lookup.get(path.source).at >= lookup.get(path.target).at) throw new Error(`Prerequisite placement must precede its target: ${path.id}`);
      if (![path.bend, path.lift, path.drift, path.strength].every(Number.isFinite)) throw new Error(`Invalid pathway geometry: ${path.id}`);
      pathIds.add(path.id);
    }
    return {
      id: source.id, title: source.title, domain: source.domain, importance: source.importance,
      description: source.description, prerequisites: [...(source.prerequisites || [])],
      ...(source.explanation ? { explanation: source.explanation, intuitiveExplanation: source.intuitiveExplanation,
        intermediateExplanation: source.intermediateExplanation, advancedExplanation: source.advancedExplanation, examples: [...(source.examples || [])],
        visualType: source.visualType, visualData: source.visualData ? structuredClone(source.visualData) : undefined } : {}),
      learnerState: source.learnerState ?? 'unknown', relevanceToGoal: source.relevanceToGoal ?? 1,
      estimatedDifficulty: source.estimatedDifficulty ?? .5, baseImportance: source.baseImportance ?? source.importance,
      routeRole: source.routeRole ?? 'journey', adaptive: Boolean(source.adaptive),
      depthPreference: source.depthPreference ?? 'balanced', startAt: source.startAt,
      route: source.route ? { ...source.route, forward: [...source.route.forward], foundations: [...source.route.foundations] } : undefined,
      parent, children: ordered, pathways: paths, layout: source.layout ? { ...source.layout } : undefined,
      startDistance: source.startDistance ?? 13,
      ...(source.secondaryDomain ? { secondaryDomain: source.secondaryDomain } : {}),
      annotation: { category: source.category || `${domainNames[source.domain]} · ${source.importance >= .78 ? 'Core idea' : 'Foundation'}`, detail: source.description },
    };
  }
  return compile(input);
}

export function indexKnowledge(root) {
  const index = new Map();
  function visit(node) { index.set(node.id, node); node.children.forEach(visit); }
  visit(root); return index;
}
