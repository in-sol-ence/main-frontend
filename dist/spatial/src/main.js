import * as THREE from '../vendor/three.module.min.js';
import { createAtmosphere } from './world.js';
import { createLayer } from './layer.js';
import { buildJourney } from './journey-provider.js';
import { indexKnowledge } from './knowledge-model.js';
import { isKnown } from './adaptation.js';
import { constructionAt, resetAt, examples } from './entry.js';
import { pointAt } from './trajectory.js';
import { annotations } from './annotations.js';
import { locateConcept } from './landmark-layout.js';
import { CameraPassage, ExplorationHistory, frameAtConcept, layerReveal, worldPose } from './exploration.js';
import { smootherstep, wheelPixels, Journey } from './motion.js';
import { createLearning } from './learning.js';
import { createKnowledgeField, openingPose, discoveryPose } from './knowledge-field.js';
import { createAdaptiveSession, emphasizeIntervention, navigationStep } from './adaptive-engine.js';
import { createRouteSpace, cameraBlend } from './route-space.js';
import { createLearningStory, STORY_DURATION, STORY_RATE } from './route-plan.js';
import { createLanding } from './landing.js';
import { createResourceBranches } from './resource-branches.js';
import { resourceLibrary } from './resource-library.js';
import { openDuration } from './resource-placement.js';
import { tintFor } from './hierarchy.js';
import { readHandoff, statementAt, personalNotes, applyPersonalNotes, firstConcept, hoverable, rationaleAt, rationaleRise, narrationAt, emergenceAt, narrationPlacement, MESSAGE, TYPE_INTERVAL, HOVER_DELAY, REVEAL_DELAY, RESOURCE_LEAD, RESOURCE_READ, PASS_HOLD, PASS_DEPTH, finaleReached, vanishingPoint } from './handoff.js';

const canvas = document.querySelector('#world');
const failure = document.querySelector('#failure');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const labelHost = document.querySelector('#landmarks');
const resourceHost = document.querySelector('#resource-branches');
const accessibleJourney = document.querySelector('#journey-concepts');
const context = document.querySelector('#spatial-context');
const ancestry = document.querySelector('#ancestry');
const back = document.querySelector('#return-parent');
const main = document.querySelector('main');
const entrySpace = document.querySelector('#entry-space');
const form = document.querySelector('#goal-form');
const goalInput = document.querySelector('#learning-goal');
const backgroundInput = document.querySelector('#learner-background');
const identity = document.querySelector('#journey-identity');
const newJourney = document.querySelector('#new-journey');
const seed = document.querySelector('#journey-seed');
const status = document.querySelector('#journey-status');
const entryError = document.querySelector('#entry-error');
const knowledgeAction = document.querySelector('#knowledge-action');
const understanding = document.querySelector('#concept-understanding');
const reopenUnderstanding = document.querySelector('#reopen-understanding');
const restartCheck = document.querySelector('#restart-check');
const adaptiveCue = document.querySelector('#adaptive-cue');
const routePerspective = document.querySelector('#route-perspective');
const routeHeading = document.querySelector('#route-heading');
const routeDetail = document.querySelector('#route-detail');
const comparisonPause = document.querySelector('#comparison-pause');
const resumeFlow = document.querySelector('#resume-flow');
const landingSpace = document.querySelector('#landing-space');
const enterSkatebored = document.querySelector('#enter-skatebored');
const statement = document.querySelector('#handoff-statement');
const narration = document.querySelector('#narration');
const narrationEyebrow = narration.querySelector('.narration-eyebrow');
const narrationTyped = narration.querySelector('.narration-typed');
const narrationRest = narration.querySelector('.narration-rest');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  failure.hidden = false;
  console.error('Unable to initialize the spatial renderer.', error);
}

