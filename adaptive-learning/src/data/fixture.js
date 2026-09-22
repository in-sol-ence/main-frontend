import { concepts } from './concepts.js'

// These exercise the software only. Replace this dataset with the supplied curriculum.
export const fixture = {
  id: 'skatebored-development-fixture', version: 1, isFixture: true,
  title: "Bloom’s 2 Sigma Problem", firstStageId: 'stage-01', concepts,
  questions: {}, videos: {}, explanations: {}, stages: {}, sources: [],
}
const ordered = Object.entries(concepts).sort((a, b) => a[1].index - b[1].index)
for (const [index, [id, concept]] of ordered.entries()) {
  const stageId = `stage-${String(index + 1).padStart(2, '0')}`
  const questionType = ['multiple_choice', 'numerical', 'short_answer'][index % 3]
  for (const attempt of ['core', 'transfer']) {
    const questionId = `${stageId}-${attempt}`
    fixture.questions[questionId] = {
      id: questionId, stageId, conceptIds: [id], questionType,
      questionText: questionType === 'multiple_choice'
        ? 'Which path would you like to try?'
        : questionType === 'numerical' ? 'Enter 2 to demonstrate a correct numerical answer.' : 'Type “ready” to demonstrate a correct short answer.',
      choices: questionType === 'multiple_choice' ? [
        { id: 'correct', text: 'Demonstrate understanding' },
        { id: 'incorrect', text: 'Try the extra support' },
      ] : [],
      correctAnswer: questionType === 'multiple_choice' ? 'correct' : questionType === 'numerical' ? { value: 2, tolerance: 0.01 } : { acceptedResponses: ['ready', 'i am ready'] },
      answerExplanation: 'This is a development fixture. The response tests the learning flow; it does not assess your knowledge of this concept.',
      difficulty: 'development', prerequisiteConceptIds: concept.prerequisites, sourceIds: [],
    }
  }
  fixture.videos[`${stageId}-video`] = {
    id: `${stageId}-video`, title: 'Remediation segment awaiting content', creator: 'Not supplied',
    url: null, startTime: 0, endTime: 30, segmentDuration: 30, conceptIds: [id],
    description: 'The supplied attachment ends before the video resources. This slot demonstrates targeted remediation.',
    sourceIds: [],
  }
  fixture.explanations[`${stageId}-explanation`] = {
    id: `${stageId}-explanation`, title: 'A little more support', conceptIds: [id],
    content: 'A written explanation will appear here when the curriculum is supplied. Reading it does not grant mastery. You can continue with this gap recorded in your knowledge state.', sourceIds: [],
  }
  fixture.stages[stageId] = {
    stageId, title: concept.name, purpose: `Check your understanding of ${concept.name.toLowerCase()} before moving on.`,
    conceptIds: [id], prerequisiteConceptIds: concept.prerequisites,
    coreQuestionId: `${stageId}-core`, remediationVideoIds: [`${stageId}-video`],
    transferQuestionId: `${stageId}-transfer`, fallbackExplanationId: `${stageId}-explanation`,
    nextStageId: index + 1 < ordered.length ? `stage-${String(index + 2).padStart(2, '0')}` : null,
  }
}
