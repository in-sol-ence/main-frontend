import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createContext, runInContext, runInNewContext } from 'node:vm'
import { parseHTML } from 'linkedom'
import { conceptStages, closingSentence } from '../src/concept-sequence.js'
import { demo } from '../copy/demo.js'
import { journey } from '../copy/journey.js'

function _fixture(reduced = false) {
  const { window, document } = parseHTML(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'))
  const page = document.querySelector('#demo')
  Object.defineProperty(page, 'inert', {
    get() { return this.hasAttribute('inert') },
    set(value) { this.toggleAttribute('inert', value) },
  })
  const sentence = document.querySelector('#demo-typed')
  const pending = new Map()
  const selections = []
  let id = 0, now = 0, clearCount = 0, finish, emptyFinish, leaving = false
  const handoff = { preloads: 0, enters: 0, enteredAt: null }
  const context = createContext({
    demo, journey,
    handoff: {
      preload() { handoff.preloads++ },
      enter() { handoff.enters++; handoff.enteredAt = now },
    },
    window, document, MutationObserver: window.MutationObserver,
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    setTimeout(fn, delay = 0) { pending.set(++id, { fn, at: now + delay }); return id },
    clearTimeout(key) { pending.delete(key) }, clearInterval(key) { pending.delete(key) },
    presentation: {
      update(vector) {
        assert.equal(vector.length, 24)
        assert.ok(vector.every(value => value === 0 || value === 1))
        if (vector.every(value => value === 0)) {
          clearCount++
          return new Promise(resolve => { emptyFinish = resolve })
        }
        selections.push({ phrase: document.querySelector('#concept-phrase').textContent,
          ids: Array.from(vector, (value, index) => value ? `Q${index + 1}` : null).filter(Boolean), at: now })
        return new Promise(resolve => { finish = resolve })
      }
    },
  })
  runInContext(readFileSync(new URL('../dist/vendor/typed.umd.js', import.meta.url), 'utf8'), context)
  window.Typed = context.Typed
  // The handoff is injected: this exercises the sequence, not the iframe host.
  const source = readFileSync(new URL('../src/concept-sequence.js', import.meta.url), 'utf8')
    .replaceAll('export ', '').split('\n').filter(line => !line.startsWith('import ')).join('\n')
  runInContext(source + '\nvar start = initializeConceptSequence(presentation, handoff)', context)
  return {
    page, sentence, pending, selections, handoff,
    get phrase() { return document.querySelector('#concept-phrase') },
    get clears() { return clearCount }, get now() { return now },
    async activate() { page.inert = false; context.start(); await Promise.resolve(); await Promise.resolve() },
    async settleEmpty() { emptyFinish(); await Promise.resolve(); await Promise.resolve() },
    async settle() { finish(); await Promise.resolve(); await Promise.resolve() },
    // The shell is intact for every stage; the exit deliberately erases it.
    leave() { leaving = true },
    skipClick() { page.dispatchEvent(new window.Event('click', { bubbles: true })) },
    skipSpace() {
      const event = new window.Event('keydown', { bubbles: true, cancelable: true })
      event.code = 'Space'
      document.dispatchEvent(event)
      return event.defaultPrevented
    },
    async step() {
      const entry = [...pending.entries()].sort((a, b) => a[1].at - b[1].at)[0]
      if (!entry) return false
      pending.delete(entry[0]); now = entry[1].at; entry[1].fn()
      await Promise.resolve(); await Promise.resolve()
      if (selections.length && !leaving) {
        assert.ok(sentence.textContent.startsWith('This is '))
        assert.ok(sentence.textContent.endsWith(' in the embedding space.'))
      }
      return true
    },
  }
}

test('Space finishes the sentence shell and click finishes only the current concept', async () => {
  const f = _fixture()
  await f.activate()
  assert.equal(f.skipSpace(), true)
  assert.equal(f.sentence.textContent, 'This is  in the embedding space.')
  await f.settleEmpty()
  await f.step()
  f.skipClick()
  assert.equal(f.phrase.textContent, conceptStages[0].phrase)
  assert.equal(f.selections.length, 1)
  assert.equal(f.handoff.enters, 0)
})

for (const reduced of [false, true]) test(`sequence follows actual phrase and visual completion (reduced motion: ${reduced})`, async () => {
  const f = _fixture(reduced)
  assert.equal(f.pending.size, 0)
  await f.activate()
  assert.equal(f.clears, 1)
  let shellSteps = 0
  while (!f.sentence.textContent.endsWith(' in the embedding space.')) {
    assert.ok(await f.step())
    assert.ok(shellSteps++ < 200)
  }
  assert.equal(f.phrase.textContent, '')
  assert.equal(f.selections.length, 0)
  while (await f.step()) assert.ok(shellSteps++ < 220)
  assert.equal(f.selections.length, 0, 'wait for original volume to finish shrinking')
  await f.settleEmpty()
  assert.equal([...f.pending.values()][0].at - f.now, 700)
  let steps = 0
  for (let index = 0; index < conceptStages.length; index++) {
    while (f.selections.length <= index) {
      assert.ok(await f.step())
      assert.ok(steps++ < 1200)
    }
    assert.equal(f.phrase.textContent, conceptStages[index].phrase)
    assert.deepEqual(f.selections[index].ids, conceptStages[index].ids)
    // No stage can progress before the renderer reports that highlighting settled.
    while (await f.step()) assert.ok(steps++ < 1200)
    assert.equal(f.selections.length, index + 1)
    await f.settle()
    if (index < conceptStages.length - 1) {
      assert.equal([...f.pending.values()][0].at - f.now, 2000)
    }
  }
  assert.equal(f.phrase.textContent, "John Doe's knowledge")
  assert.equal(f.selections.length, 4)
  // The John Doe selection holds for the same 2000ms as every other stage.
  assert.equal(f.pending.size, 1)
  assert.equal([...f.pending.values()][0].at - f.now, 2000)
  assert.equal(f.handoff.preloads, 1, 'the study is warmed once, while the sequence runs')
  assert.equal(f.handoff.enters, 0)
  const held = f.now
  f.leave()
  assert.ok(await f.step())
  // One more screen follows, in the same voice: the John Doe sentence is erased
  // and the closing sentence is typed into the very same span.
  const johnDoe = "This is John Doe's knowledge in the embedding space."
  let steps2 = 0
  while (f.sentence.textContent !== closingSentence) {
    assert.ok(await f.step(), 'the screen erases and the next sentence types')
    const shown = f.sentence.textContent
    assert.ok(johnDoe.startsWith(shown) || closingSentence.startsWith(shown), 'only erased or typed, never swapped')
    assert.equal(f.handoff.enters, 0, 'nothing hands over mid-sentence')
    assert.ok(steps2++ < 1600)
  }
  assert.match(closingSentence, /^Skatebored turns a complex syllabus/)
  assert.equal(f.page.querySelector('[data-page-heading]').getAttribute('aria-label'), closingSentence)
  if (!reduced) assert.ok(steps2 > 50, 'erased and typed a character at a time')
  // It is given the same hold as every stage before it, then erased away.
  const read = f.now
  let clearedAt = null
  while (f.handoff.enters === 0) {
    assert.ok(await f.step(), 'the closing sentence erases and hands over')
    if (clearedAt === null && f.sentence.textContent !== closingSentence) clearedAt = f.now
    assert.ok(steps2++ < 1600)
  }
  assert.ok(clearedAt - read >= 2000, 'the screen is left up for the same 2000ms before it clears')
  assert.equal(f.sentence.textContent, '')
  assert.equal(f.handoff.enters, 1)
  assert.equal(f.handoff.preloads, 1)
  assert.ok(f.handoff.enteredAt >= read + 2000)
  assert.ok(f.handoff.enteredAt > held + 2000)
  assert.equal(f.selections.length, 4, 'nothing re-selects on the way out')
  while (await f.step()) assert.ok(steps2++ < 1600)
  assert.equal(f.handoff.enters, 1, 'the handover happens exactly once')
})

test('memberships use existing coordinates, retain both concepts, and span distinct regions', () => {
  const source = readFileSync(new URL('../src/knowledge/KnowledgeScene.jsx', import.meta.url), 'utf8')
  const questions = runInNewContext(source.match(/export const questions = (\[[\s\S]*?\n\])/)[1])
  const byId = Object.fromEntries(questions.map(q => [q.id, q.position]))
  const distance = (a, b) => Math.hypot(...byId[a].map((v, index) => v - byId[b][index]))
  assert.ok(distance('Q1', 'Q2') < .3)
  assert.ok(conceptStages[2].ids.includes('Q1') && conceptStages[2].ids.includes('Q2'))
  for (const stage of conceptStages) for (const id of stage.ids) assert.ok(byId[id])
  assert.ok(conceptStages[3].ids.some(a => conceptStages[3].ids.some(b => distance(a, b) > 1.5)))
  assert.ok(conceptStages[3].ids.includes('Q1') && conceptStages[3].ids.includes('Q2'))
})
