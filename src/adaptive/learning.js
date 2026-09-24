import { validateCurriculum } from './curriculum.js'

export function initialState(data) {
  return {
    stageId: data.firstStageId, activity: 'core', completedStageIds: [],
    assessmentStatus: Object.fromEntries(Object.keys(data.concepts).map(id => [id, 'not_assessed'])),
    masteryVector: Array(Object.keys(data.concepts).length).fill(0),
    masteryOrigin: {}, history: [], actions: [], feedback: null, videoIndex: 0,
  }
}

export function gradeAnswer(question, submittedAnswer) {
  if (typeof submittedAnswer !== 'string' || !submittedAnswer.trim()) return false
  if (question.questionType === 'multiple_choice') return submittedAnswer === question.correctAnswer
  if (question.questionType === 'numerical') {
    // Deliberately accept decimal/scientific notation, not JS hex, Infinity or arithmetic.
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(submittedAnswer.trim())) return false
    const value = Number(submittedAnswer)
    return Number.isFinite(value) && Math.abs(value - question.correctAnswer.value) <= question.correctAnswer.tolerance + Number.EPSILON * Math.max(1, Math.abs(value))
  }
  const _normalize = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
  return question.correctAnswer.acceptedResponses.some(value => _normalize(value) === _normalize(submittedAnswer))
}

// Pure transitions; successful answers advance while feedback remains visible.
export function transition(data, state, action) {
  if (state.activity === 'complete') return state
  const stage = data.stages[state.stageId]
  const next = structuredClone(state)
  const before = [...state.masteryVector]
  function _record(type, fields = {}) {
    next.history.push({ type, timestamp: action.timestamp, stageId: stage.stageId, conceptIds: stage.conceptIds,
      masteryVectorBefore: [...before], masteryVectorAfter: [...next.masteryVector], ...fields })
  }
  function _advance() {
    next.completedStageIds.push(stage.stageId)
    next.stageId = stage.nextStageId
    next.activity = next.stageId ? 'core' : 'complete'
    next.videoIndex = 0
  }
  if (action.type === 'answer' && ['core', 'transfer'].includes(state.activity)) {
    const question = data.questions[state.activity === 'core' ? stage.coreQuestionId : stage.transferQuestionId]
    if (action.questionId && action.questionId !== question.id) return state
    if (typeof action.answer !== 'string' || !action.answer.trim() || (question.questionType === 'multiple_choice' && !question.choices.some(c => c.id === action.answer))) return state
    const isCorrect = gradeAnswer(question, action.answer)
    for (const id of question.conceptIds) {
      // Later unsuccessful evidence never erases mastery already demonstrated.
      if (isCorrect) {
        next.assessmentStatus[id] = 'mastered'
        next.masteryVector[data.concepts[id].index] = 1
        next.masteryOrigin[id] ??= state.activity
      } else if (!next.masteryVector[data.concepts[id].index]) next.assessmentStatus[id] = 'not_mastered'
    }
    _record('answer', { questionId: question.id, conceptIds: question.conceptIds, questionType: question.questionType,
      submittedAnswer: action.answer, isCorrect, attemptType: state.activity })
    next.feedback = { questionId: question.id, isCorrect, attemptType: state.activity }
    if (isCorrect) _advance()
    else if (state.activity === 'core') {
      next.activity = 'remediation'
      _record('remediation_displayed', { videoId: stage.remediationVideoIds[0] })
    } else {
      next.activity = 'fallback'
      _record('fallback_displayed', { explanationId: stage.fallbackExplanationId })
    }
  } else if (action.type === 'remediation_completed' && state.activity === 'remediation') {
    _record('remediation_completed', { videoId: stage.remediationVideoIds[state.videoIndex], completion: 'learner_reported' })
    next.feedback = null
    if (state.videoIndex + 1 < stage.remediationVideoIds.length) {
      next.videoIndex++
      _record('remediation_displayed', { videoId: stage.remediationVideoIds[next.videoIndex] })
    } else next.activity = 'transfer'
  } else if (action.type === 'fallback_completed' && state.activity === 'fallback') {
    _record('fallback_completed', { explanationId: stage.fallbackExplanationId })
    next.feedback = null
    _advance()
  } else return state
  next.actions.push(action)
  return next
}

export function restoreSession(data, serialized) {
  validateCurriculum(data)
  const saved = JSON.parse(serialized)
  // Compare the full dataset so changed answers never inherit stale mastery.
  if (saved.curriculum !== JSON.stringify(data) || !Array.isArray(saved.actions)) throw new Error('Saved session belongs to a different curriculum.')
  let state = initialState(data)
  for (const action of saved.actions) {
    if (!action || !Number.isFinite(Date.parse(action.timestamp))) throw new Error('Invalid session timestamp.')
    const next = transition(data, state, action)
    if (next === state) throw new Error('Invalid saved learning sequence.')
    state = next
  }
  return state
}

export function serializeSession(data, state) {
  return JSON.stringify({ curriculum: JSON.stringify(data), actions: state.actions })
}
