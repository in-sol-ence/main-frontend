import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line, CubicBezierLine, RoundedBox } from '@react-three/drei'
import { CARD, TIMING, branchPoint, clamp, resourcePlacements, revealAt } from './placement.js'
import ResourceContent from './ResourceContent.jsx'
import './resourceBranches.css'

// Branches grow outward from a knowledge component's existing 3D location.
// Each ends in a slightly three-dimensional rectangular card standing for one
// resource: a video segment, a lecture, an explanation, or a question.
//
// Resource segments are separate data attached to a component, not child
// knowledge components: they never enter the prerequisite graph and never
// become a layer of their own.
//
// The material language is the flat, unlit one from the spatial study: low
// opacity MeshBasicMaterial with depth written as a difference in opacity
// rather than as shading, so no light in the host scene affects a card.

const LABEL_WIDTH = 150
const LABEL_PADDING = 20
const BRANCH_SEGMENTS = 32
const ORIGIN = [0, 0, 0]

function roundedOutline(width, height, radius) {
  const shape = new THREE.Shape()
  const x = width / 2
  const y = height / 2
  const r = Math.min(radius, x, y)
  shape.moveTo(-x + r, -y)
  shape.lineTo(x - r, -y); shape.quadraticCurveTo(x, -y, x, -y + r)
  shape.lineTo(x, y - r); shape.quadraticCurveTo(x, y, x - r, y)
  shape.lineTo(-x + r, y); shape.quadraticCurveTo(-x, y, -x, y - r)
  shape.lineTo(-x, -y + r); shape.quadraticCurveTo(-x, -y, -x + r, -y)
  return shape.getPoints(44).map(point => [point.x, point.y, CARD.depth / 2 + 0.004])
}

