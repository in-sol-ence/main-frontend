import { concepts, samplePrompt, selectGoal, descendants } from './data.js';

const $ = selector => document.querySelector(selector);
const root = document.body;
const input = $('#goal-input');
const workspace = $('#map-workspace');
const layers = $('#map-layers');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { goal: 'rl', pinned: [], preview: null, phase: 'intro', auto: true, generation: 0, motion: !reducedMotion.matches, timers: new Set(), active: 'rl' };
let restoreTimer;
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const num = value => String(value).padStart(2, '0');
const defer = (callback, delay) => { const timer = setTimeout(() => { state.timers.delete(timer); callback(); }, delay); state.timers.add(timer); return timer; };
const visiblePath = () => state.preview || state.pinned;
const relevant = edge => state.goal !== 'rl' || edge.relevant;
const scrollBehavior = () => state.motion ? 'smooth' : 'instant';
import('./scene.js').catch(error => { document.body.classList.add('sculpture-unavailable'); console.warn('Using the animated CSS sculpture fallback.', error.message); });
document.querySelectorAll('[data-sculpture-topic]').forEach(button => button.addEventListener('click', () => {
  stopTour();
  input.value = Number(button.dataset.sculptureTopic) === 0 ? 'I want to understand linear algebra and how its ideas connect.' : samplePrompt;
  generate();
}));

function stopTour() {
  state.auto = false;
  for (const timer of state.timers) clearTimeout(timer);
  state.timers.clear();
  $('#demo-cursor').classList.remove('is-visible');
  if (state.phase === 'ready') $('#playback-status').textContent = 'TAKE YOUR TIME. THE MAP IS YOURS.';
}

function setPhase(phase) {
  state.phase = phase;
  root.dataset.phase = phase;
  workspace.hidden = phase !== 'ready';
  input.readOnly = phase === 'ready' || phase === 'building';
  fitPrompt();
  $('#generate-button').disabled = phase === 'building';
  $('#generate-button span').textContent = phase === 'ready' ? 'Edit goal' : phase === 'building' ? 'Connecting' : 'Make it a map';
  $('#input-state').textContent = phase === 'building' ? 'FINDING THE CONNECTIONS' : state.auto ? 'WATCH IT UNFOLD' : 'YOUR CURIOSITY, YOUR WORDS';
}

function fitPrompt() {
  input.style.height = '';
  if (input.scrollHeight > input.clientHeight) input.style.height = `${input.scrollHeight}px`;
}

function labelForEdge(edge) {
  if (!relevant(edge)) return 'BEYOND THIS GOAL';
  return concepts[edge.id].children ? `${concepts[edge.id].children.length} CONNECTIONS` : 'STARTING CONCEPT';
}

function segmentHTML(edge, index) {
  const node = concepts[edge.id];
  const needed = relevant(edge);
  return `<button class="segment${needed ? '' : ' is-optional'}" data-id="${edge.id}" type="button" style="--weight:${edge.weight};--index:${index};--hue:${150 + index * 7}" aria-pressed="false" ${node.children ? 'aria-expanded="false"' : ''} aria-label="${escape(node.title)}${needed ? '' : ', beyond the current goal'}"><span class="segment-pattern" aria-hidden="true"></span><span class="segment-top"><span>${num(index + 1)}</span><span class="segment-symbol" aria-hidden="true">${node.symbol}</span></span><strong>${node.title}</strong><span class="segment-bottom"><span>${labelForEdge(edge)}</span><span class="segment-expand" aria-hidden="true">${node.children ? '+' : '↗'}</span></span></button>`;
}

