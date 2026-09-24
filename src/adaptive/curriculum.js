// Validation is shared by startup, JSON imports and tests. No content lives here.
export function validateCurriculum(data) {
  function _require(condition, message) { if (!condition) throw new Error(message) }
  function _text(value) { return typeof value === 'string' && value.trim().length > 0 }
  _require(data && typeof data === 'object', 'Choose a curriculum JSON object.')
  _require(_text(data.id) && Number.isInteger(data.version) && data.version > 0 && _text(data.title) && typeof data.isFixture === 'boolean', 'Curriculum needs id, positive integer version, title and isFixture.')
  for (const key of ['concepts', 'questions', 'videos', 'explanations', 'stages']) {
    _require(data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]), `Missing ${key} dictionary.`)
  }
  _require(Array.isArray(data.sources), 'sources must be an array.')
  const sourceIds = new Set()
  for (const source of data.sources) {
    _require(_text(source.id) && !sourceIds.has(source.id) && _text(source.title) && safeUrl(source.url), 'Sources need unique ids, titles and HTTP(S) URLs.')
    sourceIds.add(source.id)
  }
  const concepts = Object.entries(data.concepts).sort((a, b) => a[1].index - b[1].index)
  _require(concepts.length > 0, 'At least one concept is required.')
  function _conceptIds(ids, label, nonempty = false) {
    _require(Array.isArray(ids) && (!nonempty || ids.length > 0) && new Set(ids).size === ids.length && ids.every(id => Object.hasOwn(data.concepts, id)), `${label}: invalid concept references.`)
  }
  for (const [position, [id, concept]] of concepts.entries()) {
    _require(concept.index === position && _text(concept.name) && _text(concept.description), `${id}: indices must be unique and contiguous from zero; name and description are required.`)
    _conceptIds(concept.prerequisites, id)
    _require(!concept.prerequisites.includes(id), `${id}: cannot require itself.`)
  }
  const visited = new Set(), visiting = new Set()
  function _visit(id) {
    _require(!visiting.has(id), 'Concept prerequisites contain a cycle.')
    if (visited.has(id)) return
    visiting.add(id)
    data.concepts[id].prerequisites.forEach(_visit)
    visiting.delete(id); visited.add(id)
  }
  concepts.forEach(([id]) => _visit(id))
  const resourceIds = new Set()
  for (const kind of ['questions', 'videos', 'explanations']) {
    for (const [id, resource] of Object.entries(data[kind])) {
      _require(!resourceIds.has(id), `${id}: resource IDs must be unique across resource types.`)
      resourceIds.add(id)
      _require(resource.id === id, `${id}: resource ID must match its dictionary key.`)
      _conceptIds(resource.conceptIds, id, true)
      _require(Array.isArray(resource.sourceIds ?? []) && (resource.sourceIds ?? []).every(source => sourceIds.has(source)), `${id}: unknown source reference.`)
      if (kind === 'questions') {
        _require(Object.hasOwn(data.stages, resource.stageId) && _text(resource.questionText) && _text(resource.answerExplanation) && _text(resource.difficulty), `${id}: missing question fields.`)
        if (resource.explanationId !== undefined) _require(Object.hasOwn(data.explanations, resource.explanationId), `${id}: unknown feedback explanation.`)
        _conceptIds(resource.prerequisiteConceptIds, id)
        _require(['multiple_choice', 'numerical', 'short_answer'].includes(resource.questionType), `${id}: unsupported question type.`)
        if (resource.questionType === 'multiple_choice') {
          _require(Array.isArray(resource.choices) && resource.choices.length >= 2 && resource.choices.every(c => _text(c.id) && _text(c.text)) && new Set(resource.choices.map(c => c.id)).size === resource.choices.length && resource.choices.some(c => c.id === resource.correctAnswer), `${id}: invalid choices or correct answer.`)
        } else if (resource.questionType === 'numerical') {
          _require(Number.isFinite(resource.correctAnswer?.value) && Number.isFinite(resource.correctAnswer?.tolerance) && resource.correctAnswer.tolerance >= 0, `${id}: numerical answers need value and nonnegative tolerance.`)
        } else {
          _require(Array.isArray(resource.correctAnswer?.acceptedResponses) && resource.correctAnswer.acceptedResponses.length > 0 && resource.correctAnswer.acceptedResponses.every(_text), `${id}: short answers need acceptedResponses.`)
        }
      } else if (kind === 'videos') {
        _require(_text(resource.title) && _text(resource.creator) && _text(resource.description), `${id}: missing video metadata.`)
        _require((data.isFixture && resource.url === null) || safeUrl(resource.url), `${id}: video needs an HTTP(S) URL.`)
        _require(Number.isFinite(resource.startTime) && resource.startTime >= 0 && Number.isFinite(resource.endTime) && resource.endTime > resource.startTime && Math.abs(resource.segmentDuration - (resource.endTime - resource.startTime)) < 0.01, `${id}: invalid video segment timing.`)
      } else {
        _require(_text(resource.title) && _text(resource.content), `${id}: explanation needs title and content.`)
      }
    }
  }
  const order = [], reachedConcepts = new Set()
  let next = data.firstStageId
  while (next !== null) {
    _require(typeof next === 'string' && Object.hasOwn(data.stages, next) && !order.includes(next), 'Stage sequence contains a missing reference or cycle.')
    const stage = data.stages[next]
    _require(stage.stageId === next && _text(stage.title) && _text(stage.purpose), `${next}: missing stage fields.`)
    _conceptIds(stage.conceptIds, next, true)
    _conceptIds(stage.prerequisiteConceptIds, next)
    const prerequisites = new Set([...stage.prerequisiteConceptIds, ...stage.conceptIds.flatMap(id => data.concepts[id].prerequisites)])
    for (const id of prerequisites) _require(reachedConcepts.has(id), `${next}: prerequisite ${id} must be assessed earlier.`)
    for (const key of ['coreQuestionId', 'transferQuestionId']) {
      const question = data.questions[stage[key]]
      _require(question && question.stageId === next && question.conceptIds.every(id => stage.conceptIds.includes(id)), `${next}: invalid ${key} mapping.`)
      for (const id of question.prerequisiteConceptIds) _require(reachedConcepts.has(id), `${question.id}: prerequisites must be assessed earlier.`)
    }
    // Only assessed concepts receive mastery. Require both questions to cover the stage.
    _require(stage.conceptIds.every(id => data.questions[stage.coreQuestionId].conceptIds.includes(id) && data.questions[stage.transferQuestionId].conceptIds.includes(id)), `${next}: both questions must assess all stage concepts.`)
    _require(Array.isArray(stage.remediationVideoIds) && stage.remediationVideoIds.length > 0 && new Set(stage.remediationVideoIds).size === stage.remediationVideoIds.length && stage.remediationVideoIds.every(id => data.videos[id]), `${next}: missing remediation videos.`)
    _require(stage.conceptIds.every(id => stage.remediationVideoIds.some(videoId => data.videos[videoId].conceptIds.includes(id))), `${next}: remediation must cover stage concepts.`)
    _require(data.explanations[stage.fallbackExplanationId] && stage.conceptIds.every(id => data.explanations[stage.fallbackExplanationId].conceptIds.includes(id)), `${next}: missing matching fallback explanation.`)
    stage.conceptIds.forEach(id => reachedConcepts.add(id))
    order.push(next); next = stage.nextStageId
  }
  _require(order.length > 0 && order.length === Object.keys(data.stages).length && reachedConcepts.size === concepts.length, 'Every stage must be reachable and every concept assessed.')
  return order
}

export function safeUrl(value) {
  try { return typeof value === 'string' && ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false }
}

export function videoLinks(video) {
  if (!safeUrl(video.url)) return { embed: null, external: null, native: null }
  const url = new URL(video.url)
  let id = null
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(url.hostname)) {
    id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]
  } else if (url.hostname === 'youtu.be') id = url.pathname.slice(1)
  if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return {
    embed: `https://www.youtube-nocookie.com/embed/${id}?start=${Math.floor(video.startTime)}&end=${Math.ceil(video.endTime)}&rel=0`,
    external: `https://www.youtube.com/watch?v=${id}&t=${Math.floor(video.startTime)}s`, native: null,
  }
  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    url.hash = `t=${video.startTime},${video.endTime}`
    return { embed: null, external: url.href, native: url.href }
  }
  return { embed: null, external: url.href, native: null }
}
