import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import ResourceBranches from './ResourceBranches.jsx'
import { resourceLibrary } from './resourceData.js'

// A deliberately small host so the branch animation can be seen and driven on
// its own. It mirrors how a real knowledge layer would mount the component.

const COMPONENTS = [
  { id: 'calculus-6-1', title: 'Motion', note: 'Calculus / Applications / position, velocity, acceleration', side: 1 },
  { id: 'calculus-3-0-1', title: 'Tangent Slopes', note: 'Calculus / Difference Quotients / the limiting slope at a point', side: -1 },
]

const TINT = '#b9c6bd'
const ANCHOR = [0, -0.25, 0]

function Ribbon() {
  const points = useMemo(() => Array.from({ length: 121 }, (_, i) => {
    const t = (i / 120) * 2 - 1
    return [t * 9, -1.55 + Math.sin(t * 1.5) * 0.12, Math.cos(t * 1.1) * 1.2 - 1.2]
  }), [])
  return <Line points={points} color={TINT} lineWidth={1} transparent opacity={0.16} depthWrite={false} />
}

function Component({ component, open, onToggle }) {
  return <>
    <Line points={[[0, -1.25, -0.35], ANCHOR]} color={TINT} lineWidth={1} transparent opacity={0.3} depthWrite={false} />
    <mesh position={ANCHOR} onClick={event => { event.stopPropagation(); onToggle() }}
      onPointerOver={event => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = '' }}>
      <sphereGeometry args={[0.085, 16, 12]} />
      <meshBasicMaterial color={TINT} transparent opacity={open ? 0.6 : 0.85} depthWrite={false} />
    </mesh>
    <Html position={ANCHOR} center={false} zIndexRange={[1, 0]}
      style={{ transform: 'translate(-50%, 18px)', pointerEvents: 'none', userSelect: 'none', width: 'max-content', textAlign: 'center' }}>
      <div style={{ font: '300 22px/1.13 "Segoe UI", Arial, sans-serif', letterSpacing: '-.018em', color: '#e1e0d9' }}>
        <button type="button" className="resource-kc-toggle" aria-expanded={open} onClick={onToggle}>{component.title}</button>
        <small style={{ display: 'block', marginTop: 6, font: '400 10px/1.5 "Segoe UI", Arial, sans-serif', letterSpacing: '.035em', color: '#a9b0a6' }}>
          {component.note}
        </small>
      </div>
    </Html>
  </>
}

// A narrow viewport separates the cards by radius and enlarges them, so type
// keeps a readable size instead of shrinking to fit a phone.
function useFanShape() {
  const { size } = useThree()
  const portrait = size.width / size.height < 1
  return useMemo(() => (portrait
    ? { arc: 0.20, vertical: 1, cardScale: 1.75, ladder: true }
    : { cardScale: 1.4 }), [portrait])
}

function Stage({ active, open, expandedId, focusedId, onToggle, onSelect, reduced }) {
  const { camera, size } = useThree()
  const shape = useFanShape()
  const component = COMPONENTS[active]
  useEffect(() => {
    const portrait = size.width / size.height < 1
    camera.fov = portrait ? 67 : 53
    camera.position.set(0, portrait ? 2.6 : 0.75, portrait ? 10.6 : 6.8)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])
  return <>
    <color attach="background" args={['#0b0e10']} />
    <Ribbon />
    <Component component={component} open={open} onToggle={onToggle} />
    <ResourceBranches
      componentId={component.id}
      anchor={ANCHOR}
      resources={resourceLibrary[component.id]}
      open={open}
      expandedId={expandedId}
      focusedId={focusedId}
      onSelect={onSelect}
      side={component.side}
      reduced={reduced}
      tint={TINT}
      shape={shape}
    />
  </>
}

