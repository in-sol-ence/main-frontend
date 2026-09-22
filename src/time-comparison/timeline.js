import { gsap } from 'gsap'

// The one controller for the whole time comparison. React owns only the
// logical coefficient (null, 1..10); every visual value is tweened here.

export const COUNT_END = 10

// Hold before each next integer: slow, accelerating, fast cruise, then
// decelerating into 10 -- a trapezoidal speed profile, one beat per integer.
export const COUNT_GAPS_MS = [380, 290, 220, 160, 125, 125, 155, 210, 320]

// Focus mode dims the background without hiding it; the lines stay visible.
export const FOCUS = { backgroundOpacity: 0.45, dimmerOpacity: 0.3 }

// Seconds after the 1 has materialized at which each integer appears.
export function countBeats(gaps = COUNT_GAPS_MS) {
  return gaps.reduce((beats, gap, index) => [
    ...beats, { value: index + 2, at: beats[index].at + gap / 1000 },
  ], [{ value: 1, at: 0 }])
}

// Coefficient slot width in em: closed for N, then one tabular digit per numeral.
export function slotWidth(value, digitEm) {
  return value == null ? 0 : String(value).length * digitEm
}

export function buildTimeComparisonTimeline({ el, digitEm, reduced = false, paused = false, setCoefficient, onPhase }) {
  const tl = gsap.timeline({ paused, defaults: { ease: 'power2.out' }, onComplete: () => onPhase('complete') })
  const motion = reduced ? _still : vars => vars

  tl.call(setCoefficient, [null], 0)
  _phase(tl, onPhase, 'focus', 0)
  tl.to(el.background, { opacity: FOCUS.backgroundOpacity, duration: 0.6, ease: 'power1.inOut' }, 0)
    .to(el.dimmer, { opacity: FOCUS.dimmerOpacity, duration: 0.6, ease: 'power1.inOut' }, 0)

  // The equation emerges from the interface, then the explanation joins it.
  tl.fromTo(el.equation, motion({ autoAlpha: 0, scale: 0.92, y: 8 }),
    motion({ autoAlpha: 1, scale: 1, y: 0, duration: 0.75, ease: 'power3.out' }), 0.15)
  _phase(tl, onPhase, 'skatebored', 0.55)
  tl.fromTo(el.caption, motion({ autoAlpha: 0, y: 8 }), motion({ autoAlpha: 1, y: 0, duration: 0.55 }), 0.55)

  // Hold both lines, then withdraw only the explanation; focus mode stays on.
  tl.addLabel('removeMessage', '+=0.8')
  _phase(tl, onPhase, 'removeMessage', 'removeMessage')
  tl.to(el.caption, motion({ autoAlpha: 0, y: 6, duration: 0.35, ease: 'power1.in' }), 'removeMessage')

  if (reduced) _crossfadeToEnd(tl, el, digitEm, setCoefficient, onPhase)
  else _count(tl, el, digitEm, setCoefficient, onPhase)

  // Give 10N a silent beat, then turn it into the centerpiece of the claim.
  tl.addLabel('schooling', '+=0.45')
  _phase(tl, onPhase, 'schooling', 'schooling')
  tl.fromTo(el.lead, motion({ autoAlpha: 0, y: -8 }), motion({ autoAlpha: 1, y: 0, duration: 0.75 }), 'schooling')
    .to(el.upright, { autoAlpha: 0, duration: 0.7, ease: 'power1.inOut' }, 'schooling')
    .fromTo(el.display, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, 'schooling')
    .fromTo(el.tail, motion({ autoAlpha: 0, y: 8 }), motion({ autoAlpha: 1, y: 0, duration: 0.75 }), 'schooling+=0.15')
  return tl
}

function _phase(tl, onPhase, name, position) {
  tl.call(onPhase, [name], position)
}

// Reduced motion keeps every beat but only ever changes opacity.
function _still({ scale, x, y, ...vars }) {
  return vars
}

// 1 opens its own slot beside N and pushes it right, then each integer lands on
// its scheduled beat with a small impulse. 10 widens the slot again and settles.
function _count(tl, el, digitEm, setCoefficient, onPhase) {
  tl.addLabel('insertCoefficient', '+=0.15')
  _phase(tl, onPhase, 'insertCoefficient', 'insertCoefficient')
  tl.call(setCoefficient, [1], 'insertCoefficient')
    .fromTo(el.coefficient, { width: '0em' },
      { width: `${slotWidth(1, digitEm)}em`, duration: 0.32, ease: 'power2.inOut' }, 'insertCoefficient')
    .fromTo(el.digits, { autoAlpha: 0, x: 6 }, { autoAlpha: 1, x: 0, duration: 0.32 }, 'insertCoefficient')

  tl.addLabel('counting')
  _phase(tl, onPhase, 'counting', 'counting')
  const start = tl.labels.counting
  countBeats().slice(1).forEach(({ value, at }) => {
    const position = start + at
    tl.call(setCoefficient, [value], position)
    if (slotWidth(value, digitEm) !== slotWidth(value - 1, digitEm)) {
      tl.to(el.coefficient, { width: `${slotWidth(value, digitEm)}em`, duration: 0.3 }, position)
    }
    if (value === COUNT_END) {
      _phase(tl, onPhase, 'tenN', position)
      tl.fromTo(el.digits, { opacity: 0.5, y: 3, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1.03, duration: 0.14, immediateRender: false }, position)
        .to(el.digits, { scale: 1, duration: 0.14, ease: 'power1.inOut' }, '>')
    } else {
      tl.fromTo(el.digits, { opacity: 0.5, y: 3, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.1, immediateRender: false }, position)
    }
  })
}

function _crossfadeToEnd(tl, el, digitEm, setCoefficient, onPhase) {
  tl.addLabel('tenN', '+=0.2')
  tl.to(el.upright, { autoAlpha: 0, duration: 0.3, ease: 'power1.inOut' }, 'tenN')
  _phase(tl, onPhase, 'tenN', '>')
  tl.call(setCoefficient, [COUNT_END], '<')
    .set(el.coefficient, { width: `${slotWidth(COUNT_END, digitEm)}em` }, '<')
    .set(el.digits, { autoAlpha: 1 }, '<')
    .to(el.upright, { autoAlpha: 1, duration: 0.4, ease: 'power1.inOut' })
}
