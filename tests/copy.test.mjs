import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { landing } from '../copy/landing.js'
import { demo } from '../copy/demo.js'
import { journey } from '../copy/journey.js'
import { conceptStages } from '../src/concept-sequence.js'

test('the published copy matches copy/, so a forgotten build is caught', () => {
  for (const file of readdirSync(new URL('../copy/', import.meta.url)).filter(name => name.endsWith('.js'))) {
    assert.equal(readFileSync(new URL(`../dist/copy/${file}`, import.meta.url), 'utf8'),
      readFileSync(new URL(`../copy/${file}`, import.meta.url), 'utf8'), `dist/copy/${file} is stale: run npm run build`)
  }
})

test('edited copy keeps the shapes the pages rely on', () => {
  assert.ok(landing.phrases.length > 0)
  for (const phrase of landing.phrases) {
    // Red markup must open and close within one phrase.
    assert.equal((phrase.match(/\[/g) || []).length, (phrase.match(/\]/g) || []).length, phrase)
  }
  assert.ok(demo.intro.includes(demo.revealAfter), 'revealAfter appears in the intro')
  assert.equal(demo.conceptSentence.split('{phrase}').length, 2, 'conceptSentence has one {phrase}')
  assert.equal(demo.stages.length, conceptStages.length, 'one phrase per stage')
  assert.ok(conceptStages.every(stage => typeof stage.phrase === 'string' && stage.phrase))
  assert.ok(journey.topicLine.includes('{topic}'), 'topicLine names the topic')
})