function layerHTML(parentId, depth, pinned) {
  const node = concepts[parentId];
  const required = node.children.filter(relevant).length;
  return `<div class="layer-connector" aria-hidden="true"><svg preserveAspectRatio="none"><path class="connector-line"/><path class="connector-light"/><circle class="connector-dot" r="2"/></svg></div><div class="layer-header"><div class="layer-title"><span class="layer-number">${num(depth + 1)}</span><h3 id="layer-heading-${depth}">${depth === 0 ? 'The ideas that bring it together' : `Inside ${node.title.toLowerCase()}`}</h3></div><div class="layer-header-right"><span class="layer-note">${required} OF ${node.children.length} IN YOUR PATH</span>${depth > 0 ? `<span class="layer-pin${pinned ? '' : ' preview'}">${pinned ? 'HELD OPEN' : 'PREVIEW'}</span><button class="layer-goal" data-new-goal="${parentId}" type="button">Make this my goal ↗</button>` : ''}</div></div><div class="band-scroller"><div class="concept-band" role="group" aria-labelledby="layer-heading-${depth}">${node.children.map(segmentHTML).join('')}</div></div><span class="swipe-hint">SWIPE TO EXPLORE THE WHOLE BAND <span>→</span></span>`;
}

function renderLayers() {
  const path = visiblePath();
  const parents = [state.goal];
  for (const id of path) { if (concepts[id].children) parents.push(id); else break; }
  for (let depth = 0; depth < parents.length; depth++) {
    const parentId = parents[depth];
    let layer = layers.children[depth];
    const isPinned = depth === 0 || state.pinned[depth - 1] === parentId && !state.preview;
    if (!layer || layer.dataset.parent !== parentId) {
      while (layers.children.length > depth) layers.lastElementChild.remove();
      layer = document.createElement('section');
      layer.className = 'layer';
      layer.dataset.depth = depth;
      layer.dataset.parent = parentId;
      layer.setAttribute('aria-label', `Concepts inside ${concepts[parentId].title}`);
      layer.innerHTML = layerHTML(parentId, depth, isPinned);
      layers.append(layer);
    }
    layer.classList.toggle('is-preview', !isPinned);
    const badge = layer.querySelector('.layer-pin');
    if (badge) { badge.textContent = isPinned ? 'HELD OPEN' : 'PREVIEW'; badge.classList.toggle('preview', !isPinned); }
    for (const button of layer.querySelectorAll('.segment')) {
      const selected = button.dataset.id === path[depth];
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(button.dataset.id === state.pinned[depth]));
      if (button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', String(selected));
    }
  }
  while (layers.children.length > parents.length) layers.lastElementChild.remove();
  const breadcrumbs = [state.goal, ...path];
  $('#breadcrumbs').innerHTML = breadcrumbs.map((id, index) => `${index ? '<span aria-hidden="true">/</span>' : ''}<button type="button" data-breadcrumb="${index}"${index === breadcrumbs.length - 1 ? ' aria-current="location"' : ''}>${concepts[id].title}</button>`).join('');
  state.active = path.at(-1) || state.goal;
  renderInsight(state.active);
  requestAnimationFrame(drawConnections);
}

function drawConnections() {
  for (const [depth, layer] of [...layers.children].entries()) {
    const box = layer.getBoundingClientRect();
    const connector = layer.querySelector('.layer-connector');
    const svg = connector.querySelector('svg');
    const width = box.width;
    const height = connector.clientHeight;
    let start = width / 2;
    if (depth > 0) {
      const previous = layers.children[depth - 1].querySelector(`[data-id="${layer.dataset.parent}"]`);
      if (previous) { const source = previous.getBoundingClientRect(); start = Math.max(2, Math.min(width - 2, source.left + source.width / 2 - box.left)); }
    }
    const end = width / 2;
    const d = `M ${start} 0 C ${start} ${height * .65}, ${end} ${height * .3}, ${end} ${height - 4}`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    connector.querySelectorAll('path').forEach(path => path.setAttribute('d', d));
    const dot = connector.querySelector('circle');
    dot.setAttribute('cx', end); dot.setAttribute('cy', height - 4);
  }
}

