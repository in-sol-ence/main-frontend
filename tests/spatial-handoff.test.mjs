import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import { parseHTML } from 'linkedom'
import { journey } from '../copy/journey.js'
import { SPATIAL_GOAL, SPATIAL_BACKGROUND, SPATIAL_STATEMENT, MESSAGE, READY_TIMEOUT } from '../src/spatial-handoff.js'

function _fixture() {
  const { document } = parseHTML(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'))
  const stage = document.querySelector('#spatial-stage')
  const frame = document.querySelector('#spatial-frame')
  const pages = document.querySelector('#pages')
  const posted = []
  const listeners = new Set()
  let focused = 0, id = 0, now = 0
  const timers = new Map()
  frame.focus = () => { focused++ }
  Object.defineProperty(frame, 'contentWindow', {
    value: { postMessage(data, origin) { posted.push({ data, origin }) } },
  })
  const context = createContext({
    journey,
    document, location: { origin: 'https://example.test' },
    addEventListener: (type, fn) => { if (type === 'message') listeners.add(fn) },
    removeEventListener: (type, fn) => listeners.delete(fn),
    setTimeout(fn, delay = 0) { timers.set(++id, { fn, at: now + delay }); return id },
    clearTimeout(key) { timers.delete(key) },
  })
  const source = readFileSync(new URL('../src/spatial-handoff.js', import.meta.url), 'utf8').replaceAll('export ', '').split('\n').filter(line => !line.startsWith('import ')).join('\n')
  runInContext(source + '\nvar handoff = createSpatialHandoff()', context)
  return {
    stage, frame, pages, posted, context, timers,
    get focused() { return focused },
    get listening() { return listeners.size },
    deliver(event) { for (const fn of [...listeners]) fn(event) },
    ready() { this.deliver({ origin: 'https://example.test', source: frame.contentWindow, data: { type: `${MESSAGE}:ready` } }) },
    expire() {
      const entry = [...timers.entries()][0]
      timers.delete(entry[0]); now = entry[1].at; entry[1].fn()
    },
  }
}

test('warming points the existing study at the calculus goal, and only starts it once', async () => {
  const f = _fixture()
  assert.equal(f.frame.getAttribute('src'), 'about:blank')
  assert.equal(f.stage.hasAttribute('inert'), true)
  const warmed = f.context.handoff.preload()
  assert.equal(f.context.handoff.preload(), warmed, 'a second call reuses the first boot')
  const source = f.frame.src || f.frame.getAttribute('src')
  const url = new URL(source, 'https://example.test/index.html')
  assert.equal(url.pathname, '/spatial/index.html')
  // The router falls back to reinforcement learning unless the goal says calculus.
  assert.equal(url.searchParams.get('goal'), SPATIAL_GOAL)
  assert.match(url.searchParams.get('goal'), /calculus/i)
  assert.equal(url.searchParams.get('statement'), SPATIAL_STATEMENT)
  assert.equal(SPATIAL_STATEMENT, 'Let’s say John Doe wants to learn calculus.')
  // What he already knows is what makes the trajectory visibly personalized.
  assert.equal(url.searchParams.get('background'), SPATIAL_BACKGROUND)
  // The study's narration lines come from copy/journey.js, not its own defaults.
  for (const key of ['learner', 'topicLine', 'rationale', 'conceptsLabel']) assert.equal(url.searchParams.get(key), journey[key], key)
  assert.match(SPATIAL_BACKGROUND, /algebra/i)
  // Nothing is shown or taken over merely by warming it.
  assert.equal(f.stage.classList.contains('is-entering'), false)
  assert.equal(f.stage.hasAttribute('inert'), true)
  assert.equal(f.pages.inert, undefined)
  assert.equal(f.posted.length, 0)
  f.ready()
  assert.equal(await warmed, true)
  assert.equal(f.timers.size, 0, 'the fallback timer is cleared')
})

test('unrelated messages cannot start the handover', async () => {
  const f = _fixture()
  const warmed = f.context.handoff.preload()
  f.deliver({ origin: 'https://attacker.test', source: f.frame.contentWindow, data: { type: `${MESSAGE}:ready` } })
  f.deliver({ origin: 'https://example.test', source: {}, data: { type: `${MESSAGE}:ready` } })
  f.deliver({ origin: 'https://example.test', source: f.frame.contentWindow, data: { type: 'something-else' } })
  assert.equal(f.listening, 1, 'still waiting for the real study')
  f.ready()
  assert.equal(await warmed, true)
})

test('entering reveals the study, retires the page beneath it, and starts the statement', async () => {
  const f = _fixture()
  f.context.handoff.preload()
  f.ready()
  await f.context.handoff.enter()
  assert.equal(f.stage.classList.contains('is-entering'), true)
  assert.equal(f.stage.hasAttribute('inert'), false)
  assert.equal(f.stage.hasAttribute('aria-hidden'), false)
  assert.equal(f.pages.inert, true, 'the embedding space is finished, not merely hidden')
  assert.equal(f.posted.length, 1)
  assert.equal(f.posted[0].data.type, `${MESSAGE}:begin`)
  assert.equal(f.posted[0].origin, 'https://example.test', 'the study is addressed by exact origin')
  assert.equal(f.focused, 1)
})

test('a study that never reports ready still hands over rather than stranding the viewer', async () => {
  const f = _fixture()
  const warmed = f.context.handoff.preload()
  assert.equal(f.timers.size, 1)
  f.expire()
  assert.equal(await warmed, false)
  await f.context.handoff.enter()
  assert.equal(f.stage.classList.contains('is-entering'), true)
  assert.ok(READY_TIMEOUT >= 1000)
  // A slow study that loads after we gave up is still told to begin, so the
  // statement and the journey run instead of a silent, motionless space.
  assert.equal(f.posted.length, 1, 'the first attempt went to a window that was not there yet')
  f.ready()
  assert.equal(f.posted.length, 2)
  assert.equal(f.posted[1].data.type, `${MESSAGE}:begin`)
})

test('the deployed build actually contains the study the page hands over to', () => {
  const root = new URL('../dist/spatial/', import.meta.url)
  for (const file of ['index.html', 'style.css', 'src/main.js', 'src/handoff.js', 'vendor/three.module.min.js']) {
    assert.ok(existsSync(new URL(file, root)), `dist/spatial/${file}`)
  }
  const page = readFileSync(new URL('index.html', root), 'utf8')
  assert.match(page, /id="handoff-statement"/)
  assert.match(page, /id="narration"/)
  const source = readFileSync(new URL('src/main.js', root), 'utf8')
  assert.match(source, /readHandoff/)
  // The copy is generated; spatial/ stays the single source of truth.
  assert.equal(source, readFileSync(new URL('../spatial/src/main.js', import.meta.url), 'utf8'))
})
