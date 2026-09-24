import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import KnowledgeScene from './knowledge/KnowledgeScene.jsx'
import { initializeConceptSequence } from './concept-sequence.js'
import { initializeDemoPage } from './demo-page.js'

const volume = document.querySelector('#knowledge-volume')
const slot = document.querySelector('#knowledge-slot')
const pages = document.querySelector('#pages')
const _placeVolume = () => {
  // Once the volume stands at the end of the spatial path, the slot no longer places it.
  if (volume.dataset.anchored) return
  const bounds = slot.getBoundingClientRect()
  const parent = pages.getBoundingClientRect()
  Object.assign(volume.style, {
    left: `${bounds.left - parent.left}px`, top: `${bounds.top - parent.top}px`,
    width: `${bounds.width}px`, height: `${bounds.height}px`,
  })
}
const resize = new ResizeObserver(_placeVolume)
resize.observe(slot)
resize.observe(document.querySelector('.demo-intro'))
resize.observe(pages)
document.querySelector('#demo').addEventListener('scroll', _placeVolume, { passive: true })
// React owns the single current mastery vector. Updating it preserves the Canvas.
function _KnowledgeExperience() {
  const [mastery, setMastery] = useState([1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  const pending = useRef(null)
  const [background, setBackground] = useState('#000000')
  // The same persistent volume, moved to where the journey's path vanishes and
  // shown transparent over it. Nothing is remounted; only placement changes.
  const anchor = useCallback(point => {
    setBackground(null)
    volume.dataset.anchored = 'true'
    volume.classList.remove('is-visible')
    // Centred on the path's vanishing tip, but never over the label that
    // types beside it: beside it on wide screens, below it on narrow ones.
    const _place = () => {
      const label = document.querySelector('#demo .demo-heading').getBoundingClientRect()
      let size = Math.min(innerWidth * .42, innerHeight * .62)
      let left = point.x * innerWidth - size / 2, top = point.y * innerHeight - size / 2
      if (innerWidth > 760) {
        const clear = label.right + 24
        if (left < clear) { left = clear; size = Math.min(size, innerWidth - clear - 16) }
      } else top = Math.max(top, label.bottom + 16)
      left = Math.max(0, Math.min(innerWidth - size, left))
      top = Math.max(0, Math.min(innerHeight - size, top))
      Object.assign(volume.style, { left: `${left}px`, top: `${top}px`, width: `${size}px`, height: `${size}px` })
    }
    _place()
    window.addEventListener('resize', _place)
    pages.inert = false
    document.body.classList.add('is-finale')
    requestAnimationFrame(() => requestAnimationFrame(() => volume.classList.add('is-visible')))
  }, [])
  const update = useCallback(vector => new Promise(resolve => {
    pending.current = { vector, resolve }
    setMastery(vector)
  }), [])
  const settled = useCallback(vector => {
    // A frame from the previous React commit must not complete the next stage.
    if (pending.current?.vector !== vector) return
    const { resolve } = pending.current
    pending.current = null
    resolve()
  }, [])
  useEffect(() => {
    initializeDemoPage(initializeConceptSequence({ update, anchor }))
  }, [update, anchor])
  return <KnowledgeScene
    mastery={mastery}
    onMasterySettled={settled}
    radius={8}
    isolation={45}
    surface={{ color: '#FF1414', roughness: 0.42, metalness: 0.25 }}
    autoRotate={false}
    background={background}
  />
}
createRoot(volume).render(<_KnowledgeExperience />)