function renderInsight(id) {
  const node = concepts[id];
  const parent = visiblePath().length > 1 ? concepts[visiblePath().at(-2)] : concepts[state.goal];
  const edge = parent.children?.find(edge => edge.id === id);
  const outside = edge && !relevant(edge);
  const connection = edge && !edge.relevant && state.goal !== 'rl' ? `${node.description} With ${concepts[state.goal].title.toLowerCase()} as your goal, this idea is part of the complete subject you’re exploring.` : node.connection;
  $('#insight').innerHTML = `<div class="insight-title"><span class="insight-symbol" aria-hidden="true">${node.symbol}</span><div><span class="micro">${outside ? 'A CONNECTION FOR ANOTHER DAY' : node.children ? 'THE CONNECTION' : 'A PLACE TO BEGIN'}</span><h3>${node.title}</h3></div></div><div><span class="micro">${outside ? 'WHY IT’S GRAY' : 'WHY IT MATTERS'}</span><p>${connection}</p></div><div class="insight-example"><span class="micro">${outside ? 'A GLIMPSE INSIDE' : 'PICTURE THIS'}</span><p>${node.example}</p></div>`;
}

function showGoal(id) {
  state.goal = id; state.pinned = []; state.preview = null;
  layers.replaceChildren();
  $('#goal-title').textContent = concepts[id].title;
  $('#goal-description').textContent = concepts[id].description;
  $('#discipline-count').textContent = concepts[id].children?.length || 0;
  $('#concept-count').textContent = descendants(id);
  renderLayers();
}

function explore(button, pin = false) {
  const depth = Number(button.closest('.layer').dataset.depth);
  const id = button.dataset.id;
  clearTimeout(restoreTimer);
  const next = visiblePath().slice(0, depth).concat(id);
  if (pin) {
    const toggleOff = !state.preview && state.pinned[depth] === id;
    state.pinned = toggleOff ? state.pinned.slice(0, depth) : next;
    state.preview = null;
  } else {
    if (visiblePath()[depth] === id) return;
    state.preview = next;
  }
  renderLayers();
}

layers.addEventListener('pointerover', event => {
  if (event.pointerType === 'touch') return;
  const button = event.target.closest('.segment');
  if (!button || button.contains(event.relatedTarget)) return;
  stopTour(); explore(button);
});
layers.addEventListener('pointerleave', () => {
  if (!state.preview) return;
  restoreTimer = setTimeout(() => { state.preview = null; renderLayers(); }, 450);
});
layers.addEventListener('pointerenter', () => clearTimeout(restoreTimer));
layers.addEventListener('scroll', drawConnections, true);
layers.addEventListener('focusin', event => {
  const button = event.target.closest('.segment');
  if (button && button.matches(':focus-visible')) { stopTour(); explore(button); }
});
layers.addEventListener('click', event => {
  const button = event.target.closest('.segment');
  if (button) { stopTour(); explore(button, true); }
  const newGoal = event.target.closest('[data-new-goal]');
  if (newGoal) {
    stopTour();
    showGoal(newGoal.dataset.newGoal);
    input.value = `I want to explore the whole subject of ${concepts[state.goal].title.toLowerCase()}.`;
    $('#experience-status').textContent = 'A NEW GOAL. A NEW PERSPECTIVE.';
    $('#playback-status').textContent = 'THE WHOLE SUBJECT IS NOW IN FOCUS';
    $('.map-center').scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
  }
});
layers.addEventListener('keydown', event => {
  const button = event.target.closest('.segment');
  if (!button) return;
  const siblings = [...button.parentElement.querySelectorAll('.segment')];
  const index = siblings.indexOf(button);
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    siblings[(index + (event.key === 'ArrowRight' ? 1 : siblings.length - 1)) % siblings.length].focus();
  } else if (event.key === 'ArrowDown') {
    event.preventDefault(); stopTour();
    state.pinned = visiblePath().slice(); state.preview = null; renderLayers();
    button.closest('.layer').nextElementSibling?.querySelector('.segment')?.focus();
  }
});

$('#breadcrumbs').addEventListener('click', event => {
  const button = event.target.closest('[data-breadcrumb]');
  if (!button) return;
  stopTour(); state.pinned = visiblePath().slice(0, Number(button.dataset.breadcrumb)); state.preview = null; renderLayers();
});
$('#collapse-button').addEventListener('click', () => { stopTour(); state.pinned = []; state.preview = null; renderLayers(); });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || $('#about-dialog').open || state.phase !== 'ready') return;
  stopTour(); clearTimeout(restoreTimer);
  if (state.preview) state.preview = null; else state.pinned.pop();
  renderLayers();
});

