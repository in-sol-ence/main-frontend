import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initialState, transition, serializeSession, restoreSession } from '../src/learning.js'
import { validateCurriculum, videoLinks } from '../src/curriculum.js'

const data = JSON.parse(readFileSync(new URL('../src/data/bloom.json', import.meta.url)))
const coreAnswers = ['B', 'B', 'B', 'D', 'B', 'B', 'C', 'B', 'C', 'C']
const transferAnswers = ['C', 'A', 'C', 'C', 'A', 'B', 'C', 'B', 'B', 'C']
const order = validateCurriculum(data)
const _act = (state, type, answer) => transition(data, state, { type, ...(answer !== undefined ? { answer } : {}), timestamp: '2026-09-22T12:00:00.000Z' })

test('real curriculum has the supplied answer keys, concept mappings and distinct transfer questions', () => {
  assert.equal(data.isFixture, false)
  assert.equal(order.length, 10)
  for (const [i, id] of order.entries()) {
    const stage = data.stages[id]
    const conceptId = `KC_${String(i + 1).padStart(2, '0')}`
    assert.deepEqual(stage.conceptIds, [conceptId])
    const core = data.questions[stage.coreQuestionId], transfer = data.questions[stage.transferQuestionId]
    assert.equal(core.correctAnswer, coreAnswers[i])
    assert.equal(transfer.correctAnswer, transferAnswers[i])
    assert.notEqual(core.questionText, transfer.questionText)
    assert.equal(core.choices.length, 4)
    assert.equal(transfer.choices.length, 4)
    assert.deepEqual(core.conceptIds, [conceptId])
    assert.deepEqual(transfer.conceptIds, [conceptId])
    const video = data.videos[stage.remediationVideoIds[0]]
    assert.deepEqual(video.conceptIds, [conceptId])
    assert.ok(video.segmentDuration <= 90)
    const links = videoLinks(video)
    assert.ok(links.external)
    assert.ok(links.embed || links.native)
    if (links.embed) assert.ok(links.embed.includes(`start=${video.startTime}&end=${video.endTime}`))
    else assert.ok(links.native.endsWith(`#t=${video.startTime},${video.endTime}`))
    assert.deepEqual(data.explanations[stage.fallbackExplanationId].conceptIds, [conceptId])
  }
  assert.doesNotMatch(JSON.stringify(data), /\\(?:frac|mu|text|approx)|\$\$/)
})

for (const [name, mistakes, persistent] of [
  ['A — all correct', [], false],
  ['B — successful remediation', [0, 2, 4, 7, 9], false],
  ['C — persistent misconceptions', [1, 3, 5, 6, 8, 9], true],
  ['all ten remediation and fallback paths', Array.from({ length: 10 }, (_, i) => i), true],
]) {
  test(`complete session ${name}`, () => {
    let state = initialState(data)
    const expected = Array(10).fill(0)
    for (const [i, id] of order.entries()) {
      assert.equal(state.stageId, id)
      assert.equal(state.activity, 'core')
      const stage = data.stages[id]
      const core = data.questions[stage.coreQuestionId], transfer = data.questions[stage.transferQuestionId]
      if (mistakes.includes(i)) {
        state = _act(state, 'answer', core.choices.find(c => c.id !== core.correctAnswer).id)
        assert.equal(state.activity, 'remediation')
        assert.equal(state.history.at(-1).videoId, stage.remediationVideoIds[0])
        assert.deepEqual(state.masteryVector, expected)
        assert.equal(_act(state, 'answer', transfer.correctAnswer), state)
        state = _act(state, 'remediation_completed')
        assert.equal(state.activity, 'transfer')
        assert.deepEqual(state.masteryVector, expected, 'viewing must never grant mastery')
        state = _act(state, 'answer', persistent ? transfer.choices.find(c => c.id !== transfer.correctAnswer).id : transfer.correctAnswer)
        if (persistent) {
          assert.equal(state.activity, 'fallback')
          assert.equal(state.history.at(-1).explanationId, stage.fallbackExplanationId)
          assert.deepEqual(state.masteryVector, expected)
          state = _act(state, 'fallback_completed')
        } else {
          expected[i] = 1
          assert.equal(state.masteryOrigin[stage.conceptIds[0]], 'transfer')
        }
      } else {
        state = _act(state, 'answer', core.correctAnswer)
        expected[i] = 1
        assert.equal(state.masteryOrigin[stage.conceptIds[0]], 'core')
      }
      assert.deepEqual(state.masteryVector, expected)
      assert.deepEqual(restoreSession(data, serializeSession(data, state)), state)
    }
    assert.equal(state.activity, 'complete')
    assert.deepEqual(state.completedStageIds, order)
    assert.deepEqual(state.masteryVector, expected)
  })
}

test('TED stages reuse the official YouTube edition with distinct supplied segments', () => {
  const videos = [5, 8, 9].map(n => data.videos[`stage-${String(n).padStart(2, '0')}-video`])
  assert.equal(new Set(videos.map(v => v.url)).size, 1)
  assert.equal(videos[0].url, 'https://www.youtube.com/watch?v=U6FvJ6jMGHU')
  assert.deepEqual(videos.map(v => [v.startTime, v.endTime]), [[969, 1000], [1000, 1012], [1037, 1049]])
  for (const v of videos) {
    assert.deepEqual(v.sourceIds, ['ted-koller'])
  }
  assert.match(data.explanations['stage-04-explanation'].content, /does not mean 98% of tutored students/)
  assert.match(data.questions['stage-08-core'].answerExplanation, /conventional group/)
})
