import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import KnowledgeScene from './knowledge/KnowledgeScene.jsx'
import { initializeConceptSequence } from './concept-sequence.js'
import { initializeDemoPage } from './demo-page.js'

const volume = document.querySelector('#knowledge-volume')
const slot = document.querySelector('#knowledge-slot')
const pages = document.querySelector('#pages')
const resize = new ResizeObserver(() => {
  const bounds = slot.getBoundingClientRect()
  const parent = pages.getBoundingClientRect()
  Object.assign(volume.style, {
    left: `${bounds.left - parent.left}px`, top: `${bounds.top - parent.top}px`,
    width: `${bounds.width}px`, height: `${bounds.height}px`,
  })
})
resize.observe(slot)
// React owns the single current mastery vector. Updating it preserves the Canvas.
function _KnowledgeExperience() {
  const [mastery, setMastery] = useState([1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  const pending = useRef(null)
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
    initializeDemoPage(initializeConceptSequence({ update }))
  }, [update])
  return <KnowledgeScene
    mastery={mastery}
    onMasterySettled={settled}
    radius={8}
    isolation={45}
    surface={{ color: '#FF1414', roughness: 0.42, metalness: 0.25 }}
    autoRotate={false}
    background="#000000"
  />
}
createRoot(volume).render(<_KnowledgeExperience />)
