import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import KnowledgeScene from './knowledge/KnowledgeScene.jsx'
import { initializeConceptSequence } from './concept-sequence.js'
import { initializeDemoPage } from './demo-page.js'

const volume = document.querySelector('#knowledge-volume')
const slot = document.querySelector('#knowledge-slot')
const pages = document.querySelector('#pages')
let finalePoint
function _placeVolume() {
  const parent = pages.getBoundingClientRect()
  const bounds = slot.getBoundingClientRect()
  let { left, top, width, height } = bounds
  if (finalePoint) {
    const viewportWidth = pages.clientWidth, viewportHeight = pages.clientHeight
    const label = document.querySelector('#demo .demo-heading').getBoundingClientRect()
    const landscape = viewportWidth > 760 || viewportWidth > viewportHeight
    const clear = landscape ? label.right + 24 : label.bottom + 16
    const availableWidth = landscape ? viewportWidth - clear - 16 : viewportWidth - 32
    const availableHeight = landscape ? viewportHeight - 32 : viewportHeight - clear - 16
    width = height = Math.max(0, Math.min(viewportWidth * (landscape ? .42 : .86), viewportHeight * .62, availableWidth, availableHeight))
    left = Math.max(landscape ? clear : 16, Math.min(viewportWidth - width - 16, finalePoint.x * viewportWidth - width / 2))
    top = Math.max(landscape ? 16 : clear, Math.min(viewportHeight - height - 16, finalePoint.y * viewportHeight - height / 2))
  }
  Object.assign(volume.style, {
    left: `${left - parent.left}px`, top: `${top - parent.top}px`,
    width: `${width}px`, height: `${height}px`,
  })
}
// The slot can move when text grows or the page scrolls without changing size.
const resize = new ResizeObserver(_placeVolume)
resize.observe(slot)
resize.observe(document.querySelector('.demo-heading'))
resize.observe(pages)
document.querySelector('#demo').addEventListener('scroll', _placeVolume, { passive: true })
window.addEventListener('resize', _placeVolume)
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
    finalePoint = point
    _placeVolume()
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