function cursorAt(id, label) {
  const target = layers.querySelector(`[data-id="${id}"]`);
  if (!target) return;
  const box = target.getBoundingClientRect();
  const area = $('#experience').getBoundingClientRect();
  const cursor = $('#demo-cursor');
  cursor.classList.add('is-visible');
  cursor.style.transform = `translate(${box.left - area.left + box.width * .64}px, ${box.top - area.top + box.height * .68}px)`;
  cursor.querySelector('span').textContent = label;
}

function runTour() {
  if (!state.auto || !state.motion || state.goal !== 'rl') return;
  defer(() => { if (state.auto) cursorAt('linear', 'A closer look'); }, 700);
  defer(() => { if (!state.auto) return; state.pinned = ['linear']; renderLayers(); cursorAt('linear', 'Click to hold'); }, 1650);
  defer(() => { if (state.auto) cursorAt('vectors', 'What’s underneath?'); }, 2900);
  defer(() => {
    if (!state.auto) return;
    state.pinned = ['linear', 'vectors']; renderLayers(); cursorAt('vectors', 'It all connects');
    if (innerWidth > 760) $('.map-center').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }, 3800);
  defer(() => {
    if (!state.auto) return;
    $('#demo-cursor').classList.remove('is-visible');
    $('#playback-status').textContent = 'NOW IT’S YOUR TURN. FOLLOW A CONNECTION.';
    state.auto = false;
  }, 5600);
}

function generate() {
  if (!input.value.trim()) input.value = samplePrompt;
  const choice = selectGoal(input.value);
  const run = ++state.generation;
  setPhase('building');
  $('#experience-status').textContent = 'TURNING A QUESTION INTO A LANDSCAPE';
  const steps = ['Understanding the ambition', 'Tracing the ideas underneath', 'Connecting your way forward'];
  steps.forEach((text, index) => setTimeout(() => {
    if (run === state.generation) $('#generation-caption').textContent = `${num(index + 1)} / ${text}`;
  }, state.motion ? index * 800 : 0));
  setTimeout(() => {
    if (run !== state.generation) return;
    setPhase('ready'); showGoal(choice.id);
    $('#experience-status').textContent = choice.supported ? 'ONE GOAL. A WORLD OF CONNECTIONS.' : 'EXAMPLE MAP · TRY AI, LINEAR ALGEBRA, OR PYTHON';
    $('#playback-status').textContent = choice.supported ? 'YOUR MAP IS READY TO EXPLORE' : 'THIS GOAL ISN’T IN THE DEMO YET. EXPLORING THE AI EXAMPLE.';
    runTour();
  }, state.motion ? 2600 : 30);
}

function editGoal() {
  stopTour(); state.generation++; setPhase('intro');
  $('#generation-caption').textContent = '';
  $('#experience-status').textContent = 'START SOMEWHERE NEW';
  input.focus({ preventScroll: true }); input.select();
  defer(() => $('#goal-form').scrollIntoView({ behavior: scrollBehavior(), block: 'center' }), 350);
}

$('#goal-form').addEventListener('submit', event => {
  event.preventDefault();
  if (state.phase === 'ready') { editGoal(); return; }
  if (state.phase === 'building') return;
  stopTour(); generate();
});
input.addEventListener('focus', () => { if (state.phase === 'intro') { stopTour(); $('#input-state').textContent = 'YOUR CURIOSITY, YOUR WORDS'; } });
input.addEventListener('input', () => { if (state.phase === 'intro') { stopTour(); fitPrompt(); } });
input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#goal-form').requestSubmit(); } });

