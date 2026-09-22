import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { MarchingCubes, OrbitControls, Html } from '@react-three/drei'

export const questions = [
  { id: 'Q1', position: [-0.48, 0.30, 0.10] }, { id: 'Q2', position: [-0.30, 0.42, 0.00] },
  { id: 'Q3', position: [-0.12, 0.30, -0.06] }, { id: 'Q4', position: [-0.27, 0.12, 0.16] },
  { id: 'Q5', position: [-0.54, 0.03, -0.12] }, { id: 'Q6', position: [-0.03, 0.48, 0.21] },
  { id: 'Q7', position: [-0.70, 0.40, -0.18] }, { id: 'Q8', position: [-0.08, 0.05, 0.38] },
  { id: 'Q9', position: [0.57, -0.34, -0.32] }, { id: 'Q10', position: [0.72, -0.43, -0.16] },
  { id: 'Q11', position: [0.53, -0.58, -0.11] }, { id: 'Q12', position: [0.82, -0.16, -0.42] },
  { id: 'Q13', position: [0.36, -0.20, -0.56] }, { id: 'Q14', position: [0.12, -0.68, 0.34] },
  { id: 'Q15', position: [-0.04, -0.50, 0.55] }, { id: 'Q16', position: [-0.42, -0.22, 0.64] },
  { id: 'Q17', position: [-0.76, -0.46, 0.30] }, { id: 'Q18', position: [0.70, 0.46, 0.48] },
  { id: 'Q19', position: [0.42, 0.70, -0.25] }, { id: 'Q20', position: [-0.10, 0.76, -0.52] },
  { id: 'Q21', position: [0.09, 0.03, -0.72] }, { id: 'Q22', position: [-0.68, 0.60, 0.48] },
  { id: 'Q23', position: [0.80, 0.06, 0.16] }, { id: 'Q24', position: [0.22, -0.75, -0.48] },
]

function KnowledgeField({ mastery, radius, isolation, strengths, surface }) {
  const cubes = useRef()
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: surface.color,
    roughness: surface.roughness,
    metalness: surface.metalness,
    clearcoat: 0.7,
    clearcoatRoughness: Math.min(0.65, surface.roughness),
    transparent: false,
    opacity: 1,
    side: THREE.DoubleSide,
    depthWrite: true,
  }), [surface.color, surface.roughness, surface.metalness])

  useFrame((_, delta) => {
    // This is deliberately transient state: no React re-renders are needed per frame.
    questions.forEach((question, index) => {
      const target = mastery[index]
      strengths.current[index] = THREE.MathUtils.damp(strengths.current[index], target, 4.4, delta)
      const strength = strengths.current[index]
      if (strength > 0.004) {
        const [x, y, z] = question.position
        // MarchingCubes field coordinates are normalized from 0 to 1.
        cubes.current?.addBall(0.5 + x * 0.5, 0.5 + y * 0.5, 0.5 + z * 0.5, strength * 0.72, radius)
      }
    })
  })

  return <MarchingCubes ref={cubes} resolution={48} maxPolyCount={30000} isolation={isolation} material={material} />
}

function Scene({ mastery, radius, isolation, surface, autoRotate, background = '#07111e', onMasterySettled }) {
  const strengths = useRef(mastery.map(Number))
  const orbitTarget = useMemo(() => [0, -0.1, 0], [])
  // Observe the original damping without changing its volume-generation algorithm.
  useFrame(() => {
    if (strengths.current.every((value, index) => Math.abs(value - mastery[index]) < .004)) {
      onMasterySettled?.(mastery)
    }
  })
  return <>
    <color attach="background" args={[background]} />
    <fog attach="fog" args={[background, 3, 8]} />
    <ambientLight intensity={0.35} />
    <directionalLight position={[-3, 4, 4]} intensity={3.4} color="#ffffff" />
    <pointLight position={[-2, 3, 3]} intensity={26} color="#72efff" distance={7} />
    <pointLight position={[3, -2, 1]} intensity={18} color="#8178ff" distance={6} />
    <pointLight position={[0, 0, -3]} intensity={15} color="#ffffff" distance={5} />
    <KnowledgeField mastery={mastery} radius={radius} isolation={isolation} strengths={strengths} surface={surface} />
    {/* Same world space as question positions and the unscaled marching-cubes field. */}
    <gridHelper args={[2.4, 12, '#6b6660', '#6b6660']} position={[0, -1.05, 0]}
      material-transparent material-opacity={0.25} material-depthWrite={false} />
    {[1, -1].map(direction => (
      <axesHelper key={direction} args={[1.15]} scale={direction}
        onUpdate={axes => axes.setColors('#b98b83', '#91ab93', '#879ebc')}
        material-transparent material-opacity={0.65} material-depthWrite={false} />
    ))}
    {[
      ['X', [1.27, 0, 0], '#d5aaa2'],
      ['Y', [0, 1.27, 0], '#b5ccb7'],
      ['Z', [0, 0, 1.27], '#aec4e1'],
    ].map(([label, position, color]) => (
      <Html key={label} position={position} center zIndexRange={[1, 0]}
        style={{ color, font: '500 14px "Helvetica Neue", Helvetica, Arial, sans-serif', pointerEvents: 'none', userSelect: 'none' }}>
        {label}
      </Html>
    ))}
    <OrbitControls target={orbitTarget} enableDamping dampingFactor={0.07} minDistance={2.4} maxDistance={6} autoRotate={autoRotate} autoRotateSpeed={0.65} />
  </>
}

export default function KnowledgeScene(props) {
  const camera = useMemo(() => ({ position: [3.2, 2.4, 3.9], fov: 42 }), [])
  return <Canvas camera={camera} dpr={[1, 2]} gl={{ antialias: true }}>
    <Scene {...props} />
  </Canvas>
}
