import { clamp, smootherstep } from './motion.js';

// A boot hook, not a second entry experience. An embedding page hands this study
// a goal instead of the visitor typing one; everything from the submitted goal
// onward is the existing prompt → discovery → journey, unchanged.
export const MESSAGE = 'skatebored:spatial';
// The statement types the way every slide before it typed. Typed.js humanizes
// its typeSpeed 65 to 65 + U(0, 32.5) ms per character; this is that mean.
export const TYPE_INTERVAL = .08125;
// Then it holds for the same 2000ms as every stage of the sequence before it.
export const STATEMENT_HOLD = 2;
export const LEARNER = 'John Doe';
export const RATIONALE = `Our RL model targets knowledge concepts based on ${LEARNER}’s knowledge state.`;
export const TOPIC_LINE = `${LEARNER} wants to learn {topic}.`;
export const CONCEPTS_LABEL = 'Knowledge concepts';
export const REPEATS = 'The process repeats.';

export function readHandoff(search = '') {
  const parameters = new URLSearchParams(search);
  const goal = (parameters.get('goal') || '').trim().slice(0, 300);
  if (!goal) return null;
  return {
    goal,
    background: (parameters.get('background') || '').trim().slice(0, 300),
    statement: (parameters.get('statement') || '').trim().slice(0, 200),
    // The embedding page owns the narration copy; these defaults are its current wording.
    learner: (parameters.get('learner') || '').trim().slice(0, 80) || LEARNER,
    topicLine: (parameters.get('topicLine') || '').trim().slice(0, 200) || TOPIC_LINE,
    rationale: (parameters.get('rationale') || '').trim().slice(0, 300) || RATIONALE,
    conceptsLabel: (parameters.get('conceptsLabel') || '').trim().slice(0, 80) || CONCEPTS_LABEL,
    repeats: (parameters.get('repeats') || '').trim().slice(0, 120) || REPEATS,
  };
}

// The statement is revealed a character at a time, holds, and then submits the
// goal. The existing construction choreography owns everything after that,
// including the recession this statement inherits from the prompt it stands in for.
export function statementAt(seconds, length, reduced = false) {
  const characters = reduced ? length : clamp(Math.floor(seconds / TYPE_INTERVAL), 0, length);
  const typedAt = reduced ? 0 : length * TYPE_INTERVAL;
  const hold = reduced ? .45 : STATEMENT_HOLD;
  return { characters, typed: characters === length, submit: seconds >= typedAt + hold };
}

// Why this concept, for this learner. Read off the route the existing adaptive
// engine already produced, so the note cannot claim an order the path does not
// actually take. Replaces each concept's own annotation detail; the annotation
// itself is the existing one that the label already reveals on hover. The first
// concept's line is what the system's own hover states when it selects it.
export function personalNotes(map, learner = LEARNER, topicLine = `${learner} wants to learn {topic}.`) {
  const forward = map.route?.forward ?? [];
  const titles = new Map((map.children || []).map(node => [node.id, node.title]));
  const notes = new Map();
  for (const node of map.children || []) {
    const step = forward.indexOf(node.id);
    if (step === -1) notes.set(node.id, `${learner} already knows this.`);
    else if (step === 0) notes.set(node.id, topicLine.replaceAll('{topic}', node.title));
    else if (step === forward.length - 1) notes.set(node.id, `Where ${learner} is heading.`);
    else notes.set(node.id, `${learner} needs ${titles.get(forward[step - 1])} before this.`);
  }
  return notes;
}

export function applyPersonalNotes(map, learner = LEARNER, topicLine) {
  const notes = personalNotes(map, learner, topicLine);
  for (const node of map.children || []) {
    if (node.annotation) node.annotation.detail = notes.get(node.id) ?? node.annotation.detail;
  }
  return map;
}

// The first concept the compiled route actually puts in front of the learner:
// derived from the engine's output, never named in advance.
export function firstConcept(map) {
  return map?.route?.forward?.[0] ?? map?.children?.[0]?.id ?? null;
}

