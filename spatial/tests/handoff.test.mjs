import test from 'node:test';
import assert from 'node:assert/strict';
import { readHandoff, statementAt, personalNotes, applyPersonalNotes, firstConcept, hoverable, rationaleAt, narrationAt, emergenceAt, narrationPlacement, RATIONALE, LEARNER, STATEMENT_HOLD, TYPE_INTERVAL, HOVER_DELAY, REVEAL_DELAY, NARRATION_LEAD, NARRATION_HOLD, EMERGENCE_DURATION } from '../src/handoff.js';
import { focusAppearance } from '../src/focus.js';
import { isKnown } from '../src/adaptation.js';
import { buildJourney } from '../src/journey-provider.js';
import { constructionAt, DISCOVERY_DURATION } from '../src/entry.js';
import { createLayer } from '../src/layer.js';
import { frameAtConcept, worldPose, CameraPassage, ExplorationHistory } from '../src/exploration.js';
import { locateConcept } from '../src/landmark-layout.js';

const STATEMENT = 'Let’s say John Doe wants to learn calculus.';

test('a goal is only handed in explicitly; the front door is otherwise untouched', () => {
  for (const search of ['', '?', '?goal=', '?goal=%20%20', '?statement=Anything', '?other=calculus']) {
    assert.equal(readHandoff(search), null, search);
  }
  const handed = readHandoff(`?goal=Learn%20calculus%20from%20the%20beginning&background=I%20know%20algebra&statement=${encodeURIComponent(STATEMENT)}`);
  assert.deepEqual(handed, { goal: 'Learn calculus from the beginning', background: 'I know algebra', statement: STATEMENT,
    learner: LEARNER, topicLine: 'John Doe wants to learn {topic}.', rationale: RATIONALE, conceptsLabel: 'Knowledge concepts', repeats: 'The process repeats.' });
  // The embedding page's copy replaces every narration line.
  const worded = readHandoff('?goal=a&learner=Ada&topicLine=Ada%20picks%20%7Btopic%7D.&rationale=Because.&conceptsLabel=Parts');
  assert.deepEqual([worded.learner, worded.topicLine, worded.rationale, worded.conceptsLabel], ['Ada', 'Ada picks {topic}.', 'Because.', 'Parts']);
  assert.equal(personalNotes({ route: { forward: ['x'] }, children: [{ id: 'x', title: 'Limits' }] }, 'Ada', worded.topicLine).get('x'), 'Ada picks Limits.');
  assert.equal(readHandoff('?goal=a').background, '');
  assert.equal(readHandoff(`?goal=${'x'.repeat(400)}`).goal.length, 300);
  assert.equal(readHandoff(`?goal=a&statement=${'y'.repeat(400)}`).statement.length, 200);
});

test('the handed goal reaches the existing calculus map, never the reinforcement fallback', async () => {
  const { goal } = readHandoff('?goal=Learn%20calculus%20from%20the%20beginning');
  const result = await buildJourney({ userGoal: goal });
  assert.equal(result.example, 'calculus');
  assert.equal(result.fallback, false);
  assert.equal(result.map.title, 'Calculus from the Beginning');
  assert.equal(result.request.userGoal, goal);
  // The path itself is the authored one, not a generated or altered tree.
  assert.deepEqual(result.map.children.map(node => node.title), ['Algebra Foundations', 'Functions', 'Limits', 'Derivatives', 'Integrals', 'Differential Equations', 'Applications']);
  const untouched = await buildJourney({ userGoal: 'Learn pottery' });
  assert.equal(untouched.fallback, true);
});

