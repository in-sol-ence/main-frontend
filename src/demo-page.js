import { demo } from '../copy/demo.js'

export function initializeDemoPage(onAdvance) {
  const page = document.querySelector('#demo')
  const text = document.querySelector('#demo-typed')
  const heading = page.querySelector('[data-page-heading]')
  const volume = document.querySelector('#knowledge-volume')
  const next = document.querySelector('#demo-next')
  const sentence = demo.intro
  const coloredSentence = sentence.replace(demo.revealAfter, `<span class="text-accent">${demo.revealAfter}</span>`)
  // Also reserves the full sentence's footprint through the heading's sizing copy.
  heading.setAttribute('aria-label', sentence)
  text.dataset.fullText = sentence
  // Reserve full-sentence endings; inline phrases flow with their visible text.
  new MutationObserver(() => {
    const full = text.dataset.fullText || ''
    text.dataset.rest = full.startsWith(text.textContent) ? full.slice(text.textContent.length) : ''
  }).observe(text, { childList: true, characterData: true, subtree: true,
    attributes: true, attributeFilter: ['data-full-text'] })
  next.textContent = demo.nextButton
  const revealAt = sentence.indexOf(demo.revealAfter) + demo.revealAfter.length
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let phase = 'waiting'
  let typing

  function _reveal() {
    volume.classList.add('is-visible')
    volume.inert = false
    volume.removeAttribute('aria-hidden')
  }

  // MutationObserver runs before paint, on the exact Typed.js character update.
  const characters = new MutationObserver(() => {
    if (phase === 'typing' && text.textContent.length >= revealAt) {
      _reveal()
      characters.disconnect()
    }
  })
  characters.observe(text, { childList: true, characterData: true, subtree: true })

  function _complete() {
    _reveal()
    phase = 'ready'
    next.hidden = false
    characters.disconnect()
  }

  function _start() {
    if ((page.inert && !page.dataset.entering) || phase !== 'waiting') return
    phase = 'typing'
    navigation.disconnect()
    if (motion.matches) {
      text.innerHTML = coloredSentence
      _complete()
      return
    }
    typing = new window.Typed(text, {
      strings: [coloredSentence], typeSpeed: 65, backSpeed: 28, startDelay: 0,
      smartBackspace: false, loop: false, showCursor: false,
      autoInsertCss: false, contentType: 'html', onComplete: _complete,
    })
  }
  // Prepare text while the existing wipe reveals it; interaction stays inert.
  const navigation = new MutationObserver(_start)
  navigation.observe(page, { attributes: true, attributeFilter: ['inert', 'data-entering'] })
  _start()
  page.dataset.ready = 'true'

  function _erased() {
    phase = 'empty'
    onAdvance()
  }

  next.addEventListener('click', () => {
    if (phase !== 'ready') return
    phase = 'erasing'
    next.hidden = true
    heading.removeAttribute('aria-label')
    heading.focus({ preventScroll: true })
    // Keep the sizing copy after clearing the accessible sentence.
    heading.dataset.sizingText = sentence
    if (motion.matches) {
      text.textContent = ''
      _erased()
      return
    }
    const displayed = text.textContent
    typing?.destroy()
    text.textContent = displayed
    // Typed.js natively backspaces existing content before typing its next string.
    typing = new window.Typed(text, {
      strings: [''], backSpeed: 28, startDelay: 0, smartBackspace: false,
      loop: false, showCursor: false, autoInsertCss: false, contentType: 'null',
      onComplete: _erased,
    })
  })

  motion.addEventListener('change', () => {
    if (!motion.matches || phase === 'waiting' || phase === 'empty') return
    typing?.destroy()
    if (phase === 'erasing') {
      text.textContent = ''
      _erased()
    } else {
      text.innerHTML = coloredSentence
      _complete()
    }
  })

  function _skipTyping() {
    if (page.inert) return false
    if (phase === 'typing') {
      typing?.destroy()
      text.innerHTML = coloredSentence
      _complete()
      return true
    }
    if (phase === 'erasing') {
      typing?.destroy()
      text.textContent = ''
      _erased()
      return true
    }
    return false
  }

  page.parentElement.addEventListener('click', event => {
    if (phase !== 'erasing') return
    if (event.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]')) return
    if (_skipTyping()) event.stopImmediatePropagation()
  })
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || event.repeat || event.metaKey || event.ctrlKey || event.altKey ||
        event.target.closest?.('button, a, input, textarea, select, [contenteditable="true"]')) return
    if (_skipTyping()) { event.preventDefault(); event.stopImmediatePropagation() }
  })
}
