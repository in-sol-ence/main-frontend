import test from 'node:test'
import assert from 'node:assert/strict'
import { fixture } from '../src/data/fixture.js'
import { initialState, transition, gradeAnswer, serializeSession, restoreSession } from '../src/learning.js'
import { validateCurriculum, videoLinks } from '../src/curriculum.js'

const timestamp = '2026-09-22T12:00:00.000Z'
const act = (state, type, answer, data = fixture) => transition(data, state, { type, ...(answer !== undefined ? { answer } : {}), timestamp })
const answerFor = q => q.questionType === 'multiple_choice' ? q.correctAnswer : q.questionType === 'numerical' ? String(q.correctAnswer.value) : q.correctAnswer.acceptedResponses[0]

test('ten-stage dictionary and dataset have the prescribed indices and prerequisites', () => {
  assert.equal(validateCurriculum(fixture).length, 10)
  assert.deepEqual(Object.keys(fixture.concepts), Array.from({ length: 10 }, (_, i) => `KC_${String(i + 1).padStart(2, '0')}`))
  assert.deepEqual(fixture.concepts.KC_08.prerequisites, ['KC_03', 'KC_04', 'KC_05', 'KC_06', 'KC_07'])
  assert.deepEqual(initialState(fixture).masteryVector, Array(10).fill(0))
})

test('correct core updates mastery, records evidence and advances immediately', () => {
  const start = initialState(fixture)
  const next = act(start, 'answer', 'correct')
  assert.equal(next.stageId, 'stage-02')
  assert.equal(next.activity, 'core')
  assert.equal(next.masteryVector[0], 1)
  assert.equal(next.assessmentStatus.KC_01, 'mastered')
  assert.equal(next.masteryOrigin.KC_01, 'core')
  assert.deepEqual(next.history[0].masteryVectorBefore, Array(10).fill(0))
  assert.deepEqual(next.history[0].masteryVectorAfter, [1, ...Array(9).fill(0)])
  assert.equal(next.history[0].questionId, 'stage-01-core')
  assert.equal(next.history[0].timestamp, timestamp)
  assert.equal(start.masteryVector[0], 0, 'transition must not mutate its input')
})

test('incorrect core opens matching remediation and distinguishes failure from unknown', () => {
  const state = act(initialState(fixture), 'answer', 'incorrect')
  assert.equal(state.stageId, 'stage-01')
  assert.equal(state.activity, 'remediation')
  assert.equal(state.assessmentStatus.KC_01, 'not_mastered')
  assert.equal(state.assessmentStatus.KC_02, 'not_assessed')
  assert.deepEqual(state.masteryVector, Array(10).fill(0))
  assert.equal(state.history[1].videoId, fixture.stages['stage-01'].remediationVideoIds[0])
  assert.equal(act(state, 'answer', 'correct'), state, 'cannot skip remediation with an answer')
})

test('correct transfer grants mastery after remediation, never for viewing alone', () => {
  let state = act(initialState(fixture), 'answer', 'incorrect')
  state = act(state, 'remediation_completed')
  assert.equal(state.activity, 'transfer')
  assert.equal(state.masteryVector[0], 0)
  state = act(state, 'answer', 'correct')
  assert.equal(state.stageId, 'stage-02')
  assert.equal(state.masteryOrigin.KC_01, 'transfer')
  assert.equal(state.history.at(-1).attemptType, 'transfer')
  assert.equal(state.masteryVector[0], 1)
})

test('failed transfer requires fallback then permits a recorded prerequisite gap', () => {
  let state = act(initialState(fixture), 'answer', 'incorrect')
  state = act(state, 'remediation_completed')
  state = act(state, 'answer', 'incorrect')
  assert.equal(state.activity, 'fallback')
  assert.equal(state.masteryVector[0], 0)
  assert.equal(state.history.at(-1).type, 'fallback_displayed')
  state = act(state, 'fallback_completed')
  assert.equal(state.stageId, 'stage-02')
  assert.equal(state.assessmentStatus.KC_01, 'not_mastered')
  assert.equal(state.masteryVector[0], 0)
  assert.equal(state.history.at(-1).type, 'fallback_completed')
})