function startDemo() {
  stopTour(); state.generation++; clearTimeout(restoreTimer);
  state.auto = true; state.pinned = []; state.preview = null;
  setPhase('intro'); input.value = ''; input.blur();
  $('#generation-caption').textContent = '';
  $('#experience-status').textContent = 'A LITTLE CURIOSITY GOES A LONG WAY';
  let index = 0;
  if (!state.motion) { input.value = samplePrompt; generate(); return; }
  function typeNext() {
    if (!state.auto) return;
    index = Math.min(index + 2, samplePrompt.length);
    input.value = samplePrompt.slice(0, index);
    fitPrompt();
    if (index < samplePrompt.length) defer(typeNext, /[.?!]/.test(samplePrompt[index - 1]) ? 140 : 38);
    else defer(generate, 700);
  }
  defer(typeNext, 1100);
}
$('#replay-button').addEventListener('click', () => { startDemo(); window.scrollTo({ top: 0, behavior: scrollBehavior() }); });
$('#explore-button').addEventListener('click', () => {
  if (state.phase === 'ready') { stopTour(); layers.scrollIntoView({ behavior: scrollBehavior(), block: 'center' }); layers.querySelector('.segment')?.focus({ preventScroll: true }); }
  else { stopTour(); input.focus({ preventScroll: true }); $('#goal-form').scrollIntoView({ behavior: scrollBehavior(), block: 'center' }); }
});
const dialog = $('#about-dialog');
$('#about-button').addEventListener('click', () => { stopTour(); dialog.showModal(); });
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });

function syncMotion() {
  root.classList.toggle('motion-paused', !state.motion);
  $('#motion-button').textContent = state.motion ? 'Pause motion' : 'Resume motion';
  $('#motion-button').setAttribute('aria-pressed', String(!state.motion));
}
$('#motion-button').addEventListener('click', () => { stopTour(); state.motion = !state.motion; syncMotion(); });
reducedMotion.addEventListener('change', event => { state.motion = !event.matches; syncMotion(); if (event.matches && state.auto) { stopTour(); if (state.phase === 'intro') { input.value = samplePrompt; generate(); } } });

// Quiet, procedural depth: drifting points and a perspective field, without image assets.
const canvas = $('#atmosphere');
const context = canvas.getContext('2d');
let width = 0, height = 0, frame = 0;
const particles = Array.from({ length: 72 }, (_, index) => ({ x: (Math.sin(index * 127.1 + 11) * 43758.5453) % 1, y: (Math.sin(index * 311.7 + 5) * 15731.743) % 1, radius: index % 6 === 0 ? 1.1 : .55, phase: index * .7 }));
function resize() {
  width = window.innerWidth; height = window.innerHeight;
  const density = Math.min(devicePixelRatio, 2);
  canvas.width = width * density; canvas.height = height * density;
  context?.setTransform(density, 0, 0, density, 0, 0);
  drawConnections();
}
function draw(time) {
  requestAnimationFrame(draw);
  if (!context || document.hidden || time - frame < 48) return;
  frame = time;
  const t = state.motion ? time * .00012 : 0;
  context.clearRect(0, 0, width, height);
  const glow = context.createRadialGradient(width * .5, height * .67, 0, width * .5, height * .67, width * .65);
  glow.addColorStop(0, '#17403918'); glow.addColorStop(.5, '#122a2710'); glow.addColorStop(1, '#0a111500');
  context.fillStyle = glow; context.fillRect(0, 0, width, height);
  for (const particle of particles) {
    const x = Math.abs(particle.x) * width;
    const y = (Math.abs(particle.y) * height + Math.sin(t + particle.phase) * 12 + height) % height;
    context.beginPath(); context.arc(x, y, particle.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(178,219,200,${.1 + (Math.sin(t + particle.phase) + 1) * .09})`; context.fill();
  }
  const horizon = height * .66;
  context.strokeStyle = '#9fcdb208'; context.lineWidth = .5;
  for (let i = -10; i <= 10; i++) {
    context.beginPath(); context.moveTo(width * .5 + i * 21, horizon); context.lineTo(width * .5 + i * width * .17, height); context.stroke();
  }
  for (let i = 0; i < 11; i++) {
    const y = horizon + Math.pow(i / 10, 2.3) * height * .34;
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }
}
window.addEventListener('resize', resize);
window.addEventListener('wheel', () => { if (state.auto && state.phase === 'ready') stopTour(); }, { passive: true });
new ResizeObserver(drawConnections).observe(layers);
syncMotion(); resize(); requestAnimationFrame(draw); startDemo();