test('the statement types a character at a time, holds for the stage hold, and submits its goal once', () => {
  const length = STATEMENT.length;
  assert.equal(statementAt(0, length).characters, 0);
  assert.equal(statementAt(0, length).submit, false);
  // The pacing is the earlier slides' pacing: Typed.js typeSpeed 65, humanized.
  assert.ok(Math.abs(TYPE_INTERVAL - .065 * 1.25) < 1e-9);
  let previous = 0, typedAt = null;
  const typedExactly = length * TYPE_INTERVAL;
  for (let step = 0; step * .01 <= typedExactly + STATEMENT_HOLD + 1; step++) {
    const time = step * .01;
    const state = statementAt(time, length);
    assert.ok(state.characters >= previous && state.characters - previous <= 1, 'reveals one character at a time, never swaps');
    assert.ok(state.characters <= length);
    previous = state.characters;
    if (typedAt === null && state.typed) typedAt = time;
    assert.equal(state.submit, time >= typedExactly + STATEMENT_HOLD - 1e-9, `submit at ${time.toFixed(2)}`);
    if (!state.typed) assert.equal(state.submit, false, 'nothing hands over mid-sentence');
  }
  assert.ok(Math.abs(typedAt - typedExactly) < .02);
  assert.equal(STATEMENT_HOLD, 2, 'the same 2000ms hold as every stage before it');
  // Reduced motion keeps every stage, without the typing or the long hold.
  assert.equal(statementAt(0, length, true).characters, length);
  assert.equal(statementAt(0, length, true).submit, false);
  assert.equal(statementAt(.45, length, true).submit, true);
  // Whatever the preference, construction still owns everything after the goal.
  assert.equal(constructionAt(0).prompt, 1);
  assert.equal(constructionAt(0, true).prompt, 1);
});

test('what the learner already has moves the route, and every note matches it', async () => {
  const handed = readHandoff('?goal=Learn%20calculus%20from%20the%20beginning&background=I%20know%20algebra');
  const result = await buildJourney({ userGoal: handed.goal, userBackground: handed.background });
  const { map } = result;
  assert.equal(result.adapted, true, 'the existing engine personalized this route');
  // Algebra is behind him, so the journey itself starts at limits.
  assert.deepEqual(map.route.foundations.map(id => map.children.find(node => node.id === id).title),
    ['Algebra Foundations', 'Functions']);
  assert.deepEqual(map.route.forward.map(id => map.children.find(node => node.id === id).title),
    ['Limits', 'Derivatives', 'Integrals', 'Differential Equations', 'Applications']);

  const notes = personalNotes(map);
  assert.equal(notes.size, map.children.length, 'every concept on the path says why');
  for (const node of map.children) {
    const note = notes.get(node.id);
    assert.ok(note.length < 80, 'the note stays one short line');
    assert.equal(note.includes(LEARNER), true);
    // A note may never claim knowledge the compiled route does not hold.
    assert.equal(note.includes('already knows'), isKnown(node.learnerState));
  }
  // The first concept's line is the hover statement, naming the actual topic
  // the route begins with rather than the goal.
  assert.equal(firstConcept(map), map.route.forward[0]);
  assert.equal(map.children.find(node => node.id === firstConcept(map)).title, 'Limits');
  assert.equal(notes.get(firstConcept(map)), 'John Doe wants to learn Limits.');
  assert.equal(notes.get(map.route.forward.at(-1)), 'Where John Doe is heading.');
  assert.equal(notes.get(map.route.forward[1]), 'John Doe needs Limits before this.');

  // They replace the existing annotation detail; the annotation itself is the
  // one the label already reveals, so nothing new is rendered.
  const before = map.children.map(node => node.annotation.category);
  applyPersonalNotes(map);
  assert.deepEqual(map.children.map(node => node.annotation.category), before);
  assert.deepEqual(map.children.map(node => node.annotation.detail), map.children.map(node => notes.get(node.id)));

  // Without a background nothing is known, the route starts at its first
  // concept, and no note pretends otherwise.
  const plain = (await buildJourney({ userGoal: handed.goal })).map;
  assert.equal(plain.route.foundations.length, 0);
  assert.equal(plain.children.find(node => node.id === firstConcept(plain)).title, 'Algebra Foundations');
  assert.equal(personalNotes(plain).get(firstConcept(plain)), 'John Doe wants to learn Algebra Foundations.');
  for (const note of personalNotes(plain).values()) assert.equal(note.includes('already knows'), false);
  assert.equal(firstConcept(null), null);
  assert.equal(firstConcept({ children: [] }), null);
});