test('all stages complete in dataset order with exact per-concept vector mappings', () => {
  let state = initialState(fixture)
  for (let i = 0; i < 10; i++) {
    const question = fixture.questions[fixture.stages[state.stageId].coreQuestionId]
    state = act(state, 'answer', answerFor(question))
    assert.deepEqual(state.masteryVector, Array.from({ length: 10 }, (_, j) => j <= i ? 1 : 0))
  }
  assert.equal(state.activity, 'complete')
  assert.equal(state.stageId, null)
  assert.equal(state.completedStageIds.length, 10)
  assert.equal(state.history.length, 10)
  assert.equal(act(state, 'answer', 'correct'), state)
})

test('complete unresolved-gap route never grants mastery', () => {
  let state = initialState(fixture)
  for (let i = 0; i < 10; i++) {
    state = act(state, 'answer', 'incorrect')
    state = act(state, 'remediation_completed')
    state = act(state, 'answer', 'incorrect')
    state = act(state, 'fallback_completed')
  }
  assert.equal(state.activity, 'complete')
  assert.deepEqual(state.masteryVector, Array(10).fill(0))
  assert.equal(state.history.filter(event => event.type === 'answer').length, 20)
  assert.equal(state.history.filter(event => event.type === 'remediation_completed').length, 10)
  assert.ok(Object.values(state.assessmentStatus).every(value => value === 'not_mastered'))
})

test('refresh restores each phase by replaying its actions', () => {
  let state = initialState(fixture)
  const actions = [['answer', 'incorrect'], ['remediation_completed'], ['answer', 'incorrect'], ['fallback_completed'], ['answer', '2']]
  for (const [type, answer] of actions) {
    state = act(state, type, answer)
    assert.deepEqual(restoreSession(fixture, serializeSession(fixture, state)), state)
  }
})

test('reset creates fresh status, vector, history, origin, activity and progress', () => {
  const old = act(initialState(fixture), 'answer', 'correct')
  const fresh = initialState(fixture)
  assert.notDeepEqual(fresh, old)
  assert.equal(fresh.stageId, 'stage-01')
  assert.equal(fresh.activity, 'core')
  assert.deepEqual(fresh.history, [])
  assert.deepEqual(fresh.actions, [])
  assert.deepEqual(fresh.masteryOrigin, {})
  assert.deepEqual(fresh.completedStageIds, [])
  assert.deepEqual(fresh.masteryVector, Array(10).fill(0))
})

test('deterministic grading accepts numerical tolerance and normalized short answers', () => {
  const numerical = fixture.questions['stage-02-core']
  for (const answer of ['2', ' 2.00 ', '2e0', '2.01']) assert.equal(gradeAnswer(numerical, answer), true)
  for (const answer of ['', ' ', '2x', '0x2', 'Infinity', '2.02', '1+1']) assert.equal(gradeAnswer(numerical, answer), false)
  const short = fixture.questions['stage-03-core']
  assert.equal(gradeAnswer(short, ' I   AM Ready '), true)
  assert.equal(gradeAnswer(short, 'ready for anything'), false)
})

test('unsupported/empty/duplicate action types do not mutate state', () => {
  const state = initialState(fixture)
  assert.equal(act(state, 'answer', ''), state)
  assert.equal(act(state, 'answer', 'nonexistent-choice'), state)
  assert.equal(act(state, 'fallback_completed'), state)
  assert.equal(act(state, 'remediation_completed'), state)
})

test('multiple remediation segments finish before transfer', () => {
  const data = structuredClone(fixture)
  data.videos.extra = { ...data.videos['stage-01-video'], id: 'extra' }
  data.stages['stage-01'].remediationVideoIds.push('extra')
  validateCurriculum(data)
  let state = act(initialState(data), 'answer', 'incorrect', data)
  state = act(state, 'remediation_completed', undefined, data)
  assert.equal(state.activity, 'remediation')
  assert.equal(state.videoIndex, 1)
  assert.equal(state.history.at(-1).videoId, 'extra')
  state = act(state, 'remediation_completed', undefined, data)
  assert.equal(state.activity, 'transfer')
})