function Fan({ componentId, resources, closing, onClosed, expandedId, focusedId, onSelect, side, reduced, tint, presence, shape }) {
  const placements = useMemo(
    () => resourcePlacements(componentId, resources, { side, ...shape }),
    [componentId, resources, side, shape],
  )
  const outline = useMemo(() => roundedOutline(CARD.width, CARD.height, CARD.radius), [])
  const cardScale = shape.cardScale ?? 1

  const cards = useRef([])
  const branches = useRef([])
  const rims = useRef([])
  const labels = useRef([])
  const scales = useRef([])
  const heights = useRef([])
  const projected = useMemo(() => new THREE.Vector3(), [])
  const world = useMemo(() => new THREE.Vector3(), [])
  const elapsed = useRef(0)
  const tip = useRef([0, 0, 0])
  const sample = useRef([0, 0, 0])
  const previousGrowth = useRef([])
  useEffect(() => { previousGrowth.current = [] }, [placements])
  const { size, camera } = useThree()

  // Reset the clock whenever the set opens or begins to close, so both
  // transitions are read from elapsed time rather than accumulated per frame.
  useEffect(() => { elapsed.current = 0 }, [componentId, closing])


  // Html keeps readable CSS-pixel type. Fit the existing 3D card to its label,
  // using camera projection rather than shrinking the text with distance.

  useFrame((state, delta) => {
    const step = Math.max(0, delta)
    elapsed.current += step
    const ease = reduced ? 1 : 1 - Math.exp(-TIMING.expand * step)
    const perUnit = size.height * camera.projectionMatrix.elements[5] / 2
    let finished = true

    placements.forEach((placement, index) => {
      const card = cards.current[index]
      const branch = branches.current[index]
      if (!card || !branch) return
      const state1 = revealAt(elapsed.current, placement, { reduced, closing })
      if (!state1.done) finished = false
      const grow = clamp(state1.grow, 0, 1)

      // Reveal a prefix of the same cubic curve. Update drei's existing
      // segment buffer only while growth changes; never allocate new meshes.
      branchPoint(placement, grow, tip.current)
      if (previousGrowth.current[index] !== grow) {
        const start = branch.geometry.attributes.instanceStart
        const end = branch.geometry.attributes.instanceEnd
        for (let segment = 0; segment < BRANCH_SEGMENTS; segment++) {
          branchPoint(placement, grow * segment / BRANCH_SEGMENTS, sample.current)
          start.setXYZ(segment, ...sample.current)
          branchPoint(placement, grow * (segment + 1) / BRANCH_SEGMENTS, sample.current)
          end.setXYZ(segment, ...sample.current)
        }
        start.data.needsUpdate = true
        previousGrowth.current[index] = grow
      }
      branch.material.opacity = (closing ? state1.reveal : grow) * presence * 0.34

      card.position.set(...(reduced ? placement.card : tip.current))
      // Cards face the reader, keeping a small fixed tilt so the thickness at
      // the edge stays visible instead of collapsing to a flat rectangle.
      card.quaternion.copy(camera.quaternion)
      card.rotateZ(placement.tilt * 0.35)
      card.rotateY(0.1 + placement.tilt * 0.5)
      card.rotateX(-0.045)

      const expanded = expandedId === placement.resource.id
      const label = labels.current[index]
      card.updateWorldMatrix(true, false)
      card.getWorldPosition(world)
      projected.copy(world).project(camera)
      const screenX = (projected.x + 1) * size.width / 2
      const screenY = (1 - projected.y) * size.height / 2
      const pixelsPerUnit = camera.isOrthographicCamera ? perUnit : perUnit / -world.applyMatrix4(camera.matrixWorldInverse).z
      // Keep the selected card centered at its own branch tip. Long content
      // scrolls inside that card, including at the edge of a phone screen.
      const availableWidth = Math.max(80, 2 * Math.min(screenX - 16, size.width - screenX - 16) - LABEL_PADDING)
      const width = Math.min(expanded ? 300 : size.width < 600 ? 120 : LABEL_WIDTH, availableWidth)
      const maxHeight = Math.max(90, Math.min(360, 2 * Math.min(screenY - 16, size.height - screenY - 16) - LABEL_PADDING))
      if (label) {
        label.style.width = width + 'px'
        label.style.maxHeight = expanded ? maxHeight + 'px' : ''
      }
      const target = (width + LABEL_PADDING) / pixelsPerUnit / CARD.width
      const targetHeight = ((label?.offsetHeight || 48) + LABEL_PADDING) / pixelsPerUnit / CARD.height
      scales.current[index] = (scales.current[index] ?? target) + (target - (scales.current[index] ?? target)) * ease
      heights.current[index] = (heights.current[index] ?? targetHeight) + (targetHeight - (heights.current[index] ?? targetHeight)) * ease
      card.scale.set(scales.current[index], heights.current[index], cardScale)
      if (Math.abs(target - scales.current[index]) > 0.002 || Math.abs(targetHeight - heights.current[index]) > 0.002) finished = false

      const shown = clamp(state1.reveal, 0, 1) * presence
      const emphasis = expanded ? 1.5 : expandedId ? 0.55 : 1
      card.material.opacity = shown * 0.17 * emphasis
      card.visible = shown > 0.004
      // The open card sits over its neighbours rather than being cut by them.
      card.renderOrder = expanded ? 3 : 1
      card.material.depthTest = !expanded
      const rim = rims.current[index]
      if (rim) {
        rim.material.opacity = shown * 0.5 * emphasis
        rim.renderOrder = expanded ? 4 : 2
        rim.material.depthTest = !expanded
      }
      if (label) {
        // drei only restacks Html when it moves, and an expanding card stays
        // put, so raise the open card's wrapper above its neighbours directly.
        const wrapper = label.parentElement?.parentElement
        if (wrapper) wrapper.style.zIndex = expanded ? '20' : '2'
        label.style.opacity = String(shown * (expanded || !expandedId ? 1 : 0.5))
        label.inert = closing || shown < 0.05
        label.style.pointerEvents = closing || shown < 0.05 ? 'none' : 'auto'
      }
    })

    if (closing && finished) onClosed()
  })

  return placements.map((placement, index) => (
    <group key={placement.resource.id}>
      <CubicBezierLine
        ref={element => { branches.current[index] = element }}
        start={ORIGIN} end={placement.card} midA={placement.controlA} midB={placement.controlB}
        segments={BRANCH_SEGMENTS} color={tint} lineWidth={1} transparent opacity={0} depthWrite={false}
        renderOrder={2}
      />
      <RoundedBox
        ref={element => { cards.current[index] = element }}
        position={reduced ? placement.card : [0, 0, 0]}
        args={[CARD.width, CARD.height, CARD.depth]} radius={CARD.radius} smoothness={3} bevelSegments={1}
        renderOrder={1}
        onClick={event => { event.stopPropagation(); onSelect(placement.resource.id) }}
        onPointerOver={event => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
      >
        {/* Unlit, so no light in the host scene reaches a card. DoubleSide is
            load-bearing: a single-sided card tilted away returns no raycast hit.
            The card writes depth and draws before its branch (renderOrder), so
            the branch disappears into the card's edge instead of crossing its text. */}
        <meshBasicMaterial color={tint} transparent opacity={0} side={THREE.DoubleSide} />
        <Line
          ref={element => { rims.current[index] = element }}
          points={outline} color={tint} lineWidth={1} transparent opacity={0} depthWrite={false}
          renderOrder={2}
        />
        <Html center zIndexRange={expandedId === placement.resource.id ? [20, 10] : [2, 0]} style={{ pointerEvents: 'none' }}>
          <div
            ref={element => { labels.current[index] = element }}
            className="resource-card-label" data-type={placement.resource.type}
            data-focused={focusedId === placement.resource.id} data-expanded={expandedId === placement.resource.id}
            style={{ width: LABEL_WIDTH, opacity: 0, '--resource-tint': tint }}
          >
            <button type="button" className="resource-card-toggle" data-resource-id={placement.resource.id}
              aria-expanded={expandedId === placement.resource.id}
              onClick={() => onSelect(placement.resource.id)}>
              <span className="resource-card-type">{placement.resource.type}</span>
              <span>{placement.resource.title}</span>
            </button>
            {expandedId === placement.resource.id && <ResourceContent resource={placement.resource} onClose={() => onSelect(placement.resource.id)} />}
          </div>
        </Html>
      </RoundedBox>
    </group>
  ))
}

// One set is alive at a time. Switching component replaces the whole fan, and
// the React key makes that a remount, so rapid clicking cannot leave a
// duplicate mesh, branch, label or timer behind.
export default function ResourceBranches({
  componentId, anchor = [0, 0, 0], resources = [], open = false,
  expandedId = null, focusedId = null, onSelect = () => {}, side = 1, reduced = false,
  tint = '#b9c6bd', presence = 1, shape: shapeProp,
}) {
  const [live, setLive] = useState(null)
  const [closing, setClosing] = useState(false)
  const latest = useRef({ resources, shape: shapeProp })
  latest.current = { resources, shape: shapeProp }

  const shape = useMemo(() => shapeProp ?? {}, [shapeProp])

  useEffect(() => {
    if (open && resources.length) { setLive({ componentId, resources: latest.current.resources }); setClosing(false) }
    else if (!open) setClosing(true)
    // Resources are read through a ref so a fresh array literal from the caller
    // cannot retrigger this and rebuild the fan underneath the reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, componentId])

  if (!live) return null
  return (
    <group position={anchor}>
      <Fan
        key={live.componentId}
        componentId={live.componentId}
        resources={live.resources}
        closing={closing}
        onClosed={() => { setLive(null); setClosing(false) }}
        expandedId={expandedId}
        focusedId={focusedId}
        onSelect={onSelect}
        side={side}
        reduced={reduced}
        tint={tint}
        presence={presence}
        shape={shape}
      />
    </group>
  )
}
