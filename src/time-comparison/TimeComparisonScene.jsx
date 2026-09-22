import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import TimeEquation from './TimeEquation.jsx'
import { SchoolingLead, SchoolingTail, SkateboredCaption } from './ComparisonCopy.jsx'
import { buildTimeComparisonTimeline } from './timeline.js'
import './timeComparison.css'

gsap.registerPlugin(useGSAP)

const ANNOUNCEMENTS = {
  skatebored: 'time = N: time taken via Skatebored to learn Calculus.',
  schooling: 'But it takes up to time = 10N to learn Calculus via general schooling.',
}

// Cinematic overlay above an existing visualization. `children` is that
// visualization; it stays mounted and is only dimmed, never re-rendered by the
// count. Changing `runKey` replays the sequence from the normal state.
export default function TimeComparisonScene({ children, runKey = 0, onPhaseChange }) {
  const root = useRef(null)
  const phaseListener = useRef(onPhaseChange)
  const [coefficient, setCoefficient] = useState(null)
  const [phase, setPhase] = useState('intro')
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => { phaseListener.current = onPhaseChange }, [onPhaseChange])

  useGSAP((context, contextSafe) => {
    let live = true
    const start = contextSafe(() => {
      if (!live) return
      // Clear first so a replay's identical sentence still changes the live region.
      setAnnouncement('')
      const q = gsap.utils.selector(root)
      const probe = q('.tc-probe')[0]
      const digitEm = probe.getBoundingClientRect().width / parseFloat(getComputedStyle(probe).fontSize)
      buildTimeComparisonTimeline({
        el: {
          background: q('.tc-background')[0], dimmer: q('.tc-dimmer')[0],
          equation: q('.tc-equation')[0], upright: q('.tc-upright')[0], display: q('.tc-display')[0],
          coefficient: q('.tc-coefficient')[0], digits: q('.tc-digits')[0],
          caption: q('.tc-caption')[0], lead: q('.tc-lead')[0], tail: q('.tc-tail')[0],
        },
        digitEm,
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        setCoefficient,
        onPhase: name => {
          setPhase(name)
          if (ANNOUNCEMENTS[name]) setAnnouncement(ANNOUNCEMENTS[name])
          phaseListener.current?.(name)
        },
      })
    })
    // Text widths drive the push animation, so measure only once fonts settle.
    document.fonts.ready.then(start)
    return () => { live = false }
  }, { scope: root, dependencies: [runKey], revertOnUpdate: true })

  return <section ref={root} className="tc-scene" data-phase={phase}>
    <div className="tc-background">{children}</div>
    <div className="tc-dimmer" aria-hidden="true" />
    <div className="tc-overlay" aria-hidden="true">
      <div className="tc-stage">
        <SchoolingLead />
        <TimeEquation coefficient={coefficient} />
        <SkateboredCaption />
        <SchoolingTail />
      </div>
    </div>
    <p className="tc-visually-hidden" role="status" aria-live="polite">{announcement}</p>
  </section>
}
