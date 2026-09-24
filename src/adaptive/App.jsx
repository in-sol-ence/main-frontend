import { Component, useEffect, useMemo, useRef, useState } from 'react'
import bloom from '../../copy/adaptive/bloom.json'
import { adaptive } from '../../copy/adaptive.js'
import KnowledgeScene from '../knowledge/KnowledgeScene.jsx'
import { validateCurriculum } from './curriculum.js'
import { initialState, transition, restoreSession, serializeSession } from './learning.js'

const STORAGE = 'skatebored-adaptive-demo-v5'
let youtubeApiPromise

function _loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.()
        resolve(window.YT)
      }
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (existing) return
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.onerror = () => reject(new Error('YouTube player unavailable'))
      document.head.appendChild(script)
    })
  }
  return youtubeApiPromise
}

function _youtubeId(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
    return parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] || null
  } catch {
    return null
  }
}

function _load() {
  validateCurriculum(bloom)
  try {
    const saved = localStorage.getItem(STORAGE)
    return saved ? restoreSession(bloom, saved) : initialState(bloom)
  } catch {
    return initialState(bloom)
  }
}

function _Question({ question, onAnswer, locked }) {
  return <section className="question" aria-labelledby="question-text">
      <h1 id="question-text" tabIndex={-1}>{question.questionText}</h1>
      <div className="answers">
        {question.choices.map(choice => (
          <button key={choice.id} type="button" disabled={locked} onClick={() => onAnswer(choice.id)}>{choice.text}</button>
        ))}
      </div>
    </section>
}

function _Video({ video, onComplete }) {
  const mountRef = useRef(null)
  const playerRef = useRef(null)
  const completeRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const [failed, setFailed] = useState(false)
  const youtubeId = _youtubeId(video.url)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!youtubeId) {
      setFailed(true)
      return undefined
    }
    let disposed = false
    let interval
    let ready = false
    completeRef.current = false
    const failureTimer = window.setTimeout(() => {
      if (!ready && !disposed) setFailed(true)
    }, 12000)
    const finish = () => {
      if (completeRef.current || disposed) return
      completeRef.current = true
      onCompleteRef.current()
    }
    _loadYouTubeApi().then(YT => {
      if (disposed || !mountRef.current) return
      playerRef.current = new YT.Player(mountRef.current, {
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          playsinline: 1,
          rel: 0,
          start: Math.floor(video.startTime),
          end: Math.ceil(video.endTime),
          origin: window.location.origin,
        },
        events: {
          onReady: event => {
            if (disposed) return
            ready = true
            setFailed(false)
            event.target.getIframe?.().setAttribute('title', video.title)
            window.clearTimeout(failureTimer)
            event.target.loadVideoById({
              videoId: youtubeId,
              startSeconds: video.startTime,
              endSeconds: video.endTime,
            })
            interval = window.setInterval(() => {
              if (event.target.getCurrentTime?.() >= video.endTime - 0.2) finish()
            }, 250)
          },
          onStateChange: event => {
            if (event.data === YT.PlayerState.ENDED) finish()
          },
          onError: () => setFailed(true),
        },
      })
    }).catch(() => { if (!disposed) setFailed(true) })
    return () => {
      disposed = true
      window.clearTimeout(failureTimer)
      window.clearInterval(interval)
      playerRef.current?.destroy?.()
    }
  }, [video.endTime, video.startTime, youtubeId])

  const external = new URL(video.url)
  external.searchParams.set('t', `${Math.floor(video.startTime)}s`)
  return <div className="video-container" tabIndex={-1}>
    <div className="video-frame" hidden={failed}><div ref={mountRef} /></div>
    {failed && <div className="video-fallback">
    <p>{adaptive.videoUnavailable}</p>
    <a href={external.href} target="_blank" rel="noreferrer">{adaptive.openVideo}</a>
    <button type="button" onClick={onComplete}>{adaptive.continue}</button>
  </div>}
  </div>
}

function _Fallback({ explanation, onContinue }) {
  return <section className="fallback" tabIndex={-1}>
      <p>{explanation.content}</p>
      <button type="button" onClick={onContinue}>{adaptive.continue}</button>
    </section>
}

class _SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <p className="scene-message">{adaptive.unavailable}</p> : this.props.children }
}

export default function App() {
  const [state, setState] = useState(_load)
  const [locked, setLocked] = useState(false)
  const answerLocked = useRef(false)
  const unlockTimer = useRef(null)
  const activityRef = useRef(null)
  const renderedMastery = useMemo(
    () => [...state.masteryVector, ...Array(24 - state.masteryVector.length).fill(0)],
    [state.masteryVector],
  )
  const stage = state.stageId ? bloom.stages[state.stageId] : null
  const question = stage && bloom.questions[state.activity === 'transfer' ? stage.transferQuestionId : stage.coreQuestionId]

  useEffect(() => {
    try { localStorage.setItem(STORAGE, serializeSession(bloom, state)) } catch { /* Private browsing can disable storage. */ }
  }, [state])

  useEffect(() => {
    activityRef.current?.scrollTo(0, 0)
    if (matchMedia('(max-width: 760px)').matches) window.scrollTo(0, 0)
    activityRef.current?.querySelector('h1, .fallback, .video-container')?.focus({ preventScroll: true })
  }, [state.activity, state.stageId, state.videoIndex])
  useEffect(() => () => clearTimeout(unlockTimer.current), [])

  function _act(type, answer) {
    if (answerLocked.current) return
    answerLocked.current = true
    setLocked(true)
    // Keep a second tap from submitting a choice in the newly rendered question.
    unlockTimer.current = setTimeout(() => { answerLocked.current = false; setLocked(false) }, 450)
    setState(current => transition(bloom, current, {
      type, ...(answer !== undefined ? { answer, questionId: question.id } : {}),
      timestamp: new Date().toISOString(),
    }))
  }

  let activity
  if (state.activity === 'remediation') {
    activity = <_Video key={`${state.stageId}-${state.videoIndex}`} video={bloom.videos[stage.remediationVideoIds[state.videoIndex]]} onComplete={() => _act('remediation_completed')} />
  } else if (state.activity === 'fallback') {
    activity = <_Fallback explanation={bloom.explanations[stage.fallbackExplanationId]} onContinue={() => _act('fallback_completed')} />
  } else if (state.activity === 'complete') {
    activity = <section className="completion"><h1 tabIndex={-1}>{adaptive.complete}</h1><p>{adaptive.completion}</p>
      <button type="button" onClick={() => { clearTimeout(unlockTimer.current); answerLocked.current = false; setLocked(false); setState(initialState(bloom)) }}>{adaptive.restart}</button>
    </section>
  } else {
    activity = <_Question question={question} locked={locked} onAnswer={answer => _act('answer', answer)} />
  }

  return <>
    <a className="learn-home" href="../">{adaptive.home}</a>
    <main className="learning-demo">
      <div className="activity-panel" ref={activityRef}>{activity}</div>
      <div className="knowledge-window" role="region" aria-label={adaptive.knowledge}>
        <_SceneBoundary><KnowledgeScene mastery={renderedMastery} radius={8} isolation={45}
          surface={{ color: '#FF1414', roughness: 0.42, metalness: 0.25 }} autoRotate={false} background="#000000" /></_SceneBoundary>
        {!state.masteryVector.some(Boolean) && <p className="scene-message">{adaptive.empty}</p>}
      </div>
      <p className="sr-only" role="status">{state.feedback ? (state.feedback.isCorrect ? adaptive.correct : adaptive.incorrect) : ''}</p>
    </main>
  </>
}
