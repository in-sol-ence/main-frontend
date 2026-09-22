import { useEffect, useMemo, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import bloom from './data/bloom.json'
import KnowledgeScene from './KnowledgeScene.jsx'
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

function Question({ question, onAnswer }) {
  return <section className="question" aria-labelledby="question-text">
      <h1 id="question-text">{question.questionText}</h1>
      <div className="answers">
        {question.choices.map(choice => (
          <button key={choice.id} type="button" onClick={() => onAnswer(choice.id)}>{choice.text}</button>
        ))}
      </div>
    </section>
}

function Video({ video, onComplete }) {
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
    const failureTimer = window.setTimeout(() => {
      if (!playerRef.current) setFailed(true)
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
    }).catch(() => setFailed(true))
    return () => {
      disposed = true
      window.clearTimeout(failureTimer)
      window.clearInterval(interval)
      playerRef.current?.destroy?.()
    }
  }, [video.endTime, video.startTime, youtubeId])

  if (failed) return <div className="video-fallback">
    <a href={`${video.url}&t=${Math.floor(video.startTime)}s`} target="_blank" rel="noreferrer">Open video</a>
    <button type="button" onClick={onComplete}>Continue</button>
  </div>

  return <div className="video-frame" ref={mountRef} />
}

function Fallback({ explanation, onContinue }) {
  return <section className="fallback">
      <p>{explanation.content}</p>
      <button type="button" onClick={onContinue}>Continue</button>
    </section>
}

export default function App() {
  const [state, setState] = useState(_load)
  const answerLocked = useRef(false)
  const renderedMastery = useMemo(
    () => [...state.masteryVector, ...Array(24 - state.masteryVector.length).fill(0)],
    [state.masteryVector],
  )
  const stage = state.stageId ? bloom.stages[state.stageId] : null
  const question = stage && bloom.questions[state.activity === 'transfer' ? stage.transferQuestionId : stage.coreQuestionId]

  useEffect(() => {
    try { localStorage.setItem(STORAGE, serializeSession(bloom, state)) } catch { /* Session persistence is best effort. */ }
  }, [state])

  useEffect(() => {
    answerLocked.current = false
  }, [state.activity, state.stageId])

  function act(type, answer) {
    const action = {
      type,
      ...(answer !== undefined ? { answer, questionId: question.id } : {}),
      timestamp: new Date().toISOString(),
    }
    const next = transition(bloom, state, action)
    if (next === state) return
    setState(next)
  }

  function answer(choiceId) {
    if (answerLocked.current) return
    answerLocked.current = true
    act('answer', choiceId)
  }

  let activity = null
  if (state.activity === 'remediation') {
    activity = <Video video={bloom.videos[stage.remediationVideoIds[state.videoIndex]]} onComplete={() => act('remediation_completed')} />
  } else if (state.activity === 'fallback') {
    activity = <Fallback explanation={bloom.explanations[stage.fallbackExplanationId]} onContinue={() => act('fallback_completed')} />
  } else if (state.activity !== 'complete') {
    activity = <Question question={question} onAnswer={answer} />
  }

  return <main className="demo">
    <Group orientation="horizontal" className="demo-panels">
      <Panel id="activity" defaultSize="44%" minSize="320px">
        <div className="activity-panel">{activity}</div>
      </Panel>
      <Separator className="panel-separator" />
      <Panel id="knowledge" defaultSize="56%" minSize="35%">
        <div className="knowledge-window" aria-label="Knowledge state visualization">
          <KnowledgeScene
            mastery={renderedMastery}
            radius={8}
            isolation={45}
            surface={{ color: '#FF1414', roughness: 0.42, metalness: 0.25 }}
            autoRotate={false}
            background="#000000"
          />
        </div>
      </Panel>
    </Group>
  </main>
}