// The scripted interaction, in the journey's own units. Once travel has begun,
// the system settles on the first concept of the route exactly as a pointer
// would, states in large type why, opens it, lets its knowledge concepts grow
// out of it, states why those, and then hands the journey back.
export const HOVER_DELAY = 1.4;
export const REVEAL_DELAY = 1.2;
// The focus and the camera settle on the topic before a word appears, so the
// statement reads as a consequence of the selection rather than a caption.
export const NARRATION_LEAD = .8;
// Each statement then types at the slides' pace and is left up long enough to
// be read against the space it explains.
export const NARRATION_HOLD = 2.8;
// How far travel is stilled while a statement is read: close to rest, but the
// path keeps its slight drift so the space never looks paused.
export const NARRATION_STILLNESS = .8;
// Knowledge concepts rise out of the entered topic along its path over this long.
export const EMERGENCE_DURATION = 3.2;
// After the reason, the explained concept's resources grow; its lecture segment
// opens once the fan has settled and is left up long enough to be seen.
export const RESOURCE_LEAD = .7;
export const RESOURCE_READ = 5.5;
// Then travel resumes at the journey's own pace, and each later concept of the
// branch is selected for this long as it comes near.
export const PASS_HOLD = 1.8;
export const PASS_DEPTH = 36;
// An adaptive branch's own arrival law brings travel to rest 14 units short of
// its last concept (layer.js). Once every concept of the branch has had its
// turn and the camera is this close to that resting point, the space is empty
// ahead and the embedding page takes the learner's knowledge back.
export const ARRIVAL_STOP = 14;
export const FINALE_LEAD = 22;
// Never strand the demonstration: after this long in the branch it ends anyway.
export const REPEATS_LIMIT = 40;
// An adaptive branch draws its line only to 25 units past its route end
// (layer.js `exit`); there it converges into nothing. That tip is where the
// learner's knowledge is shown, in the same space, at the end of the path.
export const ROUTE_EXIT = 25;
// The tip's place on screen, as view fractions; if it is out of view, the
// farthest point of the remaining line that is still in view.
export function vanishingPoint(project, { distance, routeEnd, arcLength }) {
  const inView = p => p && p.z < 1 && Math.abs(p.x) < .9 && Math.abs(p.y) < .9;
  const tip = routeEnd * arcLength + ROUTE_EXIT;
  let point = project(tip);
  if (!inView(point)) {
    point = null;
    for (let at = distance + 6; at <= tip; at += 2) { const sample = project(at); if (inView(sample)) point = sample; }
  }
  if (!point) return { x: .5, y: .5 };
  return { x: (point.x + 1) / 2, y: (1 - point.y) / 2 };
}
export function finaleReached({ distance, routeEnd, arcLength, forward, passed, passing, elapsed = 0 }) {
  if (elapsed >= REPEATS_LIMIT) return true;
  const rest = routeEnd * arcLength - ARRIVAL_STOP;
  return !passing && forward.every(id => passed.has(id)) && distance > rest - FINALE_LEAD;
}

// Characters shown, how far travel is stilled, and when it is finished.
export function narrationAt(seconds, length, reduced = false) {
  const lead = reduced ? 0 : NARRATION_LEAD;
  const characters = reduced ? length : clamp(Math.floor((seconds - lead) / TYPE_INTERVAL), 0, length);
  const typedAt = reduced ? 0 : lead + length * TYPE_INTERVAL;
  const settle = reduced ? 1 : smootherstep(seconds / lead);
  return { characters, typed: characters === length, weight: settle * NARRATION_STILLNESS,
    done: seconds >= typedAt + (reduced ? 2.2 : NARRATION_HOLD) };
}

// The entered topic's own construction formation, opened outward from where
// the viewer arrives, so its knowledge concepts lift out of the path in order.
export function emergenceAt(seconds, span, reduced = false) {
  const progress = reduced ? 1 : smootherstep(seconds / EMERGENCE_DURATION);
  return { radius: 6 + progress * span, labels: 1, relationships: progress, ribbon: 1, done: progress >= 1 };
}

// A cinematic annotation beside the space, never on top of what it explains.
// The side is chosen once per statement, away from the anchor; the statement
// sits level with a topic, and below a cluster of knowledge concepts. Narrow
// viewports keep it along the bottom, under the visualization.
export function narrationPlacement({ anchor, width, height, textHeight, composition = 'beside', side = null }) {
  if (width < 720) {
    return { side: 'bottom', x: 22, width: width - 44, y: Math.max(88, height - textHeight - 92) };
  }
  const chosen = side || (anchor.x > width / 2 ? 'left' : 'right');
  const margin = Math.max(40, width * .06);
  let box = clamp(width * .36, 340, 560);
  const room = chosen === 'left' ? anchor.x - 64 - margin : width - margin - anchor.x - 64;
  box = Math.max(300, Math.min(box, room));
  const x = chosen === 'left' ? margin : width - margin - box;
  const y = composition === 'below' ? Math.max(anchor.y + 56, height * .56) : anchor.y - textHeight / 2;
  return { side: chosen, x, width: box, y: clamp(y, 88, Math.max(88, height - textHeight - 88)) };
}

// The same window the pointer's own hit test accepts, with a legible label.
export function hoverable(candidate) {
  return Boolean(candidate) && candidate.depth > 6 && candidate.depth <= 155 && candidate.labelOpacity >= .3;
}

// A selected concept holds the travel still while its reason is read, then
// releases it. The envelope drives the existing learning weight, which is what
// the journey's own speed law already slows and resumes for in-space reading.
export const rationaleRise = (reduced = false) => (reduced ? 0 : .6);
export function rationaleAt(seconds, reduced = false) {
  const rise = rationaleRise(reduced), hold = reduced ? 2.2 : 3.4, fall = reduced ? .2 : .9;
  const arriving = rise ? smootherstep(seconds / rise) : Number(seconds >= 0);
  const leaving = 1 - smootherstep((seconds - rise - hold) / fall);
  return { presence: clamp(Math.min(arriving, leaving), 0, 1), done: seconds >= rise + hold + fall };
}
