import test from 'node:test'
import assert from 'node:assert/strict'
import { resourcePlacements, revealAt, openDuration, branchPoint } from '../src/resource-placement.js'
import { motionSegments } from '../src/resource-library.js'

test('reduced motion holds geometry throughout opening and closing', () => {
  const p = resourcePlacements('motion', motionSegments)[0]
  for (const closing of [false, true]) {
    for (const elapsed of [0, .01, .1, .22, 1]) {
      assert.equal(revealAt(elapsed, p, { reduced: true, closing }).grow, 1)
    }
    assert.equal(revealAt(.22, p, { reduced: true, closing }).done, true)
  }
})

test('each S bracket changes bend direction and joins the existing KC to its resource', () => {
  for (const p of resourcePlacements('motion', motionSegments)) {
    // Signed lateral distance from the straight KC-to-resource chord switches
    // sides at the two control points, giving the cubic its inflection.
    const a = p.controlA[0] * p.card[1] - p.controlA[1] * p.card[0]
    const b = p.controlB[0] * p.card[1] - p.controlB[1] * p.card[0]
    assert.ok(a * b < 0)
  }
})

test('seeded placement and time-based stagger are stable on reopen', () => {
  const placements = resourcePlacements('motion', motionSegments)
  assert.deepEqual(placements, resourcePlacements('motion', [...motionSegments]))
  assert.ok(revealAt(.5, placements[0]).reveal > revealAt(.5, placements[4]).reveal)
  for (const p of placements) {
    assert.ok(branchPoint(p, 0).every(value => value === 0))
    assert.deepEqual(branchPoint(p, 1), p.card)
    assert.equal(revealAt(openDuration(5), p).done, true)
  }
})
