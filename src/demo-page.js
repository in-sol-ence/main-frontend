export function initializeDemoPage(onAdvance) {
  const page = document.querySelector('#demo')
  const text = document.querySelector('#demo-typed')
  const heading = page.querySelector('[data-page-heading]')
  const volume = document.querySelector('#knowledge-volume')
  const next = document.querySelector('#demo-next')
  const sentence = heading.getAttribute('aria-label')
  const revealAt = sentence.indexOf('three dimensions') + 'three dimensions'.length
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
    if (page.inert || phase !== 'waiting') return
    phase = 'typing'
    navigation.disconnect()
    if (motion.matches) {
      text.textContent = sentence
      _complete()
      return
    }
    typing = new window.Typed(text, {
      strings: [sentence], typeSpeed: 65, backSpeed: 28, startDelay: 0,
      smartBackspace: false, loop: false, showCursor: false,
      autoInsertCss: false, contentType: 'null', onComplete: _complete,
    })
  }
  // Observe the existing navigation's page activation without changing it.
  const navigation = new MutationObserver(_start)
  navigation.observe(page, { attributes: true, attributeFilter: ['inert'] })
  _start()

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
      text.textContent = sentence
      _complete()
    }
  })
}
