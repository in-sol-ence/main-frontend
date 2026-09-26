import { test, expect } from '@playwright/test'
import { landing } from '../../copy/landing.js'
import { demo } from '../../copy/demo.js'
import { journey } from '../../copy/journey.js'

test('full sentences stay anchored while inline phrases let surrounding text flow', async ({ page }, info) => {
  test.skip(info.project.name.includes('phone'), 'Small screens show the desktop notice')
  await page.addInitScript(() => {
    window.typers = []
    let Typed
    Object.defineProperty(window, 'Typed', {
      configurable: true,
      get: () => Typed,
      set: Original => { Typed = class extends Original {
        constructor(...args) { super(...args); window.typers.push(this) }
      } },
    })
  })
  await page.goto('/')
  await expect(page.locator('#demo')).toHaveAttribute('data-ready', 'true')
  await page.evaluate(() => window.typers.forEach(typer => typer.stop()))
  await page.waitForTimeout(250)
  const shifts = await page.evaluate(async ({ landing, demo }) => {
    const shifts = []
    for (const width of [1024, 1440]) {
      // Use a fixed page width to exercise line wrapping without navigating.
      document.querySelector('#pages').style.width = `${width}px`
      for (const [selector, sentences] of [
        ['#typed', landing.phrases.map(text => text.replace(/[[\]]/g, ''))],
        ['#demo-typed', [demo.intro, demo.closing]],
        ['#concept-phrase', demo.stages],
      ]) {
        if (selector === '#concept-phrase') {
          const text = document.querySelector('#demo-typed')
          text.dataset.fullText = ''
          const [before, after] = demo.conceptSentence.split('{phrase}')
          text.replaceChildren(document.createTextNode(before), Object.assign(document.createElement('span'), { id: 'concept-phrase' }), document.createTextNode(after))
        }
        const span = document.querySelector(selector)
        for (const [index, sentence] of sentences.entries()) {
          if (selector === '#typed') window.typers[0].options.preStringTyped(index)
          else span.dataset.fullText = sentence
          span.textContent = sentence
          await new Promise(resolve => requestAnimationFrame(resolve))
          const full = Array.from(sentence, (_, index) => {
            const range = document.createRange()
            range.setStart(span.firstChild, index); range.setEnd(span.firstChild, index + 1)
            const { x, y } = range.getBoundingClientRect()
            return { x, y }
          })
          const heading = span.closest('h1').getBoundingClientRect()
          for (let length = selector === '#concept-phrase' ? 0 : 1; length <= sentence.length; length++) {
            span.textContent = sentence.slice(0, length)
            await Promise.resolve(); await Promise.resolve()
            if (selector === '#concept-phrase') {
              const suffix = document.createRange()
              suffix.setStart(span.nextSibling, 1); suffix.setEnd(span.nextSibling, 2)
              const actual = suffix.getBoundingClientRect()
              // Compare with ordinary text flow at every prefix, including empty.
              const plain = document.createTextNode(span.textContent)
              span.replaceWith(plain)
              const expected = suffix.getBoundingClientRect()
              plain.replaceWith(span)
              if (Math.abs(actual.x - expected.x) > 1 || Math.abs(actual.y - expected.y) > 1) {
                shifts.push({ selector, sentence, length, gap: true }); break
              }
              continue
            }
            const range = document.createRange()
            range.setStart(span.firstChild, length - 1); range.setEnd(span.firstChild, length)
            const actual = range.getBoundingClientRect()
            const box = span.closest('h1').getBoundingClientRect()
            if (sentence[length - 1] !== ' ' && (Math.abs(actual.y - full[length - 1].y) > 1 || Math.abs(actual.x - full[length - 1].x) > 2)) {
              shifts.push({ selector, sentence, length, actual: { x: actual.x, y: actual.y }, expected: full[length - 1] })
              break
            }
            if (Math.abs(box.y - heading.y) > 1 || Math.abs(box.height - heading.height) > 1) {
              shifts.push({ selector, sentence, length, headingMoved: true }); break
            }
          }
        }
      }
    }
    return shifts
  }, { landing, demo })
  expect(shifts).toEqual([])
})