test('a selected concept holds the journey, states its reason, and releases it', () => {
  assert.equal(RATIONALE, 'Our RL model targets knowledge concepts based on John Doe’s knowledge state.');
  assert.equal(rationaleAt(0).presence, 0);
  let peak = 0, previous = -1, rising = true;
  for (let time = 0; time <= 6; time += .02) {
    const state = rationaleAt(time);
    assert.ok(state.presence >= 0 && state.presence <= 1);
    peak = Math.max(peak, state.presence);
    if (rising && state.presence < previous) rising = false;
    // One rise and one fall: the hold must never flicker back up.
    if (!rising) assert.ok(state.presence <= previous + 1e-12, 'the reason fades once and stays gone');
    previous = state.presence;
    if (state.done) { assert.equal(state.presence, 0, 'travel is fully released when it ends'); break; }
  }
  assert.equal(peak, 1, 'travel comes to a full stop while it is read');
  assert.equal(rationaleAt(2).presence, 1);
  assert.equal(rationaleAt(99).done, true);
  // Reduced motion keeps the same hold, without the fade.
  assert.equal(rationaleAt(0, true).presence, 1);
  assert.equal(rationaleAt(0, true).done, false);
  assert.equal(rationaleAt(99, true).done, true);
});

test('each statement waits for the selection, types at the slides’ pace, and holds to be read', () => {
  const line = 'John Doe wants to learn Limits.';
  assert.equal(narrationAt(0, line.length).characters, 0);
  assert.equal(narrationAt(NARRATION_LEAD - .01, line.length).characters, 0, 'nothing is said until the system has settled on the topic');
  let shown = 0;
  for (let time = 0; time < 12; time += .01) {
    const state = narrationAt(time, line.length);
    assert.ok(state.characters === shown || state.characters === shown + 1, 'one character at a time');
    shown = state.characters;
    if (!state.typed) assert.equal(state.done, false, 'never released mid-sentence');
    assert.ok(state.weight >= 0 && state.weight < 1, 'travel is stilled, never frozen');
    if (state.done) break;
  }
  const typedAt = NARRATION_LEAD + line.length * TYPE_INTERVAL;
  assert.equal(narrationAt(typedAt + NARRATION_HOLD - .02, line.length).done, false);
  assert.equal(narrationAt(typedAt + NARRATION_HOLD, line.length).done, true);
  assert.ok(NARRATION_HOLD >= STATEMENT_HOLD, 'held at least as long as every earlier stage');
  // Reduced motion shows the whole sentence at once and still leaves it up.
  assert.equal(narrationAt(0, line.length, true).characters, line.length);
  assert.equal(narrationAt(1, line.length, true).done, false);
  assert.equal(narrationAt(2.2, line.length, true).done, true);
});

test('statements sit beside the space, away from what they explain', () => {
  for (const [width, height] of [[1440, 900], [2560, 1080], [1024, 768]]) {
    for (const x of [width * .3, width * .7]) {
      const anchor = { x, y: height * .45 };
      const place = narrationPlacement({ anchor, width, height, textHeight: 160 });
      assert.equal(place.side, x > width / 2 ? 'left' : 'right');
      assert.ok(place.x >= 0 && place.x + place.width <= width, 'inside the viewport');
      assert.ok(place.x + place.width < x - 40 || place.x > x + 40, 'clear of the anchor it explains');
      assert.ok(Math.abs(place.y + 80 - anchor.y) < 1, 'level with a topic');
      const below = narrationPlacement({ anchor, width, height, textHeight: 160, composition: 'below' });
      assert.ok(below.y >= anchor.y + 56 || below.y === height - 160 - 88, 'under a cluster of knowledge concepts');
      assert.equal(narrationPlacement({ anchor, width, height, textHeight: 160, side: 'right' }).side, 'right', 'a chosen side is kept');
    }
  }
  const narrow = narrationPlacement({ anchor: { x: 200, y: 400 }, width: 390, height: 844, textHeight: 120 });
  assert.equal(narrow.side, 'bottom');
  assert.equal(narrow.width, 390 - 44);
  assert.ok(narrow.y + 120 <= 844 - 88);
});

test('a system selection grows the concept’s own marker and quiets its small note', () => {
  const concept = { id: 'calculus-2', importance: .8, prerequisites: [] };
  const focus = { weight: key => (key === '0:calculus-2' ? 1 : 0), strength: 1, relevance: () => 1, emphasis: null };
  assert.equal(focusAppearance(focus, concept, 0).emphasis, 0, 'a pointer hover is unchanged');
  focus.emphasis = '0:calculus-2';
  assert.equal(focusAppearance(focus, concept, 0).emphasis, 1);
  assert.equal(focusAppearance(focus, concept, 1).emphasis, 0, 'only the selected placement');
});

