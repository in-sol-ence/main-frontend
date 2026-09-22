// Layout and timing for resource branches. Deliberately free of three and the
// DOM so it can be reasoned about and tested on its own. Ported unchanged from
// the resource-branch prototype (spatial-expansion, src/resource-branches/
// placement.js); only the shared math now comes from this study's motion.js.
import { clamp, smootherstep } from './motion.js'

//
// Placement is a pure function of the authored ids: the same component always
// fans the same way, reopening never reshuffles, and no frame rolls dice.

export const TIMING = { grow: 0.52, reveal: 0.34, fade: 0.46, stagger: 0.09, collapse: 0.3, reduced: 0.22, expand: 9 }
export const CARD = { width: 0.88, height: 0.54, depth: 0.14, radius: 0.08, expanded: 1.6, gap: 0.96, stagger: 1.3 }


const hash = id => [...String(id)].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7)
const spread = (seed, salt) => ((seed ^ (salt * 2654435761)) >>> 0) % 1009 / 1008

// A wide viewport separates cards by angle. A narrow one cannot: five card
// widths across a phone would need a radius taller than the screen. There,
// `ladder` separates them by radius instead, so the fan climbs rather than
// spreads and every card keeps a readable width.
export function fanShape(count, { arc, reach, vertical = 0.86, cardScale = 1, ladder = false } = {}) {
  const angle = arc ?? Math.min(2.05, 0.62 + 0.27 * count)
  if (ladder) {
    return { arc: angle, reach: reach ?? CARD.height * cardScale * 1.7, vertical, cardScale, rung: CARD.height * cardScale * 1.35 }
  }
  // Adjacent chord length is 2R*sin(arc/2(n-1)); solving that for R is what
  // keeps four segments and eight segments equally readable.
  const step = count > 1 ? angle / (count - 1) : 0
  const footprint = CARD.width * cardScale * CARD.gap
  const needed = count > 1 ? footprint / (2 * Math.sin(step / 2)) : CARD.height * cardScale * 2.2
  return { arc: angle, reach: reach ?? Math.max(1.35, Math.min(7, needed)), vertical, cardScale, rung: 0 }
}

export function resourcePlacements(componentId, resources, options = {}) {
  const seed = hash(componentId)
  const count = resources.length
  const { arc, reach, vertical, rung } = fanShape(count, options)
  const side = options.side ?? 1
  return resources.map((resource, index) => {
    // The wobble is small and seeded: organic, but never enough to let two
    // cards drift into each other.
    const wobble = spread(seed, index + 1)
    const fraction = count === 1 ? 0.5 : index / (count - 1)
    const angle = (fraction - 0.5) * arc
    const distance = rung
      ? (reach + index * rung) * (0.99 + 0.02 * wobble)
      : reach * (index % 2 ? CARD.stagger : 1) * (0.97 + 0.05 * wobble)
    const card = [
      Math.sin(angle) * distance * side,
      Math.cos(angle) * distance * vertical + 0.12 * wobble,
      (spread(seed, index + 41) - 0.5) * 0.34,
    ]
    // Opposed lateral offsets give every bracket a gentle S bend, including
    // the center branch. These controls remain relative to the host KC.
    const bend = 0.35 * (card[0] < 0 ? -1 : 1)
    return {
      resource,
      index,
      card,
      controlA: [card[0] * 0.25 + card[1] * bend, card[1] * 0.25 - card[0] * bend, card[2] * 0.3],
      controlB: [card[0] * 0.75 - card[1] * bend, card[1] * 0.75 + card[0] * bend, card[2] * 0.7],
      tilt: (spread(seed, index + 97) - 0.5) * 0.18,
      delay: index * TIMING.stagger,
    }
  })
}

// Read from accumulated elapsed time rather than accumulated per frame, so a
// 30 Hz and a 144 Hz client agree exactly at the same timestamp.
export function revealAt(elapsed, placement, { reduced = false, closing = false } = {}) {
  if (closing) {
    const gone = smootherstep(elapsed / (reduced ? TIMING.reduced : TIMING.collapse))
    return { grow: reduced ? 1 : 1 - gone * 0.55, reveal: 1 - gone, done: gone >= 1 }
  }
  if (reduced) {
    // The final stable layout is present from the first frame; only opacity moves.
    const shown = smootherstep(elapsed / TIMING.reduced)
    return { grow: 1, reveal: shown, done: shown >= 1 }
  }
  const local = elapsed - placement.delay
  return {
    grow: smootherstep(local / TIMING.grow),
    reveal: smootherstep((local - TIMING.reveal) / TIMING.fade),
    done: local >= TIMING.reveal + TIMING.fade,
  }
}

export const openDuration = (count, reduced = false) =>
  reduced ? TIMING.reduced : TIMING.reveal + TIMING.fade + Math.max(0, count - 1) * TIMING.stagger

// Point on the S-shaped cubic bracket from the KC to the card, at parameter t.
export function branchPoint(placement, t, out = []) {
  const inverse = 1 - t
  for (let axis = 0; axis < 3; axis++) {
    out[axis] = 3 * inverse * inverse * t * placement.controlA[axis] + 3 * inverse * t * t * placement.controlB[axis] + t * t * t * placement.card[axis]
  }
  return out
}
