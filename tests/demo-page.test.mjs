import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import { parseHTML } from 'linkedom'
import { demo } from '../copy/demo.js'
import { journey } from '../copy/journey.js'

function _fixture(reducedMotion = false, sequence = false) {
  const { window, document } = parseHTML(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'))
  const page = document.querySelector('#demo')
  Object.defineProperty(page, 'inert', {
    get() { return this.hasAttribute('inert') },
    set(value) { this.toggleAttribute('inert', value) },
  })
  const heading = page.querySelector('h1')
  heading.focus = () => {}
  const text = document.querySelector('#demo-typed')
  const volume = document.querySelector('#knowledge-volume')
  const canvas = document.createElement('canvas')
  volume.append(canvas)
  const selections = []
  const advances = []
  const navigations = []
  document.addEventListener('skatebored:navigate', event => navigations.push({ page: event.detail, text: text.textContent }))
  const next = document.querySelector('#demo-next')
  const pending = new Map()
  let id = 0
  let now = 0
  const motion = { matches: reducedMotion, addEventListener(_, handler) { this.handler = handler } }
  const handoff = { preloads: 0, enters: 0 }
  const context = createContext({
    demo, journey,
    window, document, CustomEvent: window.CustomEvent, MutationObserver: window.MutationObserver, matchMedia: () => motion,
    setTimeout(fn, delay = 0) { const key = ++id; pending.set(key, { fn, at: now + delay }); return key },
    clearInterval(key) { pending.delete(key) },
    clearTimeout(key) { pending.delete(key) },
    console,
    onAdvance() { advances.push(text.textContent) },
    handoff: {
      preload() { handoff.preloads++ },
      enter() { handoff.enters++ },
    },
  })
  runInContext(readFileSync(new URL('../dist/vendor/typed.umd.js', import.meta.url), 'utf8'), context)
  window.Typed = context.Typed
  if (sequence) {
    context.presentation = {
      update(vector) {
        if (vector.every(value => value === 0)) advances.push(text.textContent)
        else selections.push(Array.from(vector))
        return Promise.resolve()
      },
    }
    const sequenceSource = readFileSync(new URL('../src/concept-sequence.js', import.meta.url), 'utf8')
      .replaceAll('export ', '').split('\n').filter(line => !line.startsWith('import ')).join('\n')
    runInContext(sequenceSource + '\nvar startSequence = initializeConceptSequence(presentation, handoff)', context)
    context.onAdvance = context.startSequence
  }
  runInContext(readFileSync(new URL('../src/demo-page.js', import.meta.url), 'utf8').replace('export function', 'function').split('\n').filter(line => !line.startsWith('import ')).join('\n') + '\ninitializeDemoPage(onAdvance)', context)
  return {
    page, text, volume, canvas, next, motion, pending, navigations, advances, selections, handoff,
    sentence: heading.getAttribute('aria-label'),
    async enter() { page.dataset.entering = 'true'; await Promise.resolve(); await Promise.resolve() },
    async activate() { page.inert = false; await Promise.resolve(); await Promise.resolve() },
    async step() {
      const entry = [...pending.entries()].sort((a, b) => a[1].at - b[1].at)[0]
      if (!entry) return false
      pending.delete(entry[0]); now = entry[1].at; entry[1].fn()
      await Promise.resolve(); await Promise.resolve()
      return true
    },
    click() { next.dispatchEvent(new window.Event('click')) },
    skipClick() { page.dispatchEvent(new window.Event('click', { bubbles: true })) },
    skipSpace() {
      const event = new window.Event('keydown', { bubbles: true, cancelable: true })
      event.code = 'Space'
      document.dispatchEvent(event)
      return event.defaultPrevented
    },
  }
}

test('click leaves typing running but finishes deletion; Space keeps its shortcut', async () => {
  const f = _fixture()
  await f.activate()
  await f.step()
  const partial = f.text.textContent
  f.skipClick()
  assert.equal(f.text.textContent, partial)
  assert.equal(f.next.hidden, true)
  assert.equal(f.skipSpace(), true)
  assert.equal(f.text.textContent, f.sentence)
  assert.equal(f.text.querySelector('.text-accent')?.textContent, demo.revealAfter)
  assert.equal(f.next.hidden, false)
  assert.equal(f.volume.classList.contains('is-visible'), true)
  f.click()
  assert.equal(f.next.hidden, true)
  f.skipClick()
  assert.equal(f.text.textContent, '')
  assert.deepEqual(f.advances, [''])

  const keyboard = _fixture()
  await keyboard.activate()
  await keyboard.step()
  assert.equal(keyboard.skipSpace(), true)
  assert.equal(keyboard.text.textContent, keyboard.sentence)
  assert.equal(keyboard.next.hidden, false)
})

test('actual Typed.js reveals at the phrase, holds, then deletes without touching the canvas', async () => {
  const f = _fixture()
  const threshold = f.sentence.indexOf('three dimensions') + 'three dimensions'.length
  assert.equal(f.text.textContent, '')
  assert.equal(f.pending.size, 0, 'does not consume the intro while still on the landing page')
  assert.equal(f.next.hidden, true)
  await f.activate()
  let reachedPhrase = false
  let frames = 0
  while (await f.step()) {
    assert.ok(frames++ < 1000)
    if (f.text.textContent.length < threshold) {
      assert.equal(f.volume.classList.contains('is-visible'), false)
    } else {
      assert.equal(f.volume.classList.contains('is-visible'), true)
      if (f.text.textContent.length === threshold) {
        reachedPhrase = true
        assert.equal(f.next.hidden, true, 'Next waits for the full sentence')
      }
    }
  }
  assert.ok(reachedPhrase)
  assert.equal(f.text.textContent, f.sentence)
  assert.equal(f.text.querySelector('.text-accent')?.textContent, demo.revealAfter)
  assert.equal(f.next.hidden, false)
  assert.equal(f.pending.size, 0, 'no automatic erase or looping timer')
  f.click()
  f.click()
  assert.equal(f.next.hidden, true)
  let previousLength = f.sentence.length
  while (await f.step()) {
    assert.ok(frames++ < 1500)
    assert.ok(f.text.textContent.length <= previousLength, 'deletion must never retype')
    previousLength = f.text.textContent.length
    assert.equal(f.volume.firstElementChild, f.canvas)
    assert.equal(f.volume.classList.contains('is-visible'), true)
    assert.equal(f.page.inert, false)
  }
  assert.equal(f.text.textContent, '')
  assert.equal(f.next.hidden, true)
  assert.equal(f.pending.size, 0)
  assert.equal(f.volume.firstElementChild, f.canvas)
  assert.deepEqual(f.navigations, [])
  assert.deepEqual(f.advances, [''])
})

test('reduced motion preserves the same completed and empty states', async () => {
  const f = _fixture(true)
  await f.activate()
  assert.equal(f.text.textContent, f.sentence)
  assert.equal(f.volume.classList.contains('is-visible'), true)
  assert.equal(f.next.hidden, false)
  f.click()
  assert.equal(f.text.textContent, '')
  assert.equal(f.next.hidden, true)
  assert.equal(f.volume.firstElementChild, f.canvas)
  assert.equal(f.pending.size, 0)
})

test('turning reduced motion on during typing completes without restarting', async () => {
  const f = _fixture()
  await f.activate()
  for (let i = 0; i < 20; i++) await f.step()
  f.motion.matches = true
  f.motion.handler()
  assert.equal(f.text.textContent, f.sentence)
  assert.equal(f.next.hidden, false)
  assert.equal(f.pending.size, 0)
})


test('Next runs the whole demonstration in the original page with no navigation or canvas replacement', async () => {
  const f = _fixture(false, true)
  const originalPage = f.page
  const originalStyle = f.volume.getAttribute('style')
  await f.activate()
  let steps = 0
  while (await f.step()) assert.ok(steps++ < 1500)
  assert.equal(f.text.textContent, f.sentence)
  f.click()
  while (await f.step()) {
    assert.ok(steps++ < 3500)
    assert.equal(f.page, originalPage)
    assert.equal(f.page.inert, false)
    assert.equal(f.volume.firstElementChild, f.canvas)
    assert.equal(f.volume.getAttribute('style'), originalStyle)
    assert.equal(f.volume.classList.contains('is-visible'), true)
    assert.equal(f.navigations.length, 0)
  }
  assert.deepEqual(f.advances, [''], 'clear only after the complete intro deletion')
  assert.equal(f.selections.length, 4)
  // The demonstration ends by erasing itself and handing the same page over.
  assert.equal(f.text.textContent, '')
  assert.equal(f.handoff.preloads, 1)
  assert.equal(f.handoff.enters, 1)
  assert.equal(f.next.hidden, true)
  assert.equal(f.pending.size, 0)
})

test('incoming intro starts during the wipe while its page remains inert', async () => {
  const f = _fixture();
  await f.enter();
  assert.equal(f.page.inert, true);
  for (let i = 0; i < 12; i++) await f.step();
  assert.ok(f.text.textContent.length > 0);
  const prefix = f.text.textContent;
  await f.activate();
  assert.equal(f.text.textContent, prefix, 'completion does not restart the intro');
});