test('journey statement and caption stay in place through typing and reading', async ({ page }, info) => {
  test.skip(info.project.name.includes('phone'), 'Small screens show the desktop notice')
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto(`/spatial/?${new URLSearchParams(journey)}`)
  await expect(page.locator('#world')).toHaveAttribute('data-phase', 'prompt')
  const statement = page.locator('#handoff-statement')
  const click = await statement.evaluate(element => {
    const before = element.textContent
    element.click()
    return { before, after: element.textContent }
  })
  expect(click.before).not.toBe(journey.statement)
  expect(click.after).toBe(click.before)
  const start = await statement.boundingBox()
  await expect(statement).toHaveText(journey.statement)
  const complete = await statement.boundingBox()
  const lineHeight = await statement.evaluate(element => parseFloat(getComputedStyle(element).lineHeight))
  expect(Math.abs(complete.height - lineHeight)).toBeLessThan(1)
  expect(complete.x).toBeGreaterThanOrEqual(0)
  expect(complete.x + complete.width).toBeLessThanOrEqual(page.viewportSize().width)
  expect(Math.abs(start.y - complete.y)).toBeLessThan(1)
  expect(Math.abs(start.height - complete.height)).toBeLessThan(1)
  await page.screenshot({ path: 'test-results/john-doe-line.png' })
  await expect(page.locator('#world')).toHaveAttribute('data-demonstration', 'hover', { timeout: 30000 })
  const caption = page.locator('#narration')
  const narrationClick = await caption.evaluate(element => {
    const typed = element.querySelector('.narration-typed')
    const before = typed.textContent
    const remaining = element.querySelector('.narration-rest').textContent
    element.click()
    return { before, after: typed.textContent, remaining }
  })
  expect(narrationClick.remaining.length).toBeGreaterThan(0)
  expect(narrationClick.after).toBe(narrationClick.before)
  const before = await caption.boundingBox()
  await expect(page.locator('.narration-rest')).toHaveText('', { timeout: 10000 })
  await page.waitForTimeout(300)
  const after = await caption.boundingBox()
  for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(before[key] - after[key])).toBeLessThan(1)
})

test('click during landing deletion clears the old phrase and starts the next', async ({ page }, info) => {
  test.skip(info.project.name.includes('phone'), 'Small screens show the desktop notice')
  await page.goto('/')
  const text = page.locator('#typed')
  const first = landing.phrases[0].replace(/[[\]]/g, '')
  await expect(text).toHaveAttribute('data-rest', /.+/)
  const click = await page.locator('#home').evaluate(element => {
    const text = element.querySelector('#typed')
    const before = text.textContent
    element.click()
    return { before, after: text.textContent }
  })
  expect(click.before).not.toBe(first)
  expect(click.after).toBe(click.before)
  await expect(text).toHaveText(first, { timeout: 30000 })
  await page.waitForFunction(first => {
    const text = document.querySelector('#typed')
    const shown = text.textContent
    if (shown.length < 3 || shown.length >= first.length || !first.startsWith(shown)) return false
    document.querySelector('#home').click()
    return text.textContent === ''
  }, first)
  const next = landing.phrases[1].replace(/[[\]]/g, '')
  await expect(text).toHaveText(next, { timeout: 15000 })
})

test('click finishes deletion throughout the demo sequence', async ({ page }, info) => {
  test.setTimeout(90000)
  test.skip(info.project.name.includes('phone'), 'Small screens show the desktop notice')
  await page.addInitScript(() => {
    let Typed
    Object.defineProperty(window, 'Typed', {
      configurable: true,
      get: () => Typed,
      set: Original => { Typed = class extends Original {
        constructor(element, options) { super(element, { ...options, typeSpeed: 1, backSpeed: 100 }) }
      } },
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: /^Learn more/ }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  const text = page.locator('#demo-typed')
  const surface = page.locator('#demo')
  await surface.click({ position: { x: 20, y: 20 } })
  const phrase = page.locator('#concept-phrase')
  for (let index = 0; index < demo.stages.length; index++) {
    await expect(phrase).toHaveText(demo.stages[index], { timeout: 15000 })
    if (index === demo.stages.length - 1) break
    await expect.poll(() => phrase.textContent(), { timeout: 15000 }).not.toBe(demo.stages[index])
    if (index === 1) await page.locator('#knowledge-volume').click()
    else await surface.click({ position: { x: 20, y: 20 } })
    await expect(phrase).toHaveText(demo.stages[index + 1], { timeout: 5000 })
  }
  await expect(phrase).toHaveCount(0, { timeout: 15000 })
  await surface.click({ position: { x: 20, y: 20 } })
  await expect(text).toHaveText(demo.closing, { timeout: 15000 })
  await expect.poll(() => text.textContent()).not.toBe(demo.closing)
  await surface.click({ position: { x: 20, y: 20 } })
  await expect(text).toBeEmpty()
  await expect(page.locator('#spatial-stage')).toHaveClass(/is-entering/, { timeout: 3000 })
})
