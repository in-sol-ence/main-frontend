import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import KnowledgeScene from '../knowledge/KnowledgeScene.jsx'
import TimeComparisonScene from './TimeComparisonScene.jsx'

// Standalone host: the existing Knowledge Space renders underneath, unchanged,
// with the same configuration the Demo page uses. It stays mounted on replay.
const MASTERY = [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
const SURFACE = { color: '#FF1414', roughness: 0.42, metalness: 0.25 }

function _TimeComparisonDemo() {
  const [runKey, setRunKey] = useState(0)
  const [phase, setPhase] = useState('intro')
  // A stable element lets React skip the visualization on every phase change.
  const background = useMemo(() => (
    <KnowledgeScene mastery={MASTERY} radius={8} isolation={45} surface={SURFACE} autoRotate background="#000000" />
  ), [])
  return <>
    <TimeComparisonScene runKey={runKey} onPhaseChange={setPhase}>{background}</TimeComparisonScene>
    <button type="button" className="tc-demo-replay" hidden={phase !== 'complete'}
      onClick={() => setRunKey(key => key + 1)}>Replay</button>
  </>
}

createRoot(document.querySelector('#root')).render(<StrictMode><_TimeComparisonDemo /></StrictMode>)
