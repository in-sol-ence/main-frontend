import { journey } from '../copy/journey.js'

// The embedding space becomes the journey. The existing spatial study is warmed
// in place behind this page and cross-faded to; there is no navigation, no
// second copy of its scene, and no new transition vocabulary.
export const SPATIAL_GOAL = journey.goal
// What the learner already has. The study's existing adaptive engine reads this
// the same way it reads anything typed into its own background field, and it is
// what moves algebra out of the route and makes the trajectory visibly his.
export const SPATIAL_BACKGROUND = journey.background
export const SPATIAL_STATEMENT = journey.statement
export const MESSAGE = 'skatebored:spatial'
// The study reports readiness once its first frame is drawn. If it never can,
// the handoff still happens rather than stranding the viewer on the last slide.
export const READY_TIMEOUT = 8000

export function createSpatialHandoff() {
  const stage = document.querySelector('#spatial-stage')
  const frame = document.querySelector('#spatial-frame')
  const pages = document.querySelector('#pages')
  let warmed
  let entered = false

  const _begin = () => frame.contentWindow?.postMessage({ type: `${MESSAGE}:begin` }, location.origin)

  return {
    // Called while the concept sequence is still running, so the study's own
    // scene is already built and drawn by the time it is shown.
    preload() {
      if (warmed) return warmed
      warmed = new Promise(resolve => {
        // The listener outlives readiness: a study that reports in after we gave
        // up waiting is told to begin then, rather than never being started.
        const listen = event => {
          if (event.origin !== location.origin || event.source !== frame.contentWindow) return
          if (event.data?.type !== `${MESSAGE}:ready`) return
          clearTimeout(timer)
          resolve(true)
          if (entered) _begin()
        }
        const timer = setTimeout(() => resolve(false), READY_TIMEOUT)
        addEventListener('message', listen)
      })
      const query = `goal=${encodeURIComponent(SPATIAL_GOAL)}`
        + `&background=${encodeURIComponent(SPATIAL_BACKGROUND)}`
        + `&statement=${encodeURIComponent(SPATIAL_STATEMENT)}`
        // The study's own narration lines, so all copy is edited in copy/.
        + `&learner=${encodeURIComponent(journey.learner)}`
        + `&topicLine=${encodeURIComponent(journey.topicLine)}`
        + `&rationale=${encodeURIComponent(journey.rationale)}`
        + `&conceptsLabel=${encodeURIComponent(journey.conceptsLabel)}`
      frame.src = `./spatial/index.html?${query}`
      return warmed
    },
    async enter() {
      await this.preload()
      stage.removeAttribute('inert')
      stage.removeAttribute('aria-hidden')
      stage.classList.add('is-entering')
      // The page underneath is finished; nothing there is reachable again.
      pages.inert = true
      entered = true
      _begin()
      frame.focus({ preventScroll: true })
    },
  }
}
