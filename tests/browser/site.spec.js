import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
const bloom = JSON.parse(readFileSync(new URL('../../copy/adaptive/bloom.json', import.meta.url)))
const storage = 'skatebored-adaptive-demo-v5'

async function _answer(page, question, correct = true) {
  const choice = question.choices.find(choice => (choice.id === question.correctAnswer) === correct)
  const button = page.getByRole('button', { name: choice.text, exact: true })
  await expect(button).toBeEnabled()
  await button.click()
}

async function _noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

test('landing actions, mobile framing, introduction and reduced motion', async ({ page }, info) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('button', { name: /^Learn more/ })).toBeEnabled()
  await expect(page.getByRole('link', { name: 'Try learning', exact: true })).toHaveCount(0)
  await _noOverflow(page)
  if (info.project.name.includes('phone')) {
    expect(await page.evaluate(() => document.querySelector('#skateboard').getBoundingClientRect().bottom <= document.querySelector('#home h1').getBoundingClientRect().top)).toBe(true)
  }
  await page.getByRole('button', { name: /^Learn more/ }).click()
  await expect(page.locator('body')).toHaveAttribute('data-page', 'demo')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible()
  await expect(page.locator('#knowledge-volume')).toHaveClass(/is-visible/)
  await _noOverflow(page)
  if (info.project.name.includes('phone')) {
    await expect.poll(() => page.evaluate(() => document.querySelector('#knowledge-volume').getBoundingClientRect().top >= document.querySelector('.demo-heading').getBoundingClientRect().bottom)).toBe(true)
  }
  await page.screenshot({ path: `test-results/${info.project.name}-intro.png`, scale: 'css' })
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('#spatial-stage')).toHaveClass(/is-entering/, { timeout: 35000 })
  const journey = page.frames().find(frame => frame.url().includes('/spatial/index.html'))
  await journey.evaluate(() => parent.postMessage({ type: 'skatebored:spatial:finale', point: { x: .7, y: .6 } }, location.origin))
  await expect(page.locator('#learn-link, #finale-learn')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveClass(/is-finale/)
  await expect(page.locator('#demo-typed')).toBeEmpty()
  await expect(page.locator('#spatial-stage')).toHaveClass(/is-entering/)
  expect(errors).toEqual([])
})

test('lesson completes, ignores double taps, saves and restarts', async ({ page }, info) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/learn/')
  const stages = Object.values(bloom.stages)
  const first = bloom.questions[stages[0].coreQuestionId]
  const correct = first.choices.find(choice => choice.id === first.correctAnswer)
  await page.getByRole('button', { name: correct.text, exact: true }).dblclick({ delay: 70 })
  await expect(page.getByRole('heading')).toHaveText(bloom.questions[stages[1].coreQuestionId].questionText)
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).actions.length, storage)).toBe(1)
  await page.reload()
  await expect(page.getByRole('heading')).toHaveText(bloom.questions[stages[1].coreQuestionId].questionText)
  await expect(page.locator('canvas')).toBeVisible()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `test-results/${info.project.name}-lesson.png`, fullPage: true })
  for (const stage of stages.slice(1)) {
    await _noOverflow(page)
    await _answer(page, bloom.questions[stage.coreQuestionId])
  }
  await expect(page.getByRole('heading')).toHaveText('Your knowledge, expanded.')
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).actions.length, storage)).toBe(10)
  await page.getByRole('button', { name: 'Start again' }).click()
  await page.reload()
  await expect(page.getByRole('heading')).toHaveText(first.questionText)
  await page.getByRole('link', { name: 'Back to skatebored' }).click()
  await expect(page.getByRole('button', { name: /^Learn more/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('blocked video recovers into transfer, fallback and the next question', async ({ page }) => {
  await page.route('https://www.youtube.com/iframe_api', route => route.abort())
  await page.goto('/learn/')
  const stage = Object.values(bloom.stages)[0]
  await _answer(page, bloom.questions[stage.coreQuestionId], false)
  await expect(page.getByRole('link', { name: 'Open video' })).toBeVisible()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await _answer(page, bloom.questions[stage.transferQuestionId], false)
  await expect(page.locator('.fallback')).toBeVisible()
  await page.reload()
  await expect(page.locator('.fallback')).toBeVisible()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading')).toHaveText(bloom.questions[bloom.stages[stage.nextStageId].coreQuestionId].questionText)
})

test('narrow and landscape layouts keep questions and actions reachable', async ({ page }) => {
  await page.goto('/learn/')
  for (const [width, height] of [[320, 568], [844, 390], [768, 1024]]) {
    await page.setViewportSize({ width, height })
    await _noOverflow(page)
    const button = page.locator('.answers button').last()
    await button.scrollIntoViewIfNeeded()
    await expect(button).toBeInViewport()
    await page.getByRole('link', { name: 'Back to skatebored' }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('link', { name: 'Back to skatebored' })).toBeInViewport()
  }
})

test('video readiness timeout recovers even after the player was constructed', async ({ page }) => {
  await page.addInitScript(() => {
    window.YT = { Player: class { destroy() {} }, PlayerState: { ENDED: 0 } }
  })
  await page.goto('/learn/')
  await _answer(page, bloom.questions[Object.values(bloom.stages)[0].coreQuestionId], false)
  await expect(page.getByRole('link', { name: 'Open video' })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading')).toHaveText(bloom.questions[Object.values(bloom.stages)[0].transferQuestionId].questionText)
})

test('video segment ends into transfer without granting mastery', async ({ page }) => {
  await page.addInitScript(() => {
    window.YT = {
      PlayerState: { ENDED: 0 },
      Player: class {
        constructor(mount, options) {
          this.time = options.playerVars.start
          this.iframe = document.createElement('iframe')
          mount.replaceWith(this.iframe)
          window.finishSegment = () => { this.time = options.playerVars.end }
          queueMicrotask(() => options.events.onReady({ target: this }))
        }
        getIframe() { return this.iframe }
        loadVideoById() {}
        getCurrentTime() { return this.time }
        destroy() { this.iframe.remove() }
      },
    }
  })
  await page.goto('/learn/')
  const stage = Object.values(bloom.stages)[0]
  await _answer(page, bloom.questions[stage.coreQuestionId], false)
  await expect(page.locator('.video-frame iframe')).toBeVisible()
  await page.waitForTimeout(500)
  await page.evaluate(() => window.finishSegment())
  await expect(page.getByRole('heading')).toHaveText(bloom.questions[stage.transferQuestionId].questionText)
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).actions.map(action => action.type), storage)).toEqual(['answer', 'remediation_completed'])
  await _answer(page, bloom.questions[stage.transferQuestionId])
  await expect(page.getByRole('heading')).toHaveText(bloom.questions[bloom.stages[stage.nextStageId].coreQuestionId].questionText)
})