if (renderer) {
  renderer.autoClear = false;
  renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
  const atmosphere = createAtmosphere();
  const knowledgeField = createKnowledgeField();
  const landing = createLanding();
  let landingState=landing.update(0,innerWidth,innerHeight,preference.matches);
  const routeSpace = createRouteSpace(document.querySelector('#route-landmarks'));
  let comparison = null, pendingStory = null;
  const emptyDefinition = { id: 'empty-space', title: 'What do you want to learn?', startDistance: 39, children: [], pathways: [] };
  let history = new ExplorationHistory(createLayer(emptyDefinition, labelHost));
  let phase = 'landing', phaseTime = 0, generation = 0, exampleTime = 0, exampleIndex = 0;
  let constructionCenter = 0, exitPresences = [];
  let currentRequest = null, adapting = false, actionHit = null, actionHeld = false, keyboardHit = null;
  let adaptiveSession = null, adaptiveNavigation = null;
  let initialMap = null, trialStartId = null, pendingAction = null;
  const seedPosition = new THREE.Vector3();
  let pose = landingState.pose;
  let discoveryStart = null, entryState = null;
  const handoff = readHandoff(location.search);
  let handoffTime = null, handoffSubmitted = false, selected = null, demonstration = null;
  let told = null, emerging = null, narrationSpace = null;
  const resources = createResourceBranches({ host: resourceHost });

  // A knowledge concept with authored resources grows them in place. Only
  // concepts that cannot be entered qualify, so no existing descent changes.
  function activateResources(hit) {
    const list = hit && resourceLibrary[hit.concept.id];
    if (!list?.length || hit.concept.children?.length || hit.concept.explanation) return false;
    if (resources.key === hit.key) { resources.close(); return true; }
    resources.open({ layer: history.active, key: hit.key, concept: hit.concept, anchor: hit.anchor, depth: hit.depth,
      resources: list, tint: `#${tintFor(hit.concept).getHexString()}`, width: innerWidth, height: innerHeight,
      onStatus: text => { status.textContent = text; } });
    return true;
  }
  let pointer = null, transition = null, returnTarget = null;
  let paused = preference.matches, lost = false, previousTime = 0;
  let sceneFocus = 0;
  let drift = Math.sin(history.active.arc.stationAtDistance(history.active.journey.distance) / 65);
  const learning = createLearning({ section: understanding, reopen: reopenUnderstanding,
    labelsHost: document.querySelector('#understanding-labels'),
    onContinue() {
      if (history.busy) return;
      pendingAction = null;
      const action = learning.action;
      if (action && ['PREREQUISITE', 'ADVANCE'].includes(action.type)) {
        adaptiveNavigation = action; learning.close(); driveAdaptiveNavigation();
      } else if (action && !action.exhausted) presentAdaptive(adaptiveSession.continue(history.active.definition.id));
      else if (!action && adaptiveSession?.hasChecks(history.active.definition.id)) presentAdaptive(adaptiveSession.start(history.active.definition.id));
      else exploreFreely();
    },
    onUnderstand() {
      const action = adaptiveSession?.selfReport(history.active.definition.id);
      if (action) presentAdaptive(action);
      else changeKnowledge(history.active.definition, 'known', true);
    },
    onResponse: respondToCheck,
    onExplore: exploreFreely,
  });
  function routeVisible(visible) {
    main.dataset.routeView = String(visible); routePerspective.hidden = !visible;
    if(!visible)main.dataset.storyFinal='false';
    understanding.inert = visible || !learning.open;
  }
  function prepareStoryLanding(targetId) {
    const chain=[]; let node=adaptiveSession.graph.get(targetId);
    while(node?.parent) { chain.unshift(node.id); node=adaptiveSession.graph.get(node.parent); }
    for (const id of chain) {
      const parent=history.active, concept=parent.definition.children.find(item=>item.id===id);
      const from=worldPose(parent.rigCamera,parent.frame), location=locateConcept(concept,0,parent.arc);
      const child=createLayer(concept,labelHost,history.layers.length);
      child.resize(innerWidth,innerHeight);
      const placement=frameAtConcept(parent.frame,location,from,child.rigCamera);
      child.frame=placement.frame;child.portal=placement.portal;child.returnPose=from;
      history.push(child);
    }
    for(const layer of history.layers){layer.presence=0;layer.formation=null;}
    return worldPose(history.active.rigCamera,history.active.frame);
  }
  function enterLandscape(targetId) {
    if(!comparison || comparison.entry || !adaptiveSession.graph.has(targetId))return;
    const from={position:pose.position.clone(),quaternion:pose.quaternion.clone()};
    const to=prepareStoryLanding(targetId);
    comparison.entry={from,to,elapsed:0,targetId};
    comparison.paused=true;pointer=null;keyboardHit=null;routeSpace.focus(null);
    history.busy=true;newJourney.disabled=true;
  }
  function beginStory(map, departure) {
    const model=createLearningStory(map),initialTime=preference.matches?4.8:0;
    const navigation=new Journey({startDistance:initialTime,cruiseSpeed:STORY_RATE,speedAt:()=>routeSpace.focused?.18:1});
    navigation.time=5;navigation.speed=STORY_RATE;
    comparison={model,navigation,time:initialTime,paused:preference.matches,state:model.at(initialTime),entry:null,caption:''};
    routeSpace.reset(map,departure,innerWidth,innerHeight);
    history.active.presence=0;history.active.formation=null;
    pose=departure;routeVisible(true);setPhase('journey');
    identity.hidden=false;identity.style.opacity='1';
    document.querySelector('#journey-note').textContent='One knowledge space · a different next step for each learner';
    newJourney.hidden=false;comparisonPause.textContent=comparison.paused?'Resume flow':'Pause';
    updateContext();updateComparison(0);
  }
  function updateComparison(dt) {
    const story=comparison;
    if(!story.entry) {
      story.navigation.update(dt,story.paused);
      story.navigation.distance=Math.min(STORY_DURATION,story.navigation.distance);
      story.time=story.navigation.distance;
    }
    story.state=story.model.at(story.time);
    const state=story.state;
    if(story.caption!==state.heading) {
      story.caption=state.heading;
      document.querySelector('#route-eyebrow').textContent=state.eyebrow;
      routeHeading.textContent=state.heading;routeDetail.textContent=state.detail;
      status.textContent=[state.heading,state.detail].filter(Boolean).join(' ');
      canvas.setAttribute('aria-label',status.textContent);
    }
    form.style.opacity='0';entrySpace.hidden=true;
    routePerspective.style.opacity=String(smootherstep(story.time/1.5));
    main.dataset.storyFinal=String(state.done);
    document.querySelector('#route-copy').style.opacity=String(state.captionOpacity);
    let externalPose=null,presence=0;
    if(story.entry) {
      story.entry.elapsed+=dt;
      presence=smootherstep(story.entry.elapsed/(preference.matches?1:3.8));
      externalPose=cameraBlend(story.entry.from,story.entry.to,story.entry.elapsed/(preference.matches?1:3.8));
      document.querySelector('#route-copy').style.opacity=String(1-presence);
      comparisonPause.hidden=true;
    } else {
      comparisonPause.hidden=false;
      if(state.done) {story.paused=true;comparisonPause.textContent='Explore the map ↗';}
      else if(story.paused)comparisonPause.textContent='Resume flow';
    }
    routeSpace.focus(keyboardHit || routeSpace.pick(pointer,innerWidth,innerHeight));
    routeSpace.update(dt,{...state,exit:1-presence},innerWidth,innerHeight,externalPose,preference.matches);
    pose=routeSpace.pose;
    canvas.style.cursor=routeSpace.focused?'pointer':'';
    history.layers.forEach((layer,index)=>{layer.presence=(story.entry?presence:1-smootherstep(story.time/4))*(index===history.layers.length-1?1:Math.max(.035,.14**(history.layers.length-1-index)));});
    if(story.entry&&presence===1) {
      comparison=null;routeVisible(false);history.busy=false;paused=preference.matches;newJourney.disabled=false;
      main.dataset.storyFinal='false';
      document.querySelector('#journey-note').textContent='Your responses determine the next useful step';
      canvas.focus({preventScroll:true});
      if(history.active.definition.id!==history.layers[0].definition.id)openUnderstanding();
      updateContext();
    }
  }
  comparisonPause.addEventListener('click',()=>{
    if(!comparison || comparison.entry)return;
    if(comparison.state.done){enterLandscape(history.layers[0].definition.id);return;}
    comparison.paused=!comparison.paused;
    if(!comparison.paused)comparison.navigation.resume();
    comparisonPause.textContent=comparison.paused?'Resume flow':'Pause';
  });
  function exploreFreely() {
    if (history.busy) return;
    pendingAction = null; adaptiveCue.hidden = true;
    adaptiveNavigation = null; adaptiveSession?.cancel();
    learning.close(); canvas.focus({ preventScroll: true });
    if (!history.active.definition.children.length) requestReturn();
  }
  function presentAdaptive(action, feedback = '') {
    if (!action || !adaptiveSession) return;
    pendingAction = null;
    learning.presentAction(action, { question: adaptiveSession.question(action), feedback,
      targetTitle: adaptiveSession.graph.get(action.targetId)?.title || '' });
    status.textContent = `${action.reason} ${feedback}`.trim() || 'A short knowledge check is ready.';
    if (['QUESTION', 'PRACTICE'].includes(action.type)) {
      trialStartId ??= action.kcId;
      adaptiveCue.hidden = true;
    } else if (!action.exhausted && ['EXPLANATION', 'EXAMPLE'].includes(action.type) &&
      (adaptiveSession.hasChecks(action.kcId) || action.detour)) {
      // Visible reading time, then actually deliver the next practice action.
      pendingAction = { action, kind: 'practice', remaining: 9 };
    }
    render(0);
  }
  async function respondToCheck(actionId, choiceId) {
    if (history.busy || phase !== 'journey' || !adaptiveSession) return;
    const outcome = adaptiveSession.respond(actionId, choiceId);
    if (!outcome) return;
    presentAdaptive(outcome.action, outcome.feedback);
    adaptiveCue.textContent = outcome.action.type === 'ADVANCE' ? 'Ready to move forward'
      : outcome.action.type === 'PREREQUISITE' ? 'Strengthening a prerequisite' : 'Reinforcing this idea';
    adaptiveCue.hidden = false;
    if (['PREREQUISITE', 'ADVANCE'].includes(outcome.action.type)) pendingAction = { action: outcome.action, kind: 'travel', remaining: 1.2 };
    const token = ++generation;
    history.busy = true; learning.busy(true); newJourney.disabled = true;
    pointer = null; keyboardHit = null; history.active.focus.reset(); updateContext();
    try {
      const result = await buildJourney({ ...currentRequest, overrides: { ...currentRequest.overrides, ...adaptiveSession.overrides() }, evidence: adaptiveSession.evidence() });
      if (generation !== token) return;
      const map = emphasizeIntervention(result.map, adaptiveSession, outcome.action), nodes = indexKnowledge(map);
      for (const layer of history.layers) layer.retarget(nodes.get(layer.definition.id), { active: layer === history.active, anchorId: outcome.action.targetId });
      currentRequest = result.request; adapting = true;
      document.querySelector('#journey-note').textContent = outcome.action.type === 'PREREQUISITE'
        ? `Revisiting ${nodes.get(outcome.action.targetId).title} · your goal stays the same`
        : 'Your responses are shaping this journey';
    } catch (error) {
      console.error('Unable to apply learning evidence to the route.', error);
      history.busy = false; learning.busy(false); newJourney.disabled = false; updateContext();
      pendingAction = null;
      status.textContent = 'Your response is retained. The spatial route is unchanged; you can still explore freely.';
    }
  }
  function driveAdaptiveNavigation() {
    if (!adaptiveNavigation || !adaptiveSession || history.busy || phase !== 'journey') return;
    const step = navigationStep(adaptiveSession.graph, history.layers.map(layer => layer.definition.id), adaptiveNavigation.targetId);
    if (step.type === 'return') { requestReturn(step.depth); return; }
    if (step.type === 'enter') {
      const parent = history.active, concept = parent.definition.children.find(node => node.id === step.id);
      const cycle = Math.floor(parent.journey.distance / parent.arc.length);
      const location = locateConcept(concept, cycle, parent.arc);
      requestEnter({ key: `${cycle}:${concept.id}`, concept, cycle, anchor: location.anchor, foot: location.foot }); return;
    }
    const completed = adaptiveNavigation; adaptiveNavigation = null;
    openUnderstanding(false); presentAdaptive(adaptiveSession.arrive(completed));
  }
  function openUnderstanding(checkOnEntry = true) {
    if (phase !== 'journey' || history.busy || lost) return;
    pointer = null; keyboardHit = null; actionHeld = false; history.active.focus.reset();
    if (learning.show(history.active, currentRequest, innerWidth, innerHeight)) {
      learning.offerCheck(adaptiveSession?.hasChecks(history.active.definition.id));
      status.textContent = `Understanding ${history.active.definition.title}. ${history.active.definition.children.length ? 'The deeper concepts remain available.' : 'Return to the surrounding journey whenever you are ready.'}`;
      render(0);
      if (checkOnEntry && adaptiveSession?.hasChecks(history.active.definition.id)) presentAdaptive(adaptiveSession.start(history.active.definition.id));
    }
  }
  reopenUnderstanding.addEventListener('click', () => {
    if (history.active.definition.id === 'rl-journey' && adaptiveSession?.hasChecks('vectors')) {
      adaptiveNavigation = adaptiveSession.start('vectors'); driveAdaptiveNavigation();
    } else openUnderstanding();
  });

  function setPhase(next) {
    phase = next; phaseTime = 0; main.dataset.phase = next; canvas.dataset.phase = next;
    if(next!=='landing')canvas.setAttribute('aria-describedby','motion-help journey-concepts');
    entrySpace.inert = next !== 'prompt';
    canvas.tabIndex = next === 'journey' ? 0 : -1;
    canvas.setAttribute('aria-hidden', next === 'prompt' || next === 'preparing' ? 'true' : 'false');
    if (next === 'prompt') { knowledgeField.release(); knowledgeField.promptBounds(form.getBoundingClientRect(), innerWidth, innerHeight); }
  }

  // The embedding page that hands us a goal skips the front door entirely and
  // arrives already standing in the space, at the existing opening pose.
  function enterFromHandoff() {
    landingSpace.hidden = true;
    landing.dispose();
    statement.textContent = '';
    statement.hidden = !handoff.statement;
    form.dataset.handoff = 'true';
    entrySpace.hidden = false;
    form.style.opacity = '1';
    pose = openingPose();
    setPhase('prompt');
    phaseTime = 2;
    canvas.setAttribute('aria-label', `Skatebored knowledge space. ${handoff.statement}`);
    status.textContent = handoff.statement;
  }

  function beginHandoff() {
    if (handoffTime === null) handoffTime = 0;
  }

  // The statement types, holds, then submits the goal through the existing form path.
  function advanceHandoff(dt) {
    if (handoffTime === null || handoffSubmitted) return;
    handoffTime += dt;
    const state = statementAt(handoffTime, handoff.statement.length, preference.matches);
    const shown = handoff.statement.slice(0, state.characters);
    if (statement.textContent !== shown) statement.textContent = shown;
    if (!state.submit) return;
    handoffSubmitted = true;
    goalInput.value = handoff.goal;
    backgroundInput.value = handoff.background;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  function skipTyping() {
    if (handoffTime !== null && !handoffSubmitted && statement.textContent !== handoff.statement) {
      handoffTime = Math.max(handoffTime, handoff.statement.length * TYPE_INTERVAL);
      statement.textContent = handoff.statement;
      return true;
    }
    if (told && !told.fading && told.shown < told.text.length) {
      told.skip = true;
      showTold(told.text.length);
      return true;
    }
    return false;
  }

  window.addEventListener('click', event => {
    if (event.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]')) return;
    if (skipTyping()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('keydown', event => {
    if (event.code !== 'Space' || event.repeat || event.metaKey || event.ctrlKey || event.altKey ||
        event.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]')) return;
    if (skipTyping()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);

  // The storytelling layer. One statement at a time types beside the space it
  // explains; the untyped remainder is laid out invisibly so the lines wrap
  // where they will end and nothing reflows as it types. Assistive technology
  // hears the whole sentence once, through the journey's status.
  function tell(text, eyebrow, composition) {
    told = { text, composition, side: null, shown: -1, x: null, y: null, fading: 0 };
    narrationEyebrow.textContent = eyebrow;
    narration.hidden = false; narration.style.opacity = '1';
    showTold(0);
    status.textContent = text;
  }

  function showTold(characters) {
    if (told.shown === characters) return;
    told.shown = characters;
    narrationTyped.textContent = told.text.slice(0, characters);
    narrationRest.textContent = told.text.slice(characters);
  }

  // Positioned from the anchor it explains, on the side away from it, and
  // eased there so a moving camera never drags the sentence around.
  function placeTold(anchor, dt, presence = 1) {
    const layout = { anchor, width: innerWidth, height: innerHeight, composition: told.composition, side: told.side };
    const guess = narrationPlacement({ ...layout, textHeight: 0 });
    if (narration.style.width !== `${guess.width}px`) narration.style.width = `${guess.width}px`;
    const place = narrationPlacement({ ...layout, side: guess.side, textHeight: narration.offsetHeight });
    told.side = place.side;
    const ease = told.x === null || preference.matches ? 1 : 1 - Math.exp(-3.5 * dt);
    told.x = told.x === null ? place.x : told.x + (place.x - told.x) * ease;
    told.y = told.y === null ? place.y : told.y + (place.y - told.y) * ease;
    narration.style.transform = `translate(${told.x.toFixed(1)}px, ${told.y.toFixed(1)}px)`;
    narration.style.opacity = presence.toFixed(3);
    narrationSpace = { x: told.x, y: told.y, width: place.width, height: narration.offsetHeight, presence };
  }

  // A statement leaves by fading while the space carries on, including through
  // a camera passage, where the demonstration itself is not running.
  function releaseTold(immediately = preference.matches) {
    if (!told) return;
    if (immediately) { told = null; narration.hidden = true; narration.style.opacity = '0'; narrationSpace = null; return; }
    told.fading = told.fading || 1e-6;
  }

  function fadeTold(dt) {
    if (!told?.fading) return;
    told.fading += dt;
    const presence = 1 - smootherstep(told.fading / .7);
    narration.style.opacity = presence.toFixed(3);
    if (narrationSpace) narrationSpace.presence = presence;
    if (presence <= 0) releaseTold(true);
  }

  // The entered topic's knowledge concepts rise out of it along its own path,
  // through the layer's existing construction formation, which then lets go.
  function emerge(dt) {
    if (!emerging) return;
    if (!history.layers.includes(emerging.layer) && transition?.child !== emerging.layer) { emerging = null; return; }
    // They begin once the topic's own space is actually coming into view.
    if (emerging.layer.presence > .05 || emerging.elapsed > 0) emerging.elapsed += dt;
    const state = emergenceAt(emerging.elapsed, emerging.span, preference.matches);
    emerging.layer.formation = { center: emerging.center, radius: state.radius, labels: state.labels, relationships: state.relationships, ribbon: state.ribbon };
    if (state.done) { emerging.layer.formation = null; emerging = null; }
  }

  // Selecting a concept holds the journey still at it, states why the route
  // chose it, and then releases. No layer is entered and no panel is opened.
  function selectConcept(hit) {
    if (!hit || selected?.key === hit.key) return;
    // Moving to another concept keeps the journey held rather than letting it
    // lurch forward between one reason and the next.
    const carried = selected ? Math.min(selected.elapsed, rationaleRise(preference.matches)) : 0;
    selected = { key: hit.key, elapsed: carried };
    tell(handoff.rationale, hit.concept.title, 'beside');
    showTold(handoff.rationale.length);
    status.textContent = `${hit.concept.title}. ${handoff.rationale}`;
  }

  function releaseConcept() {
    selected = null;
    releaseTold(true);
    history.active.learningWeight = 0;
  }

  function advanceSelection(dt, active, hit) {
    selected.elapsed += dt;
    const state = rationaleAt(selected.elapsed, preference.matches);
    // The existing speed law already stills travel for in-space reading.
    active.learningWeight = state.presence;
    if (state.done || !hit) { releaseConcept(); return; }
    placeTold(hit.label, dt, state.presence);
  }

  // Where the legible knowledge concepts sit on screen: the middle of the
  // cluster, and the foot of its lowest label, which a statement is set beneath.
  function clusterAnchor(active) {
    const legible = active.landmarks.candidates.filter(item => item.depth > 6 && item.labelOpacity > .05);
    if (!legible.length) return null;
    const left = Math.min(...legible.map(item => item.label.x));
    const right = Math.max(...legible.map(item => item.label.x + item.label.width));
    const bottom = Math.max(...legible.map(item => item.label.y + item.label.height));
    return { x: (left + right) / 2, y: bottom };
  }

  // The scripted demonstration of a handed-in journey. Each frame in the
  // journey it returns the concept the system itself is hovering, if any; the
  // existing focus, enter and return paths do everything spatial, and the
  // storytelling layer says why. It runs between transitions, so its clock only
  // advances while the viewer is actually looking at the state it is timing.
  function demonstrate(dt, active) {
    const demo = demonstration;
    demo.elapsed += dt;
    if (demo.stage === 'approach') {
      if (demo.elapsed < HOVER_DELAY) return null;
      const candidate = active.landmarks.candidates.find(item => item.concept.id === demo.targetId && hoverable(item));
      if (!candidate) return null;
      demo.stage = 'hover'; demo.elapsed = 0; demo.key = candidate.key; demo.topic = candidate.concept.title;
      active.focus.emphasis = candidate.key;
      tell(personalNotes(active.definition, handoff.learner, handoff.topicLine).get(demo.targetId), `${active.definition.title} → ${demo.topic}`, 'beside');
    }
    if (demo.stage === 'hover') {
      const candidate = active.landmarks.candidates.find(item => item.key === demo.key);
      if (!candidate) { active.learningWeight = 0; active.focus.emphasis = null; releaseTold(); demonstration = null; return null; }
      const state = narrationAt(demo.elapsed, told.text.length, preference.matches);
      // Travel settles at the topic while the statement is read.
      active.learningWeight = state.weight;
      showTold(told.skip ? told.text.length : state.characters);
      placeTold(candidate.label, dt);
      if (state.done) {
        demo.stage = 'entering'; demo.elapsed = 0;
        releaseTold();
        requestEnter(candidate);
        if (!history.busy) { active.learningWeight = 0; demonstration = null; }
      }
      return candidate;
    }
    if (demo.stage === 'entering') {
      if (demo.elapsed < REVEAL_DELAY || emerging) return null;
      demo.stage = 'reveal'; demo.elapsed = 0; demo.anchor = null;
      tell(handoff.rationale, `${demo.topic} → ${handoff.conceptsLabel}`, 'below');
    }
    if (demo.stage === 'reveal') {
      const state = narrationAt(demo.elapsed, handoff.rationale.length, preference.matches);
      active.learningWeight = state.weight;
      showTold(told.skip ? told.text.length : state.characters);
      demo.anchor = clusterAnchor(active) || demo.anchor;
      placeTold(demo.anchor || { x: innerWidth * .5, y: innerHeight * .4 }, dt);
      if (state.done) {
        releaseTold();
        // The reason is followed by what the model serves for that concept.
        const kcId = firstConcept(active.definition);
        const list = resourceLibrary[kcId];
        const target = active.landmarks.candidates.find(item => item.concept.id === kcId && item.depth > 6);
        demo.elapsed = 0; demo.passed = new Set([kcId]); demo.passing = null;
        if (list?.length && target) {
          demo.stage = 'resources'; demo.key = target.key; demo.resources = list; demo.opened = false;
          resources.open({ layer: active, key: target.key, concept: target.concept, anchor: target.anchor, depth: target.depth,
            resources: list, tint: `#${tintFor(target.concept).getHexString()}`, width: innerWidth, height: innerHeight,
            onStatus: text => { status.textContent = text; }, hold: active.learningWeight });
        } else beginRepeats();
      }
      return null;
    }
    if (demo.stage === 'resources') {
      const target = active.landmarks.candidates.find(item => item.key === demo.key);
      const settled = openDuration(demo.resources.length, preference.matches) + RESOURCE_LEAD;
      if (!demo.opened && demo.elapsed >= settled) {
        // Its lecture segment opens in place, exactly as a click on the card would.
        const video = demo.resources.find(item => item.type === 'video') || demo.resources[0];
        resources.select(video.id);
        resourceHost.querySelector('.resource-video-load')?.click();
        demo.opened = true;
      }
      if (demo.elapsed >= settled + RESOURCE_READ) { resources.close(); beginRepeats(); }
      return target || null;
    }
    if (demo.stage === 'repeats') {
      const state = narrationAt(demo.elapsed, handoff.repeats.length, preference.matches);
      showTold(told.skip ? told.text.length : state.characters);
      // The rest of the branch goes by at the journey's own pace.
      active.learningWeight = 0;
      if (demo.passing) demo.passing.elapsed += dt;
      if (!demo.passing || demo.passing.elapsed >= PASS_HOLD) {
        const next = active.landmarks.candidates.find(item => !demo.passed.has(item.concept.id) && item.cycle === 0
          && (active.definition.route?.forward || []).includes(item.concept.id) && item.depth > 6 && item.depth < PASS_DEPTH && item.labelOpacity >= .3);
        if (next) { demo.passing = { key: next.key, elapsed: 0 }; demo.passed.add(next.concept.id); active.focus.emphasis = next.key; }
        else if (demo.passing) { demo.passing = null; active.focus.emphasis = null; }
      }
      const passing = demo.passing && active.landmarks.candidates.find(item => item.key === demo.passing.key);
      if (passing) demo.anchor = passing.label;
      placeTold(demo.anchor || { x: innerWidth * .5, y: innerHeight * .45 }, dt);
      const forward = active.definition.route?.forward || active.definition.children.map(node => node.id);
      const routeEnd = active.definition.route?.end ?? Math.max(...active.definition.children.map(node => node.at));
      if (state.typed && finaleReached({ distance: active.journey.distance, routeEnd, arcLength: active.arc.length, forward, passed: demo.passed, passing: demo.passing, elapsed: demo.elapsed })) {
        // Past the last concept the space empties; the embedding page takes over.
        releaseTold(); active.focus.emphasis = null;
        // Where the path's line converges into nothing, as a fraction of the view.
        const project = at => pointAt(active.arc.stationAtDistance(at), new THREE.Vector3()).project(active.viewCamera);
        const vanishing = vanishingPoint(project, { distance: active.journey.distance, routeEnd, arcLength: active.arc.length });
        const point = { x: clamp01(vanishing.x), y: clamp01(vanishing.y) };
        canvas.dataset.vanishing = `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
        if (parent !== window) parent.postMessage({ type: `${MESSAGE}:finale`, point }, location.origin);
        canvas.dataset.finale = 'true';
        demonstration = null;
        return null;
      }
      return passing || null;
    }
    demonstration = null;
    return null;
  }

  const clamp01 = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : .5));

  function beginRepeats() {
    const demo = demonstration;
    demo.stage = 'repeats'; demo.elapsed = 0; demo.anchor = null;
    for (const layer of history.layers) layer.learningWeight = 0;
    tell(handoff.repeats, `${demo.topic} → ${handoff.conceptsLabel}`, 'beside');
  }

  function replaceMap(definition) {
    learning.clear(); reopenUnderstanding.hidden = true;
    adaptiveNavigation = null; adaptiveSession = null;
    pendingAction = null; adaptiveCue.hidden = true;
    for (const layer of history.layers) layer.dispose();
    history = new ExplorationHistory(createLayer(definition, labelHost));
    history.active.resize(innerWidth, innerHeight);
    pose = history.active.advance(0, true);
    pointer = null; transition = null; returnTarget = null; sceneFocus = 0;
    actionHit = null; actionHeld = false; keyboardHit = null; adapting = false; knowledgeAction.hidden = true;
    canvas.style.cursor = ''; previousTime = 0;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (phase !== 'prompt' || lost || !goalInput.value.trim()) return;
    const token = ++generation;
    const departure = { position: pose.position.clone(), quaternion: pose.quaternion.clone() };
    entryError.hidden = true;
    setPhase('preparing');
    try {
      const result = await buildJourney({ userGoal: goalInput.value, userBackground: backgroundInput.value });
      if (generation !== token) return;
      if (handoff) applyPersonalNotes(result.map, handoff.learner, handoff.topicLine);
      replaceMap(result.map);
      discoveryStart = departure;
      entryState = constructionAt(0, preference.matches);
      knowledgeField.select(history.active.arc.stationAtDistance(history.active.journey.distance));
      pose = departure;
      currentRequest = result.request;
      adaptiveSession = createAdaptiveSession(result.map);
      initialMap = structuredClone(result.map); trialStartId = null;
      constructionCenter = history.active.arc.stationAtDistance(history.active.journey.distance) + 16;
      history.active.formation = { center: constructionCenter, radius: 0, labels: 0, relationships: 0 };
      document.querySelector('#journey-goal').textContent = result.request.userGoal;
      document.querySelector('#journey-note').textContent = result.note;
      document.title = `Skatebored — ${result.map.title}`;
      status.textContent = `${result.note}. ${result.map.title}.`;
      identity.hidden = false; identity.style.opacity = '0';
      paused = preference.matches;
      if (result.example === 'reinforcement') {
        // The comparison is the opening experience, not an optional feature.
        // Its sample priors are independent of the user's own background.
        const shared = await buildJourney({ userGoal: result.request.userGoal, userBackground: '' });
        if (generation !== token) return;
        pendingStory=shared.map;
      }
      setPhase('constructing'); updateContext(); render(0);
    } catch (error) {
      console.error('Unable to prepare this journey.', error);
      replaceMap(emptyDefinition);
      pose = openingPose(); discoveryStart = null; entryState = null;
      setPhase('prompt');
      entryError.textContent = 'That journey could not be opened. Your goal is still here; try again.';
      entryError.hidden = false; goalInput.focus();
    }
  });

  function resetJourney() {
    if (phase !== 'journey') return;
    comparison = null; pendingStory = null; routeVisible(false);
    learning.close(); reopenUnderstanding.hidden = true;
    adaptiveNavigation = null; adaptiveSession?.cancel();
    pendingAction = null; adaptiveCue.hidden = true; restartCheck.hidden = true;
    generation++; transition = null; returnTarget = null; pointer = null; adapting = false;
    actionHeld = false; keyboardHit = null; knowledgeAction.hidden = true;
    demonstration = null; emerging = null; releaseConcept();
    history.busy = true; canvas.style.cursor = '';
    exitPresences = history.layers.map(layer => layer.presence);
    history.layers.forEach(layer => layer.focus.reset());
    newJourney.hidden = true; setPhase('clearing');
  }
  newJourney.addEventListener('click', resetJourney);

  knowledgeAction.addEventListener('pointerenter', () => { actionHeld = true; });
  knowledgeAction.addEventListener('pointerleave', () => { actionHeld = false; });
  knowledgeAction.addEventListener('focus', () => { actionHeld = true; });
  knowledgeAction.addEventListener('blur', () => { actionHeld = false; });
  knowledgeAction.addEventListener('click', () => {
    if (!actionHit || history.busy || phase !== 'journey' || !currentRequest || lost) return;
    const concept = actionHit.concept;
    const state = isKnown(concept.learnerState) ? 'unknown' : 'known';
    adaptiveSession?.selfReport(concept.id, state === 'known');
    changeKnowledge(concept, state);
  });
  async function changeKnowledge(concept, state, understood = false) {
    if (!concept || history.busy || phase !== 'journey' || !currentRequest || lost) return;
    const request = { ...currentRequest, overrides: { ...currentRequest.overrides, [concept.id]: state } };
    const token = ++generation;
    history.busy = true; knowledgeAction.hidden = true; actionHeld = false; keyboardHit = null; pointer = null;
    newJourney.disabled = true; updateContext();
    learning.busy(true);
    try {
      const result = await buildJourney(request);
      if (token !== generation) return;
      const nodes = indexKnowledge(result.map);
      for (const layer of history.layers) layer.retarget(nodes.get(layer.definition.id), { active: layer === history.active, anchorId: concept.id });
      currentRequest = result.request; adapting = true;
      learning.close(understood);
      document.querySelector('#journey-note').textContent = result.note;
      status.textContent = `${concept.title}: ${state === 'known' ? 'known' : 'needed'}. The route is adapting.`;
      canvas.focus({ preventScroll: true });
    } catch (error) {
      console.error('Unable to adapt this journey.', error);
      history.busy = false; newJourney.disabled = false; updateContext();
      learning.busy(false);
      status.textContent = 'Your current journey is unchanged. Please try that correction again.';
    }
  }

  function updateKnowledgeAction() {
    if (handoff) { knowledgeAction.hidden = true; return; }
    const active = history.active;
    const hit = active.landmarks.candidates.find(item => item.key === active.focus.targetKey);
    if (phase !== 'journey' || history.busy || learning.visible || !hit || active.focus.weight(hit.key) < .18 || hit.labelOpacity < .12) {
      knowledgeAction.hidden = true; return;
    }
    actionHit = hit;
    const known = isKnown(hit.concept.learnerState);
    knowledgeAction.textContent = known ? 'I need this' : 'I know this';
    knowledgeAction.setAttribute('aria-label', `${known ? 'I need' : 'I know'} ${hit.concept.title}`);
    knowledgeAction.style.left = `${Math.max(16, Math.min(innerWidth - 106, hit.action.x))}px`;
    knowledgeAction.style.top = `${Math.max(80, Math.min(innerHeight - 64, hit.action.y))}px`;
    knowledgeAction.style.opacity = String(active.focus.weight(hit.key));
    knowledgeAction.hidden = false;
  }

  function updateEntry(dt) {
    phaseTime += dt;
    if(phase==='landing') {
      landingState=landing.update(dt,innerWidth,innerHeight,preference.matches);pose=landingState.pose;
      landingSpace.style.opacity=String(landingState.identity*smootherstep(phaseTime/1.5));
      entrySpace.hidden=landingState.prompt===0;entrySpace.inert=!landingState.done;
      form.style.opacity=String(landingState.prompt);
      if(!entrySpace.hidden)knowledgeField.promptBounds(form.getBoundingClientRect(),innerWidth,innerHeight);
      render(dt);
      if(landingState.done){landingSpace.hidden=true;entrySpace.hidden=false;entrySpace.inert=false;pose=openingPose();setPhase('prompt');phaseTime=2;form.style.opacity='1';canvas.setAttribute('aria-label','Skatebored knowledge space. What do you want to learn?');status.textContent='What do you want to learn?';goalInput.focus({preventScroll:true});landing.dispose();}
      return;
    }
    if (phase === 'prompt' || phase === 'preparing') {
      if (handoff) { advanceHandoff(dt); render(dt); return; }
      exampleTime += dt;
      if (exampleTime > 5 && document.activeElement !== goalInput && !goalInput.value && !preference.matches) {
        goalInput.placeholder = examples[++exampleIndex % examples.length]; exampleTime = 0;
      }
      render(dt); return;
    }
    if (phase === 'clearing') {
      const presence = resetAt(phaseTime, preference.matches);
      history.layers.forEach((layer, index) => { layer.presence = exitPresences[index] * presence; });
      identity.style.opacity = String(presence); render(dt);
      if (presence === 0) {
        replaceMap(emptyDefinition);
        pose = openingPose(); discoveryStart = null; entryState = null;
        identity.hidden = true; context.hidden = true; accessibleJourney.replaceChildren();
        entrySpace.hidden = false; form.style.opacity = '0'; form.style.transform = '';
        goalInput.value = ''; backgroundInput.value = ''; seed.style.opacity = '0';
        document.title = 'Skatebored — A journey through knowledge';
        status.textContent = 'Ready for a new learning journey.';
        setPhase('prompt'); goalInput.focus();
        form.animate([{ opacity: 0 }, { opacity: 1 }], { duration: preference.matches ? 150 : 800, fill: 'none' });
        form.style.opacity = '1';
      }
      return;
    }
    const state = constructionAt(phaseTime, preference.matches);
    entryState = state;
    const root = history.active;
    root.presence = state.arrival;
    root.formation = { center: constructionCenter, radius: state.path * 700, ribbon: state.handoff, labels: pendingStory?0:state.labels, relationships: pendingStory?0:state.relationships };
    const destination = root.advance(dt * state.travel, paused);
    pose = preference.matches ? (state.camera ? destination : discoveryStart) : discoveryPose(discoveryStart, destination, state.camera, knowledgeField.guide(state.convergence));
    pointAt(constructionCenter, seedPosition).project(root.rigCamera);
    const x = (seedPosition.x * .5 + .5) * innerWidth, y = (-seedPosition.y * .5 + .5) * innerHeight;
    seed.style.left = `${x}px`; seed.style.top = `${y}px`; seed.style.opacity = String(state.seed);
    const recession = 1 - state.prompt;
    form.style.opacity = String(state.prompt);
    form.style.transform = preference.matches ? '' : `translateY(${-18 * recession}px) scale(${1 - .025 * recession})`;
    identity.style.opacity = String(state.context);
    render(dt);
    if (state.done) {
      root.formation = null; entrySpace.hidden = true; seed.style.opacity = '0';
      if(pendingStory){const map=pendingStory;pendingStory=null;beginStory(map,pose);canvas.focus({preventScroll:true});return;}
      newJourney.hidden = false; setPhase('journey'); updateContext();
      if (handoff && firstConcept(root.definition)) demonstration = { stage: 'approach', targetId: firstConcept(root.definition), elapsed: 0 };
      status.textContent += ' Your knowledge space is ready.';
      canvas.focus({ preventScroll: true });
    }
  }

  function updateContext() {
    const active = history.active;
    context.hidden = Boolean(handoff) || phase !== 'journey' || history.layers.length === 1;
    const fullContext = history.layers.map(layer => layer.definition.title).join(' / ');
    const parentContext = document.createElement('span'); parentContext.className = 'context-parent';
    history.layers.slice(0, -1).forEach((layer, index) => {
      if (index) { const separator = document.createElement('span'); separator.textContent = '/'; separator.setAttribute('aria-hidden', 'true'); parentContext.append(separator); }
      const ancestor = document.createElement('button'); ancestor.type = 'button'; ancestor.className = 'context-ancestor';
      ancestor.textContent = layer.definition.title; ancestor.disabled = history.busy;
      ancestor.setAttribute('aria-label', `Return to ${layer.definition.title}`);
      ancestor.addEventListener('click', () => requestReturn(index)); parentContext.append(ancestor);
    });
    const currentContext = document.createElement('span'); currentContext.className = 'context-current';
    currentContext.textContent = `${history.layers.length > 1 ? '/ ' : ''}${active.definition.title}`;
    ancestry.replaceChildren(parentContext, currentContext);
    ancestry.setAttribute('aria-label', fullContext);
    back.disabled = history.busy;
    back.setAttribute('aria-label', `Return to ${history.layers.at(-2)?.definition.title || history.layers[0].definition.title}`);
    canvas.setAttribute('aria-label', `${fullContext}. A cinematic journey through spatial concept landmarks.`);
    accessibleJourney.replaceChildren();
    const lookup = new Map(active.definition.children.map(concept => [concept.id, concept]));
    for (const concept of active.definition.children) {
      const item = document.createElement('li');
      const note = concept.annotation || annotations[concept.id];
      item.textContent = `${concept.title}. ${concept.learnerState || 'unknown'}. ${note?.category || ''}. ${note?.detail || ''} ${concept.prerequisites.length ? `Supported by ${concept.prerequisites.map(id => lookup.get(id).title).join(', ')}.` : ''}`;
      accessibleJourney.append(item);
    }
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    knowledgeField.resize(innerWidth, innerHeight);
    if (!entrySpace.hidden) knowledgeField.promptBounds(form.getBoundingClientRect(), innerWidth, innerHeight);
    for (const layer of history.layers) layer.resize(innerWidth, innerHeight);
    const camera = history.active.viewCamera;
    atmosphere.material.uniforms.aspect.value = camera.aspect;
    atmosphere.material.uniforms.lens.value = Math.tan(camera.fov * Math.PI / 360);
    render(0);
  }

  function render(dt) {
    const active = history.active;
    const targetDrift = Math.sin(active.arc.stationAtDistance(active.journey.distance) / 65);
    drift += (targetDrift - drift) * (1 - Math.exp(-dt));
    sceneFocus += (active.focus.strength - sceneFocus) * (1 - Math.exp(-7 * dt));
    learning.update(dt, active, innerWidth, innerHeight, preference.matches, phase === 'journey' && !history.busy && !lost);
    atmosphere.material.uniforms.learnerFocus.value = Math.max(sceneFocus, learning.attention.presence * .8);
    atmosphere.material.uniforms.drift.value = drift;
    atmosphere.material.uniforms.eye.value.copy(pose.position);
    atmosphere.material.uniforms.viewRotation.value.setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(pose.quaternion));
    renderer.clear();
    renderer.render(atmosphere.scene, atmosphere.camera);
    renderer.clearDepth();
    if(phase==='landing') {
      knowledgeField.camera.fov=landing.camera.fov;knowledgeField.camera.updateProjectionMatrix();
      knowledgeField.update(dt,pose,{presence:landingState.field,prompt:landingState.prompt,reduced:preference.matches});
      renderer.render(knowledgeField.scene,knowledgeField.camera);
      renderer.clearDepth();
      const tone=renderer.toneMapping;renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.render(landing.scene,landing.camera);renderer.toneMapping=tone;
      canvas.dataset.motion=landingState.started?'carving':'landing';
      canvas.dataset.landingProgress=landingState.t.toFixed(3);
      return;
    }
    const opening = phase === 'prompt' || phase === 'preparing';
    const discovering = phase === 'constructing';
    const fieldState = comparison ? { prompt: 0, presence: 1, convergence: 1, selection: 1, softness: 1, handoff: 1 }
      : opening ? { prompt: 1, presence: phase === 'preparing' ? 1 : smootherstep(phaseTime / 1.8) }
      : discovering ? { ...entryState, presence: entryState.field }
      : { convergence: 1, selection: 1, softness: 1, handoff: 1, presence: history.layers[0].presence };
    knowledgeField.update(dt, pose, { ...fieldState, reduced: preference.matches });
    renderer.render(knowledgeField.scene, knowledgeField.camera);
    if (comparison) {
      renderer.clearDepth(); renderer.render(routeSpace.scene, routeSpace.camera);
    }
    if ((!comparison || comparison.entry || comparison.time<4) && phase !== 'prompt' && phase !== 'preparing') for (const layer of history.layers) layer.render(pose, dt, innerWidth, innerHeight, renderer, layer === active, learning.readingSpace || narrationSpace);
    canvas.dataset.motion = phase !== 'journey' ? phase : adapting ? 'adapting' : transition ? 'entering' : paused ? 'paused' : 'traveling';
    canvas.dataset.navigation = (comparison ? comparison.navigation.scroll.active : active.journey.scroll.active) ? 'manual' : 'flow';
    canvas.dataset.cameraProgress = String(comparison ? comparison.time : active.journey.distance);
    canvas.dataset.focus = active.focus.targetKey || '';
    canvas.dataset.layer = active.definition.id;
    canvas.dataset.depth = String(history.layers.length - 1);
    canvas.dataset.scale = active.frame.scale.toFixed(5);
    canvas.dataset.routeEnd = String(active.definition.route?.end ?? '');
    canvas.dataset.forward = (active.definition.route?.forward || []).join(',');
    canvas.dataset.foundations = (active.definition.route?.foundations || []).join(',');
    canvas.dataset.understanding = learning.visible ? learning.layer?.definition.id || '' : '';
    canvas.dataset.discovery = discovering ? String(entryState.camera.toFixed(3)) : '';
    const evidence = adaptiveSession?.state.components[active.definition.id];
    canvas.dataset.mastery = evidence ? evidence.mastery.toFixed(3) : '';
    canvas.dataset.evidenceCount = String(evidence?.attempts || 0);
    canvas.dataset.learningAction = comparison?.action?.type || learning.action?.type || '';
    canvas.dataset.adaptiveTarget = comparison?.action?.targetId || adaptiveNavigation?.targetId || learning.action?.targetId || '';
    canvas.dataset.pendingAction = pendingAction?.kind || '';
    canvas.dataset.comparison = comparison?.state.profile || '';
    canvas.dataset.comparisonStage = comparison?.state.eyebrow || '';
    canvas.dataset.storyTime = comparison ? comparison.time.toFixed(2) : '';
    canvas.dataset.demonstration = demonstration?.stage || '';
    canvas.dataset.responseCount = String(adaptiveSession?.state.responses.length || 0);
    canvas.dataset.activeStoryStops = comparison ? routeSpace.activeIds.join(',') : '';
    canvas.dataset.routeBranch = comparison?.state.branch || '';
    canvas.dataset.storyAction = comparison?.state.selectedAction || '';
    canvas.dataset.storyRouteA = comparison?.state.routeA.join(',') || '';
    canvas.dataset.storyRouteB = comparison?.state.routeB.join(',') || '';
    if (!routePerspective.hidden) understanding.inert = true;
    resumeFlow.hidden = phase !== 'journey' || Boolean(comparison) || !paused || history.busy || lost;
    restartCheck.hidden = phase !== 'journey' || !trialStartId || lost;
    reopenUnderstanding.hidden = Boolean(handoff) || phase !== 'journey' || history.busy || learning.visible || !active.definition.explanation;
    reopenUnderstanding.textContent = active.definition.id === 'rl-journey' && adaptiveSession?.hasChecks('vectors') ? 'Enter Vectors ↗' : `Understand ${active.definition.title}`;
    updateKnowledgeAction();
  }

  function requestEnter(hit) {
    if (phase !== 'journey' || !history.canEnter(hit?.concept) || lost) return;
    pendingAction = null;
    learning.close();
    history.busy = true;
    returnTarget = null;
    transition = { kind: 'hold', parent: history.active, hit, elapsed: 0 };
    pointer = null; keyboardHit = null; actionHeld = false; knowledgeAction.hidden = true; canvas.style.cursor = ''; updateContext();
  }

  function startEnter(hold) {
    const { parent, hit } = hold;
    const child = createLayer(hit.concept, labelHost, history.layers.length);
    child.resize(innerWidth, innerHeight);
    const location = locateConcept(hit.concept, hit.cycle, parent.arc);
    const placement = frameAtConcept(parent.frame, location, pose, child.rigCamera);
    child.frame = placement.frame;
    child.portal = placement.portal;
    child.returnPose = { position: pose.position.clone(), quaternion: pose.quaternion.clone() };
    const to = worldPose(child.rigCamera, child.frame);
    const passage = new CameraPassage({ from: child.returnPose, to, portal: child.portal, speed: parent.journey.speed * parent.frame.scale, arrivalSpeed: paused ? 0 : 2.4 * child.frame.scale });
    transition = { kind: 'enter', parent, child, hit, passage, elapsed: 0 };
    if (demonstration?.stage === 'entering') {
      // The span runs from where the viewer arrives to the last knowledge concept.
      const center = child.arc.stationAtDistance(child.journey.distance);
      const last = Math.max(...child.definition.children.map(node => node.at));
      emerging = { layer: child, center, span: child.arc.stationAtDistance(last * child.arc.length) - center + 24, elapsed: 0 };
      emerge(0);
    }
    history.push(child); updateContext();
  }

  function requestReturn(targetDepth = history.layers.length - 2) {
    if (phase !== 'journey' || !history.canReturn || lost) return;
    if (!Number.isInteger(targetDepth) || targetDepth < 0 || targetDepth >= history.layers.length - 1) return;
    pendingAction = null;
    learning.close();
    returnTarget = targetDepth;
    const child = history.active, parent = history.layers.at(-2);
    history.busy = true; pointer = null; keyboardHit = null; actionHeld = false; knowledgeAction.hidden = true; canvas.style.cursor = '';
    transition = {
      kind: 'return', parent, child, elapsed: 0,
      passage: new CameraPassage({ from: pose, to: child.returnPose, portal: child.portal, speed: child.journey.speed * child.frame.scale, arrivalSpeed: paused ? 0 : Math.min(parent.journey.speed, 2.4) * parent.frame.scale }),
    };
    updateContext();
  }

  function updateTransition(dt) {
    const step = transition;
    step.elapsed += dt;
    if (step.kind === 'hold') {
      step.parent.focus.update(step.hit, dt);
      pose = step.parent.advance(dt, paused);
      if (step.elapsed >= .32) startEnter(step);
      return;
    }
    const duration = preference.matches ? 1 : step.passage.duration;
    const progress = Math.min(1, step.elapsed / duration);
    for (let index = 0; index < history.layers.length - 2; index++) {
      const near = Math.max(.035, .14 ** (history.layers.length - 2 - index));
      const far = Math.max(.035, .14 ** (history.layers.length - 1 - index));
      const blend = smootherstep(step.kind === 'enter' ? progress : 1 - progress);
      history.layers[index].presence = near + (far - near) * blend;
    }
    if (preference.matches) {
      pose = progress < .5 ? step.passage.from : step.passage.to;
      const outgoing = 1 - smootherstep(progress * 2), incoming = smootherstep((progress - .5) * 2);
      step.parent.presence = step.kind === 'enter' ? outgoing + incoming * .14 : incoming;
      step.child.presence = step.kind === 'enter' ? incoming : outgoing;
    } else {
      pose = step.passage.sample(step.elapsed);
      const reveal = layerReveal(step.kind === 'enter' ? progress : 1 - progress);
      step.parent.presence = reveal.parent;
      step.child.presence = reveal.child;
    }
    step.parent.focus.update(step.kind === 'enter' && progress < .38 ? step.hit : null, dt);
    step.child.focus.update(null, dt);
    if (progress < 1) return;
    if (step.kind === 'return') {
      if (learning.layer === step.child) learning.clear();
      history.pop().dispose(); step.parent.presence = 1;
      pose = step.child.returnPose;
    } else {
      step.child.presence = 1;
      step.child.journey.time = 5; step.child.journey.speed = paused ? 0 : 2.4; step.child.journey.acceleration = 0;
      pose = step.passage.to;
    }
    step.parent.focus.reset();
    history.layers.forEach((layer, index) => { layer.presence = index === history.layers.length - 1 ? 1 : Math.max(.035, .14 ** (history.layers.length - 1 - index)); });
    history.busy = false; transition = null;
    if (returnTarget !== null && history.layers.length - 1 > returnTarget) requestReturn(returnTarget);
    else {
      returnTarget = null; updateContext();
      if (adaptiveNavigation) driveAdaptiveNavigation();
      else if (step.kind === 'enter' && !handoff) openUnderstanding();
    }
  }

  function frame(time) {
    const dt = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    if (document.hidden || lost) return;
    if (phase !== 'journey') { updateEntry(dt); return; }
    if (comparison) { updateComparison(dt); render(dt); return; }
    for (const layer of history.layers) layer.adapt(dt, preference.matches);
    if (adapting) {
      pose = history.active.advance(dt, paused); render(dt);
      if (!history.layers.some(layer => layer.reconfiguring)) {
        adapting = false; history.busy = false; newJourney.disabled = false;
        learning.refreshContext(currentRequest);
        learning.busy(false);
        status.textContent = learning.action?.reason || 'Journey adapted. Known knowledge remains as foundation.';
        updateContext();
      }
      return;
    }
    fadeTold(dt); emerge(dt);
    if (transition) { updateTransition(dt); render(dt); return; }
    if (pendingAction && !history.busy && !lost) {
      if (!learning.open || learning.action?.id !== pendingAction.action.id) pendingAction = null;
      else {
        pendingAction.remaining -= dt;
        if (pendingAction.remaining <= 0) {
          const next = pendingAction; pendingAction = null;
          if (next.kind === 'travel') {
            adaptiveNavigation = next.action; learning.close(); driveAdaptiveNavigation(); render(dt); return;
          }
          presentAdaptive(adaptiveSession.continue(next.action.kcId));
        }
      }
    }
    const active = history.active;
    const wasFocused = active.focus.strength > 0;
    if (keyboardHit) keyboardHit = active.landmarks.candidates.find(item => item.key === keyboardHit.key && item.labelOpacity > .06) || null;
    const staged = demonstration ? demonstrate(dt, active) : null;
    const held = selected ? active.landmarks.candidates.find(item => item.key === selected.key) : null;
    const pointed = held || (actionHeld ? actionHit : keyboardHit || active.pick(pointer, innerWidth, innerHeight));
    const hit = staged || pointed;
    active.focus.update(hit, dt);
    if (selected) advanceSelection(dt, active, held);
    canvas.style.cursor = pointed && (handoff || pointed.concept.children.length || pointed.concept.explanation || resourceLibrary[pointed.concept.id]) ? 'pointer' : '';
    pose = active.advance(dt, paused);
    if (!paused || active.journey.scroll.active || hit || wasFocused || selected || learning.visible || resources.layer || history.layers.some(layer => layer.settling)) render(dt);
    // Resources belong to the layer they grew in; they hold its travel for reading.
    if (resources.layer && resources.layer !== history.active) resources.dispose();
    resources.update({ dt, width: innerWidth, height: innerHeight, reduced: preference.matches });
    // The understanding panel rewrites its layer's weight each frame; defer to the larger of the two.
    if (resources.layer === active) active.learningWeight = learning.layer === active ? Math.max(active.learningWeight, resources.hold) : resources.hold;
  }
  function setPaused(next) {
    paused = next; previousTime = 0;
    if (!paused) for (const layer of history.layers) layer.journey.resume();
    render(0);
  }
  resumeFlow.addEventListener('click', () => setPaused(false));
  function enterWorld(){if(phase!=='landing'||lost)return;if(landing.start()){enterSkatebored.disabled=true;landingSpace.inert=true;status.textContent='Following a path into Skatebored.';}}
  enterSkatebored.addEventListener('click',enterWorld);
  let touchStartY=null;
  canvas.addEventListener('pointermove',event=>{if(phase==='landing')landing.pointer(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2);});
  canvas.addEventListener('pointerleave',()=>{if(phase==='landing')landing.pointer(0,0);});
  canvas.addEventListener('touchstart',event=>{if(phase==='landing')touchStartY=event.touches[0].clientY;},{passive:true});
  canvas.addEventListener('touchmove',event=>{if(phase==='landing'&&touchStartY!==null&&touchStartY-event.touches[0].clientY>18)enterWorld();},{passive:true});
  window.addEventListener('keydown',event=>{if(phase==='landing'&&!event.target.closest?.('button')&&['Space','Enter','ArrowDown','PageDown'].includes(event.code)){event.preventDefault();enterWorld();}});
  window.addEventListener('wheel', event => {
    if(phase==='landing'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();if(event.deltaY>2)enterWorld();return;}
    if (event.ctrlKey || event.metaKey || phase !== 'journey' || lost ||
      event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    const pixels = wheelPixels(event.deltaY, event.deltaMode, innerHeight);
    if (!pixels) return;
    event.preventDefault();
    if (comparison) {
      if (comparison.entry) return;
      comparison.paused = true;
      comparison.navigation.takeControl(pixels * .035,0,STORY_DURATION);
      pointer=null;keyboardHit=null;routeSpace.focus(null);
      comparisonPause.textContent = 'Resume flow';
      return;
    }
    // An explicit enter/return or adaptive path replacement is atomic. Wheel
    // control is available again as soon as that brief passage settles.
    if (history.busy || demonstration) return;
    if (learning.open) exploreFreely();
    if (history.busy) return;
    paused = true; pendingAction = null; pointer = null; keyboardHit = null;
    actionHeld = false; knowledgeAction.hidden = true; adaptiveCue.hidden = true;
    const active = history.active;
    const end = active.definition.route?.end ?? Math.max(.2, ...active.definition.children.map(node => node.at));
    active.journey.takeControl(pixels * .065, 0, Math.max(active.journey.distance, end * active.arc.length + 8));
    render(0);
  }, { passive: false });
  function restart() {
    if (phase !== 'journey' || lost || !initialMap) return;
    if (comparison) return;
    routeVisible(false);
    const destination = trialStartId;
    const request = { userGoal: currentRequest.userGoal, userBackground: currentRequest.userBackground, overrides: {} };
    generation++; // Invalidates pending response/rebuild work, even mid-flight.
    replaceMap(structuredClone(initialMap));
    currentRequest = request; adaptiveSession = createAdaptiveSession(initialMap);
    newJourney.disabled = false;
    document.querySelector('#journey-note').textContent = 'Fresh start · previous answers cleared';
    updateContext(); render(0);
    if (destination && adaptiveSession.hasChecks(destination)) {
      adaptiveNavigation = adaptiveSession.start(destination); driveAdaptiveNavigation();
    }
  }
  restartCheck.addEventListener('click', restart);
  window.addEventListener('keydown', event => {
    if (phase !== 'journey' || event.target.closest?.('input, textarea, [contenteditable="true"]')) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
    if (comparison) {
      if(comparison.entry)return;
      if(event.target===canvas&&['ArrowLeft','ArrowRight'].includes(event.code)) {
        event.preventDefault();
        const visible=routeSpace.candidates.filter(item=>item.labelOpacity>.12);
        const index=visible.findIndex(item=>item.id===keyboardHit?.id);
        keyboardHit=visible.length?visible[(index+(event.code==='ArrowRight'?1:visible.length-1))%visible.length]:null;
        pointer=null;
      }
      if(event.target===canvas&&event.code==='Enter'&&keyboardHit) {event.preventDefault();enterLandscape(keyboardHit.id);}
      if (event.code === 'Space' && !event.target.closest?.('button')) { event.preventDefault(); comparisonPause.click(); }
      return;
    }
    if (demonstration) return;
    if (event.target === canvas && !history.busy && ['ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
      const visible = history.active.landmarks.candidates.filter(item => item.labelOpacity > .12).sort((a, b) => a.depth - b.depth);
      const index = visible.findIndex(item => item.key === keyboardHit?.key);
      keyboardHit = visible.length ? visible[(index + (event.code === 'ArrowRight' ? 1 : visible.length - 1) + visible.length) % visible.length] : null;
      pointer = null;
    }
    if (event.target === canvas && event.code === 'Enter' && keyboardHit) { event.preventDefault(); if (!activateResources(keyboardHit)) requestEnter(keyboardHit); }
    if (event.code === 'Space' && !event.target.closest?.('button')) { event.preventDefault(); setPaused(!paused); }
    if (event.code === 'KeyR') restart();
    if (event.code === 'Escape' && resources.key) { resources.close(); canvas.focus({ preventScroll: true }); return; }
    if (event.code === 'Escape') { pendingAction = null; adaptiveCue.hidden = true; if (learning.open) { learning.close(); canvas.focus({ preventScroll: true }); } else requestReturn(); }
  });
  back.addEventListener('click', () => requestReturn());
  preference.addEventListener('change', event => setPaused(event.matches));
  canvas.addEventListener('pointermove', event => {
    if (phase !== 'journey' || comparison?.entry || event.pointerType === 'touch') return;
    keyboardHit = null;
    pointer = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('click', event => {
    if (phase !== 'journey' || history.busy) return;
    if(comparison) {
      const hit=routeSpace.pick({x:event.clientX,y:event.clientY},innerWidth,innerHeight);
      if(event.pointerType==='touch'&&hit?.id!==keyboardHit?.id){keyboardHit=hit;pointer=null;return;}
      if(hit)enterLandscape(hit.id);
      return;
    }
    const hit = history.active.pick({ x: event.clientX, y: event.clientY }, innerWidth, innerHeight);
    if (event.pointerType === 'touch' && hit?.key !== keyboardHit?.key) { keyboardHit = hit; pointer = null; return; }
    if (handoff) { if (demonstration) return; if (hit) selectConcept(hit); else releaseConcept(); return; }
    if (activateResources(hit)) return;
    if (!hit) resources.close();
    requestEnter(hit);
  });
  const leave = event => { if (event?.relatedTarget === knowledgeAction) return; pointer = null; canvas.style.cursor = ''; };
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointercancel', leave);
  window.addEventListener('blur', leave);
  document.addEventListener('visibilitychange', () => { previousTime = 0; leave(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); leave(); lost = true; failure.hidden = false; labelHost.hidden = true;
    understanding.hidden = true; document.querySelector('#understanding-labels').hidden = true; reopenUnderstanding.hidden = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false; failure.hidden = true; labelHost.hidden = false; previousTime = 0; render(0);
    understanding.hidden = !learning.visible; document.querySelector('#understanding-labels').hidden = false;
  });
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', () => renderer.setAnimationLoop(null));
  window.addEventListener('pageshow', () => { previousTime = 0; renderer.setAnimationLoop(frame); });
  if (handoff) {
    enterFromHandoff(); resize();
    // Standalone, the statement runs immediately. Embedded, it waits to be shown,
    // so the reveal starts when the parent has actually cross-faded to it.
    if (parent === window) beginHandoff();
    else {
      addEventListener('message', event => {
        if (event.origin === location.origin && event.data?.type === `${MESSAGE}:begin`) beginHandoff();
      });
      parent.postMessage({ type: `${MESSAGE}:ready` }, location.origin);
    }
  } else { setPhase('landing'); resize(); }
  renderer.setAnimationLoop(frame);
}