test('knowledge concepts rise out of the entered topic and then let go', () => {
  assert.equal(emergenceAt(0, 100).relationships, 0);
  let radius = 0;
  for (let time = 0; time <= EMERGENCE_DURATION; time += .05) {
    const state = emergenceAt(time, 100);
    assert.ok(state.radius >= radius, 'outward only');
    radius = state.radius;
  }
  assert.equal(emergenceAt(EMERGENCE_DURATION, 100).done, true);
  assert.ok(emergenceAt(EMERGENCE_DURATION, 100).radius >= 100);
  assert.equal(emergenceAt(0, 100, true).done, true, 'reduced motion shows them at once');
});

// A minimal typography host, as in the layer integration test: real geometry,
// cameras, focus, labels and layer lifecycle run; WebGL appearance does not.
function element(tag) {
  return {
    tag, children: [], dataset: {}, style: { setProperty(name, value) { this[name] = value; } },
    append(...items) { for (const item of items) { item.owner = this; this.children.push(item); } },
    remove() { if (this.owner) this.owner.children.splice(this.owner.children.indexOf(this), 1); },
    getContext() { return { font: '', measureText: text => ({ width: text.length * 11 }) }; },
  };
}

test('the scripted hover, entry and reveal land on the route the engine produced, in its own timing', async () => {
  const previous = globalThis.document; globalThis.document = { createElement: element };
  const host = element('div'), renderer = { render() {} }, dt = 1 / 60;
  try {
    const { map } = await buildJourney({ userGoal: 'Learn calculus from the beginning', userBackground: 'I know algebra' });
    applyPersonalNotes(map);
    const root = createLayer(map, host); root.resize(1440, 900);
    const history = new ExplorationHistory(root);
    // The existing construction choreography brings travel in; the script may
    // only begin once that has handed the viewer the journey.
    const center = root.arc.stationAtDistance(root.journey.distance) + 16;
    let pose;
    for (let time = 0; time < DISCOVERY_DURATION; time += dt) {
      const state = constructionAt(time);
      root.formation = { center, radius: state.path * 700, ribbon: state.handoff, labels: state.labels, relationships: state.relationships };
      pose = root.advance(dt * state.travel, false); root.render(pose, dt, 1440, 900, renderer);
    }
    root.formation = null;
    const target = firstConcept(map);
    assert.equal(map.children.find(node => node.id === target).title, 'Limits');
    for (let time = 0; time < HOVER_DELAY; time += dt) { pose = root.advance(dt, false); root.render(pose, dt, 1440, 900, renderer); }
    assert.ok(root.journey.speed > .3, 'the camera is already travelling along the path when the system hovers');
    const candidate = root.landmarks.candidates.find(item => item.concept.id === target && hoverable(item));
    assert.ok(candidate, 'the first concept on the route is legible and within the pointer’s own hit window');
    assert.equal(candidate.concept.annotation.detail, 'John Doe wants to learn Limits.');
    assert.ok(candidate.label.x > 1440 * .2 && candidate.label.x < 1440 * .8, 'it sits ahead in the frame, not at an edge');
    // The selection is the existing hover plus the system's emphasis: the focus
    // spring brightens and slows, and the statement's weight settles travel so
    // the topic stays in frame for as long as it is being explained.
    const annotation = root.landmarks.candidates.find(item => item.key === candidate.key);
    root.focus.emphasis = candidate.key;
    const line = personalNotes(map).get(target);
    const hovered = candidate.label.x;
    for (let time = 0; !narrationAt(time, line.length).done; time += dt) {
      const held = root.landmarks.candidates.find(item => item.key === candidate.key);
      assert.ok(hoverable(held), `the topic stays legible while it is explained (${time.toFixed(2)}s)`);
      root.learningWeight = narrationAt(time, line.length).weight;
      root.focus.update(held, dt); pose = root.advance(dt, false); root.render(pose, dt, 1440, 900, renderer);
      if (time > NARRATION_LEAD) assert.ok(root.focus.weight(candidate.key) > .9, 'selected before a word appears');
    }
    const settled = root.landmarks.candidates.find(item => item.key === candidate.key);
    assert.ok(Math.abs(settled.label.x - hovered) < 1440 * .25, 'the camera settled on it rather than passing it');
    assert.ok(root.focus.speedScale < .8, 'travel eases while the system reads');

    assert.equal(annotation.concept.id, target);
    const held = root.landmarks.candidates.find(item => item.key === candidate.key);
    assert.ok(hoverable(held), 'still legible at the moment of the simulated click');
    assert.equal(history.canEnter(held.concept), true, 'the click can open it: the topic has knowledge concepts');

    // The simulated click is the existing entry: a child layer at the concept,
    // reached by the existing camera passage. Its knowledge concepts are the
    // authored ones, and every one of them is legible before the reason appears.
    const child = createLayer(held.concept, host, 1); child.resize(1440, 900);
    const placement = frameAtConcept(root.frame, locateConcept(held.concept, held.cycle, root.arc), pose, child.rigCamera);
    child.frame = placement.frame; child.portal = placement.portal;
    const to = worldPose(child.rigCamera, child.frame);
    const passage = new CameraPassage({ from: pose, to, portal: child.portal, speed: root.journey.speed, arrivalSpeed: 2.4 * child.frame.scale });
    assert.ok(passage.duration >= 3.6 && passage.duration <= 10, 'the dive is the passage’s own bounded duration');
    assert.deepEqual(child.definition.children.map(node => node.title), ['Approaching a Value', 'One-Sided Limits', 'Continuity']);
    // They rise out of the topic along its own path while the camera arrives,
    // and are all up, the formation released, before the reason is stated.
    const origin = child.arc.stationAtDistance(child.journey.distance);
    const last = Math.max(...child.definition.children.map(node => node.at));
    const span = child.arc.stationAtDistance(last * child.arc.length) - origin + 24;
    child.presence = 1; child.journey.time = 5; child.journey.speed = 2.4;
    let arrived = to, seen = 0;
    for (let time = 0; time < EMERGENCE_DURATION; time += dt) {
      const state = emergenceAt(time, span);
      child.formation = { center: origin, radius: state.radius, labels: state.labels, relationships: state.relationships, ribbon: state.ribbon };
      child.render(arrived, dt, 1440, 900, renderer);
      const count = child.landmarks.candidates.filter(item => item.labelOpacity > .05).length;
      assert.ok(count >= seen - 0, 'once risen, a knowledge concept stays');
      if (time < .1) assert.equal(count, 0, 'nothing is there before it emerges');
      seen = Math.max(seen, count);
    }
    child.formation = null;
    for (let time = 0; time < REVEAL_DELAY; time += dt) { arrived = child.advance(dt, false); child.render(arrived, dt, 1440, 900, renderer); }
    const legible = child.landmarks.candidates.filter(item => item.depth > 6 && item.labelOpacity > .05);
    for (const node of child.definition.children) assert.ok(legible.some(item => item.concept.id === node.id), `${node.title} is visible when the reason appears`);
    const anchor = legible.find(item => item.concept.id === firstConcept(child.definition));
    assert.equal(anchor.concept.title, 'Approaching a Value', 'the route’s first knowledge concept is among them');
    const left = Math.min(...legible.map(item => item.label.x)), right = Math.max(...legible.map(item => item.label.x + item.label.width));
    const bottom = Math.max(...legible.map(item => item.label.y + item.label.height));
    const place = narrationPlacement({ anchor: { x: (left + right) / 2, y: bottom }, width: 1440, height: 900, textHeight: 170, composition: 'below' });
    assert.ok(place.y + 170 <= 900 - 88, 'the reason fits on screen beneath them');
    // The reason stills the child's travel through the layer's existing weight
    // and the journey's own speed spring, well inside the reason's 3.4s hold.
    child.learningWeight = 1;
    const cruising = child.journey.speed;
    for (let index = 0; index < 180; index++) child.advance(dt, false);
    assert.ok(child.journey.speed < cruising * .12, `travel comes to rest while the reason is read (${child.journey.speed.toFixed(2)} of ${cruising.toFixed(2)})`);
    child.learningWeight = 0;
    child.dispose(); root.dispose();
  } finally { globalThis.document = previous; }
});