export default function ResourceBranchesDemo() {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [cursor, setCursor] = useState(-1)
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [status, setStatus] = useState('Activate the component to grow its resource segments.')
  const surface = useRef(null)

  const segments = resourceLibrary[COMPONENTS[active].id]

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const listen = event => setReduced(event.matches)
    query.addEventListener('change', listen)
    return () => query.removeEventListener('change', listen)
  }, [])

  useEffect(() => {
    if (open && cursor >= 0) {
      const buttons = surface.current?.querySelectorAll('[data-resource-id]')
      const button = [...(buttons || [])].find(item => item.dataset.resourceId === segments[cursor]?.id)
      button?.focus({ preventScroll: true })
    }
  }, [cursor, open, segments, expandedId])

  const describe = useCallback(list => list.map(item => `${item.type}, ${item.title}`).join('. '), [])

  const toggle = useCallback(() => {
    setCursor(-1); setExpandedId(null)
    setOpen(previous => {
      setStatus(previous
        ? `Collapsed the resource segments for ${COMPONENTS[active].title}.`
        : `${segments.length} resource segments for ${COMPONENTS[active].title}: ${describe(segments)}.`)
      return !previous
    })
  }, [active, segments, describe])

  const select = useCallback(id => {
    setCursor(segments.findIndex(item => item.id === id))
    setExpandedId(previous => {
      const next = previous === id ? null : id
      const resource = segments.find(item => item.id === id)
      setStatus(next
        ? `Expanded ${resource.type}: ${resource.title}. ${resource.body || resource.summary}`
        : `Collapsed ${resource.title}.`)
      return next
    })
  }, [segments])

  const switchComponent = useCallback(() => {
    surface.current?.focus({ preventScroll: true })
    const next = (active + 1) % COMPONENTS.length
    const list = resourceLibrary[COMPONENTS[next].id]
    setActive(next); setExpandedId(null); setCursor(-1); setOpen(true)
    setStatus(`${COMPONENTS[next].title}. ${list.length} resource segments: ${describe(list)}.`)
  }, [active, describe])

  const onKeyDown = useCallback(event => {
    // Native controls own Enter/Space. Do not toggle the fan when activating
    // a link, answer choice, or close button inside a resource.
    if (event.target.closest('input, textarea, select, [contenteditable=true]')) return
    if (event.target.closest('button, a') && ['Enter', 'Space'].includes(event.code)) return
    if (['ArrowRight', 'ArrowLeft'].includes(event.code) && open) {
      event.preventDefault()
      const step = event.code === 'ArrowRight' ? 1 : -1
      const next = cursor < 0 ? (step > 0 ? 0 : segments.length - 1) : (cursor + step + segments.length) % segments.length
      setCursor(next)
      setStatus(`${segments[next].type}, ${segments[next].title}. ${segments[next].summary}`)
      return
    }
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault()
      if (open && cursor >= 0) select(segments[cursor].id)
      else toggle()
      return
    }
    if (event.code === 'Escape' && open) { event.preventDefault(); surface.current?.querySelector('.resource-kc-toggle')?.focus({ preventScroll: true }); setOpen(false); setExpandedId(null); setCursor(-1); setStatus('Collapsed.') }
    if (event.code === 'KeyM') { event.preventDefault(); switchComponent() }
    if (event.code === 'KeyR') { event.preventDefault(); setReduced(value => !value); setStatus(`Reduced motion ${reduced ? 'off' : 'on'}.`) }
  }, [open, cursor, segments, select, toggle, switchComponent, reduced])

  return (
    <div ref={surface} tabIndex={0} onKeyDown={onKeyDown} role="application"
      aria-label="A knowledge component in space. Activate it to grow its resource segments."
      data-open={open ? COMPONENTS[active].id : ''} data-expanded={expandedId || ''}
      data-cards={open ? segments.length : 0} data-reduced={String(reduced)}
      style={{ position: 'fixed', inset: 0, outline: 'none',
        background: 'radial-gradient(ellipse at 57% 40%, #1b1e20, #0b0e10 75%)' }}>
      <Canvas camera={{ position: [0, 0.75, 6.8], fov: 53 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <Stage active={active} open={open} expandedId={expandedId} focusedId={segments[cursor]?.id} onToggle={toggle} onSelect={select} reduced={reduced} />
      </Canvas>
      <p style={{ position: 'absolute', left: 22, bottom: 20, maxWidth: 340, margin: 0, color: '#8d938c',
        font: '400 11px/1.7 "Segoe UI", Arial, sans-serif', letterSpacing: '.02em', pointerEvents: 'none' }}>
        <b style={{ color: '#c3c8bd', fontWeight: 400 }}>Click the component</b> to grow its resource segments, click it again to collapse.
        Click a card to expand it in place.<br />
        <b style={{ color: '#c3c8bd', fontWeight: 400 }}>Arrow keys</b> move between cards,
        <b style={{ color: '#c3c8bd', fontWeight: 400 }}> Enter</b> expands,
        <b style={{ color: '#c3c8bd', fontWeight: 400 }}> Escape</b> collapses.<br />
        <b style={{ color: '#c3c8bd', fontWeight: 400 }}>M</b> switches component &middot;
        <b style={{ color: '#c3c8bd', fontWeight: 400 }}> R</b> toggles reduced motion.
      </p>
      <div role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
        {status}
      </div>
    </div>
  )
}
