import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as THREE from 'three'
import { MarchingCubes } from 'three-stdlib'

const scene = readFileSync(new URL('../src/knowledge/KnowledgeScene.jsx', import.meta.url), 'utf8')
const entry = readFileSync(new URL('../src/demo-entry.jsx', import.meta.url), 'utf8')
const questions = runInNewContext(scene.match(/export const questions = (\[[\s\S]*?\n\])/)[1])
const mastery = runInNewContext(entry.match(/useState\((\[[^\]]+\])/)[1])

test('configured field produces finite geometry above the grid and inside initial camera framing', () => {
  assert.equal(questions.length, 24)
  assert.deepEqual(Array.from(mastery, (value, index) => value ? questions[index].id : null).filter(Boolean),
    ['Q1', 'Q2', 'Q3', 'Q4', 'Q9', 'Q10', 'Q11'])
  const radius = Number(entry.match(/radius=\{(\d+)\}/)[1])
  const isolation = Number(entry.match(/isolation=\{(\d+)\}/)[1])
  assert.equal(radius, 8)
  assert.equal(isolation, 45)
  assert.match(entry, /color: '#FF1414', roughness: 0.42, metalness: 0.25/)
  assert.match(entry, /autoRotate=\{false\}/)
  const material = new THREE.MeshPhysicalMaterial()
  const volume = new MarchingCubes(48, material, false, false, 30000)
  volume.isolation = isolation
  questions.forEach(({ position: [x, y, z] }, index) => {
    if (mastery[index]) volume.addBall(.5 + x * .5, .5 + y * .5, .5 + z * .5, .72, radius)
  })
  volume.update()
  assert.ok(volume.count > 0 && volume.count < 90000)
  const vertices = volume.geometry.attributes.position
  const points = questions.map(({ position }) => new THREE.Vector3(...position))
  for (let index = 0; index < volume.count; index++) {
    const point = new THREE.Vector3().fromBufferAttribute(vertices, index)
    assert.ok(point.toArray().every(Number.isFinite))
    assert.ok(point.y > -1.05, 'floor grid must be below the rendered volume')
    points.push(point)
  }
  for (const x of [-1.2, 1.2]) for (const z of [-1.2, 1.2]) points.push(new THREE.Vector3(x, -1.05, z))
  for (const position of [[1.27, 0, 0], [0, 1.27, 0], [0, 0, 1.27]]) points.push(new THREE.Vector3(...position))
  const position = runInNewContext(scene.match(/position: (\[3\.2[^\]]+\])/)[1])
  const target = runInNewContext(scene.match(/orbitTarget = useMemo\(\(\) => (\[[^\]]+\])/)[1])
  for (const aspect of [.9, 1.08]) {
    const camera = new THREE.PerspectiveCamera(42, aspect, .1, 100)
    camera.position.set(...position)
    camera.lookAt(...target)
    camera.updateMatrixWorld()
    for (const point of points) {
      const projected = point.clone().project(camera)
      assert.ok(Math.abs(projected.x) < .95 && Math.abs(projected.y) < .95, 'scene fits with a margin')
    }
  }
  volume.geometry.dispose()
  material.dispose()
})

test('the original field shrinks to empty and grows each mastery stage without replacement', async () => {
  const { conceptStages } = await import('../src/concept-sequence.js')
  const field = scene.slice(scene.indexOf('function KnowledgeField'), scene.indexOf('function Scene')).trim()
  const { createHash } = await import('node:crypto')
  assert.equal(createHash('sha256').update(field).digest('hex'),
    'd640d96b034d5fac6807a5dff00b47a8c469afd3bfd310fd25108cc8eaf6d020',
    'the original volume generation implementation must remain unchanged')
  const volume = new MarchingCubes(48, new THREE.MeshPhysicalMaterial(), false, false, 30000)
  volume.isolation = 45
  const strengths = { current: Array.from(mastery) }
  let frame
  const context = {
    THREE, questions, useRef: () => ({ current: volume }), useMemo: fn => fn(),
    useFrame: fn => { frame = fn },
    props: { mastery: Array.from(mastery), radius: 8, isolation: 45, strengths,
      surface: { color: '#FF1414', roughness: .42, metalness: .25 } },
  }
  // Run the original useFrame callback with the real MarchingCubes engine.
  const withoutJSX = field.slice(0, field.indexOf('  return <MarchingCubes')) + '  return null;\n}'
  const material = volume.material
  for (const vector of [Array(24).fill(0), ...conceptStages.map(stage => stage.mastery)]) {
    context.props.mastery = vector
    runInNewContext(withoutJSX + '\nKnowledgeField(props)', context)
    const previous = [...strengths.current]
    volume.reset()
    frame(null, 1 / 60)
    assert.ok(strengths.current.some((v, i) => v !== previous[i]), 'first frame begins the existing smooth change')
    assert.ok(strengths.current.some((v, i) => Math.abs(v - vector[i]) > .004), 'no instant snap to the next vector')
    for (let i = 0; i < 150; i++) {
      volume.reset()
      frame(null, 1 / 60)
      volume.update()
    }
    assert.ok(strengths.current.every((v, i) => Math.abs(v - vector[i]) < .004))
    assert.equal(volume.count > 0, vector.some(Boolean))
  }
  volume.geometry.dispose()
  material.dispose()
})
