import { createSpatialHandoff } from './spatial-handoff.js'
import { demo } from '../copy/demo.js'

// Illustrative memberships over existing question coordinates, not learned
// embeddings. Their phrases are copy/demo.js `stages`, in the same order.
const _stageIds = [
  ['Q1'],
  ['Q2'],
  ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
  // Development sample: Python Random(20260922).sample(range(1, 25), 9), sorted; never randomized on render or visit.
  ['Q1', 'Q2', 'Q3', 'Q4', 'Q12', 'Q17', 'Q20', 'Q22', 'Q24'],
]
export const conceptStages = _stageIds.map((ids, index) => ({
  phrase: demo.stages[index], ids,
  mastery: Array.from({ length: 24 }, (_, question) => Number(ids.includes(`Q${question + 1}`))),
}))

// One more screen in the same voice, between the learner's space and his journey.
export const closingSentence = demo.closing

// Where the journey leaves John Doe: his starting knowledge plus the nearby
// clusters the demonstration covered. Illustrative, like every stage above.
export const finaleStage = (ids => ({ ids, mastery: Array.from({ length: 24 }, (_, question) => Number(ids.includes(`Q${question + 1}`))) }))(
  ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q17', 'Q20', 'Q22', 'Q24'])

export function initializeConceptSequence(presentation, handoff = createSpatialHandoff()) {
  const page = document.querySelector('#demo')
  const text = document.querySelector('#demo-typed')
  const [before, after] = demo.conceptSentence.split('{phrase}')
  const _escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const shell = `${_escape(before)}<span id="concept-phrase"></span>${_escape(after)}`
  const coloredClosing = closingSentence.replace(demo.closingEmphasis, `<span class="text-accent">${_escape(demo.closingEmphasis)}</span>`)
  const coloredFinale = demo.finale.replace(demo.finaleEmphasis, `<span class="text-accent">${_escape(demo.finaleEmphasis)}</span>`)
  let phrase
  let shellTyping
  const heading = page.querySelector('[data-page-heading]')
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let started = false
  let phase = 'idle'
  let index = 0
  let typing
  let timer
  let revealed = false
  let emptySettled

  function _highlight() {
    if (!phrase || revealed || phrase.textContent !== conceptStages[index].phrase) return
    revealed = true
    phase = 'settling'
    const stage = conceptStages[index]
    heading.setAttribute('aria-label', `${before}${stage.phrase}${after}`)
    presentation.update(stage.mastery).then(() => {
      // The last selection holds exactly as long as every other stage, then the
      // same page hands this learner's space to the existing spatial journey.
      timer = setTimeout(() => {
        if (index === conceptStages.length - 1) {
          _closing()
          return
        }
        index++
        _type()
      }, 2000)
    })
  }

  function _type() {
    revealed = false
    phase = 'stage'
    const previous = phrase.textContent
    typing?.destroy()
    phrase.textContent = previous
    if (motion.matches) {
      phrase.textContent = conceptStages[index].phrase
      _highlight()
      return
    }
    // Typed.js erases the previous contents of this span before its next string.
    typing = new window.Typed(phrase, {
      strings: [conceptStages[index].phrase], typeSpeed: 65, backSpeed: 28,
      startDelay: 0, smartBackspace: false, loop: false, showCursor: false,
      autoInsertCss: false, contentType: 'null', onComplete: _highlight,
    })
  }
  // The existing full-sentence erase, unchanged from the one Next already runs.
  function _erase(done) {
    phase = 'erasing'
    if (motion.matches) {
      text.textContent = ''
      done()
      return
    }
    const displayed = text.textContent
    typing?.destroy()
    text.textContent = displayed
    typing = new window.Typed(text, {
      strings: [''], backSpeed: 28, startDelay: 0, smartBackspace: false,
      loop: false, showCursor: false, autoInsertCss: false, contentType: 'null',
      onComplete: done,
    })
  }

  // The same span, the same typing speed, and the same stage hold as every
  // screen before it, so this reads as one continuous sequence rather than a
  // new section. Only then does the page hand over.
  function _read() { phase = 'holding'; timer = setTimeout(_leave, 2000) }

  function _closing() {
    characters.disconnect()
    _erase(() => {
      phase = 'closing'
      heading.setAttribute('aria-label', closingSentence)
      if (motion.matches) {
        text.innerHTML = coloredClosing
        _read()
        return
      }
      typing?.destroy()
      typing = new window.Typed(text, {
        strings: [coloredClosing], typeSpeed: 65, startDelay: 0, smartBackspace: false,
        loop: false, showCursor: false, autoInsertCss: false, contentType: 'html',
        onComplete: _read,
      })
    })
  }

  function _leave() {
    _erase(() => {
      phase = 'handed-off'
      heading.removeAttribute('aria-label')
      handoff.onFinale?.(_finale)
      handoff.enter()
    })
  }

  // At the end of the path, where its line vanishes, the volume the journey
  // began with appears in the same space, then grows while the same span types
  // what it now shows.
  function _finale(point = { x: .5, y: .5 }) {
    phase = 'finale-wait'
    presentation.anchor?.(point)
    heading.setAttribute('aria-label', demo.finale)
    timer = setTimeout(() => {
      phase = 'finale'
      presentation.update(finaleStage.mastery)
      if (motion.matches) { text.innerHTML = coloredFinale; _finish(); return }
      typing?.destroy()
      typing = new window.Typed(text, {
        strings: [coloredFinale], typeSpeed: 65, startDelay: 0, smartBackspace: false,
        loop: false, showCursor: false, autoInsertCss: false, contentType: 'html',
        onComplete: _finish,
      })
    }, 1200)
  }
  function _finish() {
    phase = 'done'
    const link = document.querySelector('#finale-learn')
    if (link) link.hidden = false
  }
  const characters = new MutationObserver(_highlight)
  function _ready() {
    phase = 'waiting-stage'
    phrase = text.querySelector('#concept-phrase')
    characters.observe(phrase, { childList: true, characterData: true, subtree: true })
    emptySettled.then(() => { timer = setTimeout(_type, 700) })
  }
  motion.addEventListener('change', () => {
    if (!motion.matches || !started || revealed) return
    clearTimeout(timer)
    if (!phrase) {
      shellTyping?.destroy()
      text.innerHTML = shell
      _ready()
      return
    }
    typing?.destroy()
    phrase.textContent = conceptStages[index].phrase
    _highlight()
  })

  function _skipTyping() {
    if (!started || (page.inert && !document.body.classList.contains('is-finale'))) return false
    if (phase === 'shell') {
      shellTyping?.destroy()
      text.innerHTML = shell
      _ready()
    } else if (phase === 'stage') {
      typing?.destroy()
      phrase.textContent = conceptStages[index].phrase
      _highlight()
    } else if (phase === 'closing') {
      typing?.destroy()
      text.innerHTML = coloredClosing
      _read()
    } else if (phase === 'finale') {
      typing?.destroy()
      text.innerHTML = coloredFinale
      _finish()
    } else return false
    return true
  }

  page.addEventListener('click', event => {
    if (event.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]')) return
    if (_skipTyping()) event.stopImmediatePropagation()
  })
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || event.repeat || event.metaKey || event.ctrlKey || event.altKey ||
        event.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]')) return
    if (_skipTyping()) { event.preventDefault(); event.stopImmediatePropagation() }
  })
  // Called directly after intro deletion; no navigation, page swap, or scene mount.
  return function start() {
    if (started) return
    started = true
    phase = 'shell'
    handoff.preload()
    emptySettled = presentation.update(Array(24).fill(0))
    heading.setAttribute('aria-label', `${before.trimEnd()} ${after.trimStart()}`)
    if (motion.matches) {
      text.innerHTML = shell
      _ready()
      return
    }
    shellTyping = new window.Typed(text, {
      strings: [shell], typeSpeed: 65, startDelay: 0, loop: false,
      showCursor: false, autoInsertCss: false, contentType: 'html', onComplete: _ready,
    })
  }
}