test('questions can share a video resource that covers their concepts', () => {
  const data = structuredClone(fixture)
  data.videos['stage-01-video'].conceptIds.push('KC_02')
  data.stages['stage-02'].remediationVideoIds = ['stage-01-video']
  assert.equal(validateCurriculum(data).length, 10)
})

test('stage next pointers govern progression, independent of dictionary insertion order', () => {
  const data = structuredClone(fixture)
  data.stages = Object.fromEntries(Object.entries(data.stages).reverse())
  data.concepts = Object.fromEntries(Object.entries(data.concepts).reverse())
  assert.equal(validateCurriculum(data)[0], 'stage-01')
  assert.equal(act(initialState(data), 'answer', 'correct', data).stageId, 'stage-02')
})

test('video URLs constrain YouTube clips and provide safe external/native fallback', () => {
  const video = { url: 'https://youtu.be/dQw4w9WgXcQ', startTime: 25, endTime: 50 }
  assert.match(videoLinks(video).embed, /start=25&end=50/)
  assert.match(videoLinks(video).external, /t=25s/)
  assert.equal(videoLinks({ ...video, url: 'https://example.org/lesson' }).embed, null)
  assert.match(videoLinks({ ...video, url: 'https://example.org/lesson.mp4' }).native, /#t=25,50/)
  assert.equal(videoLinks({ ...video, url: 'javascript:alert(1)' }).external, null)
  assert.equal(videoLinks({ ...video, url: 'https://youtube.com.evil.example/?v=dQw4w9WgXcQ' }).embed, null)
})

test('validator rejects invalid imports without needing to change the current session', () => {
  const corruptions = [
    d => { d.concepts.KC_01.index = 1 },
    d => { d.concepts.KC_01.prerequisites = ['unknown'] },
    d => { d.concepts.KC_01.prerequisites = ['KC_02'] },
    d => { d.stages['stage-10'].nextStageId = 'stage-01' },
    d => { d.stages['stage-01'].coreQuestionId = 'stage-02-core' },
    d => { d.videos['stage-01-video'].url = 'javascript:alert(1)' },
    d => { d.videos['stage-01-video'].endTime = 0 },
    d => { d.questions['stage-02-core'].correctAnswer.tolerance = -1 },
    d => { d.questions['stage-01-core'].sourceIds = ['missing'] },
    d => { d.isFixture = false },
  ]
  for (const mutate of corruptions) { const data = structuredClone(fixture); mutate(data); assert.throws(() => validateCurriculum(data)) }
})

test('corrupt, incompatible, or impossible saved sessions are rejected', () => {
  const state = act(initialState(fixture), 'answer', 'correct')
  assert.throws(() => restoreSession(fixture, '{'))
  const changed = structuredClone(fixture)
  changed.version++
  assert.throws(() => restoreSession(changed, serializeSession(fixture, state)))
  const invalid = JSON.parse(serializeSession(fixture, state))
  invalid.actions.push({ type: 'fallback_completed', timestamp })
  assert.throws(() => restoreSession(fixture, JSON.stringify(invalid)))
})

test('stale question submissions cannot answer the next stage', () => {
  const action = { type: 'answer', questionId: 'stage-01-core', answer: 'correct', timestamp }
  const state = transition(fixture, initialState(fixture), action)
  assert.equal(transition(fixture, state, action), state)
})

test('written feedback references and resource IDs are validated across resource types', () => {
  const data = structuredClone(fixture)
  data.questions['stage-01-core'].explanationId = 'missing'
  assert.throws(() => validateCurriculum(data), /unknown feedback explanation/)
  data.questions['stage-01-core'].explanationId = 'stage-01-explanation'
  validateCurriculum(data)
  data.videos['stage-01-core'] = { ...data.videos['stage-01-video'], id: 'stage-01-core' }
  assert.throws(() => validateCurriculum(data), /unique across resource types/)
})
