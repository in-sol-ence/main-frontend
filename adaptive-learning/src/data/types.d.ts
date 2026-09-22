/** Runtime validation lives in ../curriculum.js. Import JSON through Session & content. */
export type ConceptId = string
export interface Concept {
  /** Unique contiguous zero-based position. Keep stable within a curriculum version. */
  index: number
  name: string
  description: string
  prerequisites: ConceptId[]
}
interface Resource {
  id: string
  conceptIds: ConceptId[]
  sourceIds?: string[]
}
interface QuestionBase extends Resource {
  stageId: string
  questionText: string
  answerExplanation: string
  /** Optional separate written resource for expanded answer feedback. */
  explanationId?: string
  difficulty: string
  prerequisiteConceptIds: ConceptId[]
}
export type Question = QuestionBase & (
  | { questionType: 'multiple_choice'; choices: { id: string; text: string }[]; correctAnswer: string }
  | { questionType: 'numerical'; choices?: []; correctAnswer: { value: number; tolerance: number } }
  | { questionType: 'short_answer'; choices?: []; correctAnswer: { acceptedResponses: string[] } }
)
export interface Video extends Resource {
  title: string
  creator: string
  /** null is allowed only in an explicitly marked development fixture. */
  url: string | null
  startTime: number
  endTime: number
  segmentDuration: number
  description: string
  /** Content-author supplied verification metadata; not a claim by the player. */
  verification?: { checkedAt: string; method: string; notes: string; status?: 'timing-unverified' | 'transcript-verified' }
}
export interface Explanation extends Resource { title: string; content: string }
export interface Stage {
  stageId: string
  title: string
  purpose: string
  conceptIds: ConceptId[]
  prerequisiteConceptIds: ConceptId[]
  coreQuestionId: string
  remediationVideoIds: string[]
  transferQuestionId: string
  fallbackExplanationId: string
  nextStageId: string | null
}
export interface Curriculum {
  id: string
  version: number
  isFixture: boolean
  title: string
  firstStageId: string
  concepts: Record<ConceptId, Concept>
  questions: Record<string, Question>
  videos: Record<string, Video>
  explanations: Record<string, Explanation>
  stages: Record<string, Stage>
  sources: { id: string; title: string; url: string }[]
}
