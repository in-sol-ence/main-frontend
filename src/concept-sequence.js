// Illustrative memberships over existing question coordinates, not learned embeddings.
export const conceptStages = [
  { phrase: 'Integration by parts', ids: ['Q1'] },
  { phrase: 'U-substitution', ids: ['Q2'] },
  { phrase: 'Integration methods', ids: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'] },
  // Development sample: Python Random(20260922).sample(range(1, 25), 9), sorted; never randomized on render or visit.
  { phrase: "John Doe's knowledge", ids: ['Q1', 'Q2', 'Q3', 'Q4', 'Q12', 'Q17', 'Q20', 'Q22', 'Q24'] },
].map(stage => ({ ...stage, mastery: Array.from({ length: 24 }, (_, index) => Number(stage.ids.includes(`Q${index + 1}`))) }))

export function initializeConceptSequence(presentation) {
  const page = document.querySelector('#demo')
  const text = document.querySelector('#demo-typed')
  const shell = 'Here is <span id="concept-phrase"></span> represented in the embedding space.'
  let phrase
  let shellTyping
  const heading = page.querySelector('[data-page-heading]')
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let started = false
  let index = 0
  let typing
  let timer
  let revealed = false
  let emptySettled

  function _highlight() {
    if (!phrase || revealed || phrase.textContent !== conceptStages[index].phrase) return
    revealed = true
    const stage = conceptStages[index]
    heading.setAttribute('aria-label', `Here is ${stage.phrase} represented in the embedding space.`)
    presentation.update(stage.mastery).then(() => {
      if (index === conceptStages.length - 1) return
      timer = setTimeout(() => {
        index++
        _type()
      }, 2000)
    })
  }

  function _type() {
    revealed = false
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
  const characters = new MutationObserver(_highlight)
  function _ready() {
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
  // Called directly after intro deletion; no navigation, page swap, or scene mount.
  return function start() {
    if (started) return
    started = true
    emptySettled = presentation.update(Array(24).fill(0))
    heading.setAttribute('aria-label', 'Here is represented in the embedding space.')
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
