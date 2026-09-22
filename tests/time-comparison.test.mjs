import test from 'node:test'
import assert from 'node:assert/strict'
import {
  COUNT_END, COUNT_GAPS_MS, FOCUS, buildTimeComparisonTimeline, countBeats, slotWidth,
} from '../src/time-comparison/timeline.js'

const DIGIT_EM = 0.56

// Plain objects stand in for the DOM nodes; GSAP tweens their properties directly.
function _run({ reduced = false } = {}) {
  const el = Object.fromEntries(['background', 'dimmer', 'equation', 'upright', 'display',
    'coefficient', 'digits', 'caption', 'lead', 'tail'].map(name => [name, { name }]))
  const phases = []
  const values = []
  const timeline = buildTimeComparisonTimeline({
    el, digitEm: DIGIT_EM, reduced, paused: true,
    setCoefficient: value => values.push(value),
    onPhase: phase => phases.push(phase),
  })
  return { el, phases, values, timeline }
}

test('count beats follow a trapezoidal speed profile from 1 to 10', () => {
  const beats = countBeats()
  assert.deepEqual(beats.map(beat => beat.value), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.equal(beats[0].at, 0)
  const gaps = beats.slice(1).map((beat, index) => beat.at - beats[index].at)
  const fastest = Math.min(...gaps)
  // Slow start, accelerating, a fast cruise, then decelerating into 10.
  assert.equal(gaps[0], Math.max(...gaps))
  assert.ok(gaps[gaps.length - 1] > 2 * fastest)
  const cruise = gaps.findIndex(gap => gap === fastest)
  for (let i = 1; i <= cruise; i++) assert.ok(gaps[i] <= gaps[i - 1])
  for (let i = gaps.lastIndexOf(fastest) + 1; i < gaps.length; i++) assert.ok(gaps[i] >= gaps[i - 1])
  assert.ok(Math.abs(beats.at(-1).at - COUNT_GAPS_MS.reduce((sum, gap) => sum + gap, 0) / 1000) < 1e-9)
})

test('coefficient slot is empty for N, one digit for 1-9, two digits for 10', () => {
  assert.equal(slotWidth(null, DIGIT_EM), 0)
  for (let value = 1; value < 10; value++) assert.equal(slotWidth(value, DIGIT_EM), DIGIT_EM)
  assert.equal(slotWidth(10, DIGIT_EM), 2 * DIGIT_EM)
})

test('one master timeline walks every phase in order and lands on 10N', () => {
  const { el, phases, values, timeline } = _run()
  timeline.progress(1)
  assert.deepEqual(phases, ['focus', 'skatebored', 'removeMessage', 'insertCoefficient',
    'counting', 'tenN', 'schooling', 'complete'])
  assert.deepEqual(values, [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  // Focus mode is never released: the background stays suppressed at the end.
  assert.equal(el.background.opacity, FOCUS.backgroundOpacity)
  assert.equal(el.dimmer.opacity, FOCUS.dimmerOpacity)
  assert.equal(Number(el.caption.autoAlpha), 0)
  assert.equal(el.coefficient.width, `${2 * DIGIT_EM}em`)
  // The display face takes over the same equation instead of repeating it.
  assert.equal(Number(el.upright.autoAlpha), 0)
  for (const name of ['display', 'lead', 'tail', 'equation']) assert.equal(Number(el[name].autoAlpha), 1)
})

test('integers land on their scheduled beats after the 1 has materialized', () => {
  const { values, timeline } = _run()
  const start = timeline.labels.counting
  assert.ok(start > timeline.labels.insertCoefficient)
  for (const { value, at } of countBeats().slice(1)) {
    timeline.time(start + at - 0.005)
    assert.equal(values.at(-1), value - 1)
    timeline.time(start + at + 0.005)
    assert.equal(values.at(-1), value)
  }
})

test('the explanation leaves before the coefficient enters', () => {
  const { el, timeline } = _run()
  timeline.time(timeline.labels.removeMessage - 0.01)
  assert.equal(Number(el.caption.autoAlpha), 1)
  timeline.time(timeline.labels.insertCoefficient)
  assert.equal(Number(el.caption.autoAlpha), 0)
  assert.equal(Number(el.equation.autoAlpha), 1)
})

test('10N holds before the schooling comparison arrives', () => {
  const { el, phases, timeline } = _run()
  timeline.time(timeline.labels.counting + countBeats().at(-1).at + 0.3)
  assert.equal(phases.at(-1), 'tenN')
  assert.equal(Number(el.lead.autoAlpha ?? 0), 0)
  assert.ok(timeline.labels.schooling - (timeline.labels.counting + countBeats().at(-1).at) >= 0.5)
})

test('reduced motion crossfades N to 10N without counting', () => {
  const { el, phases, values, timeline } = _run({ reduced: true })
  timeline.progress(1)
  assert.deepEqual(values, [null, COUNT_END])
  assert.deepEqual(phases, ['focus', 'skatebored', 'removeMessage', 'tenN', 'schooling', 'complete'])
  assert.equal(el.coefficient.width, `${2 * DIGIT_EM}em`)
  assert.equal(el.background.opacity, FOCUS.backgroundOpacity)
  // Only opacity changes; nothing scales or travels.
  for (const target of Object.values(el)) {
    assert.equal(target.scale, undefined)
    assert.equal(target.y, undefined)
    assert.equal(target.x, undefined)
  }
})
