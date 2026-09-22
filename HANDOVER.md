# Skatebored frontend handover

Updated: 2026-09-22

## Location and branch

Work only in `/Users/solom/sk/frontend`, on branch `skatebored-frontend`.
This is a Git worktree branched from the original `hello-world` repository at
`e8aed19`. Its current uncommitted frontend files were copied as the starting
point so the existing scene, assets, dependencies, and layout are reused.
The original checkout and its uncommitted changes remain untouched.

## Run and build

`dist/` is the complete static deployable build. The landing page and skateboard
remain plain JavaScript. The embedded knowledge visualization uses the original
React component, bundled locally with Vite. No runtime CDN or remote fonts.

Install dependencies with `npm ci`, then run `npm run build` after edits under
`src/`. This rebuilds only `dist/knowledge/`, preserving the existing landing
files. Run `npm test` for the transition and Demo interaction tests.

Preview: `python3 -m http.server 4173 --directory dist`
Then open `http://localhost:4173`.

Do not deploy to the original site's hosting target. The inherited
`.openai/hosting.json` references that site; deployment of this separate
frontend requires an explicitly selected destination.

## Files

- `dist/index.html`: both pre-rendered pages, actions, and a persistent sibling canvas host.
- `dist/style.css`: black page, cream oversized Helvetica text, red buttons,
  responsive layout, keyboard focus, and reduced-motion cursor styles.
- `dist/text.js`: the exact 16 requested phrases, Typed.js animation, readable
  transcript, and fixed character colors. No text editing UI.
- `dist/skateboard.js`: reused model loading, materials, controls, rendering,
  cleanup, and fixed scene configuration. No tuning/editor/export code.
- `dist/models/`: original OBJ and four texture maps, unchanged.
- `dist/vendor/`: original Three.js and Typed.js browser dependencies and licenses.
- `dist/transition.js`: reusable two-page reveal coordinator, described below.
- `tests/transition.test.mjs`: synchronization, geometry, navigation, and reduced-motion tests.
- `references/react-view-transitions/`: downloaded Vercel skill and applied workflow/CSS references.
- `AGENTS.md`: ongoing contributor guidance. Maintain this handover with changes.

## Locked settings

Page `#000000`, text `#f4dac8`, cursor `#000000`, accent `#3d2412`.
Character colors preserve the supplied export's zero-based range [66, 92)
as `#f04c4c`; every other character inherits the text color. Offsets count
newlines between phrases and are not word indices. With the replacement copy,
this spans part of “revolutionizing edtech?” and the following brand phrase.

FOV 52; framing horizontal 0.23, vertical 0.04; scale multiplier 1.06;
pitch/yaw/roll -104/142/4 degrees (XYZ radians
-1.8151424220741028, 2.478367537831948, 0.06981317007977318).
Board position [0, -0.45, 0]. Camera
[0.1328305864251409, 2.077583808205999, 6.044717163173346]; up
[-0.9042679616674021, 0.24773014936104823, 0.3477487981279509]; target [0, 0, 0.7].

Idle rotation enabled, speed 3.5; resumes 900ms after dragging; drag speed 0.7,
smoothing 0.02; zoom disabled, zoom sensitivity 1; tilt limits enabled
(1.15–1.95 radians, preserved from the original). Depth of field enabled;
focus 5.9, aperture 0.002, max blur 0.009, exposure 1.5, environment light 0.35.
Reduced-motion preference disables idle rotation and typing; double-click
resets the camera. Drag interaction remains available. Settings are fixed in
source and cannot be adjusted from a tuning page.

## Actions

Both buttons are red `#f04c4c` below the typed text.
Demo opens the knowledge introduction via the existing skateboard transition.
The page reveals the original KnowledgeScene component at “three dimensions.”
Next appears after typing completes and only deletes the text; there is no
navigation or additional progression. The old back-button DOM hook is retained
hidden so the unchanged skateboard setup can attach its existing listener;
it is not part of the visible interface.
Contact us links to `mailto:sol.mahajan@utexas.edu`.

## Verification

JavaScript syntax checks and `git diff --check` passed.
Browser rendering checked at 1440×900 and 390×844, with no horizontal overflow
on mobile. The model and textures load, typed text animates, red buttons render,
and the tuning panel is absent. Drag and double-click reset were exercised.
No browser errors; the reused Three.js Clock produces a deprecation warning.
Before the transition change, a DOM harness verified all 16 phrases, reduced-motion
initial rendering and preference changes, mailto destination, and then-disabled Demo. The scene's
reduced-motion behavior is retained in source (not OS-emulated in the browser).
The original scene framing is intentionally preserved on mobile, so the large
rotating skateboard can extend beyond the viewport.


## Reusable skateboard transition (2026-09-22)

Source skill: https://github.com/vercel-labs/agent-skills/blob/main/skills/react-view-transitions/SKILL.md
Read the downloaded skill plus `references/implementation.md` and
`references/css-recipes.md` before extending this behavior.

Audit: plain static JavaScript, no React/Next router, Suspense, lists, or native
View Transition usage. Navigation map: Home → Demo and Demo → Home both use the
explicitly requested left-to-right skateboard wipe; mailto remains external.
The skill's readiness, persistent-element separation, reusable transition, and
reduced-motion guidance is applied. React `<ViewTransition>` is not introduced:
it would add a framework and snapshot lifecycle to a live WebGL transition.
There are no snapshot crossfades, fades, deferred page mounts, or navigation fetches.

Both `.page` sections exist from initial HTML. The canvas host sits outside them
and remains mounted above them. Its renderer has alpha; the instance's bokeh
shader preserves alpha instead of forcing an opaque background. Vendor files
are unchanged. OrbitControls receives events on `#pages`; action pointerdowns
are excluded so buttons remain usable underneath the transparent canvas.

`createSkateboardTransition({ pages, viewer, duration = 1400 })` returns
`navigate(pageElement)`, `tick(time)`, and `active`. Call tick from the existing
render loop. All destination assets/data must already be ready before navigate.
The viewer implements begin(), move(progress) returning the actual trailing-edge
X in CSS pixels, and finish(pageId). Navigation resolves true when finished;
repeat/in-flight/unknown destinations resolve false. Focus moves to the incoming
`[data-page-heading]`; outgoing content is inert and aria-hidden.

During each sweep the same Three.js model is drawn with an orthographic camera,
a fixed side-on riding pose, and precise vertex bounds. At sweep start, XYZ
rotation `(π/2, π/2, 0)` maps model +Z (length) to screen-right and model +Y
(deck-up) to screen-up, leaving the wheels below the deck. The pose remains
constant throughout the sweep; no progress-dependent tilt or rotation is applied. Translation puts its
leftmost projected edge at `progress * viewportWidth`. That returned X drives
both complementary page clips in the same render callback. Resizing uses the
current viewport; no CSS timing runs separately. The sweep material is compiled
before Demo is enabled. Original perspective framing and model pose are restored
on return home. On Demo the board is off-screen/hidden but its scene, model,
renderer and canvas remain allocated. Reduced motion swaps pages immediately.

Transition verification: all 3 Node tests pass, covering complementary clips,
repeat clicks, return navigation, resizing, reduced motion at start/mid-flight,
and projected-edge alignment at desktop/mobile dimensions. JS syntax checks and
`git diff --check` pass. Browser verification of this change remains outstanding:
the browser tool rejected access because its admin-enforced security-policy check
was unavailable. The earlier screenshots only verify the pre-transition layout.

Orientation correction: changed only the sweep pose; camera, timing, movement,
layout, and reveal clipping are unchanged. Geometry tests also assert horizontal
nose direction and deck-up/wheels-down orientation.


## Knowledge introduction page (2026-09-22)

- `src/knowledge/KnowledgeScene.jsx`: copied from
  `/Users/solom/sk/demo-example-ux/knowledge-volume-demo/src/KnowledgeScene.jsx`.
  Only adaptation: Scene accepts `background` (original default retained), used
  for its background/fog. The integration passes black to match the landing page.
  Geometry, marching cubes, material, lights, camera, and orbit/zoom are unchanged.
- `src/demo-entry.jsx`: mounts that component once with the original App defaults
  (split mastery vector, radius 12, isolation 68, original dark gloss material,
  auto-rotation off). Does not import the original App's copy or tuning sidebar.
- `src/demo-page.js`: observes existing page activation, runs the original vendored
  Typed.js at typeSpeed 65/backSpeed 28, and owns only the intro interaction states.
- `dist/knowledge/knowledge.js`: generated self-contained production bundle.
- `vite.config.js`, `package.json`, `package-lock.json`, `.gitignore`: reproducible
  build for that bundle; node_modules is ignored. Existing static assets remain.
- `tests/demo-page.test.mjs`: actual Typed.js runtime with a DOM and controlled
  timers, testing phrase reveal, no looping, deletion, stable canvas identity,
  repeat activation protection, and reduced motion.

The complete sentence is:
“Our platform embeds math in an N-dimensional space. We have restricted this
space to three dimensions so you can visualize it.”

Typing begins once the existing transition activates the Demo section, never
while the user is still on the landing page. The component is mounted and
pre-rendered at opacity zero before navigation, so the phrase trigger does not
wait on a lazy import or mount. A MutationObserver watches the actual typed text
and starts a 350ms opacity reveal in the same pre-paint microtask as the final
character of “three dimensions.” The rest of the sentence continues typing.
The component stays mounted through all text states. No timer estimates the
phrase's completion. Reduced motion renders the complete sentence/scene at once.

The Demo alone uses the landing's black/cream palette, font family, weight,
tracking and line height, with smaller headline size to fit the full paragraph
alongside the visualization. Mobile stacks these reserved areas. An invisible
sizing copy reserves the complete text footprint before typing and after erasing.
The fixed lower-right Next button is borderless and transparent with a muted
color that brightens on hover/focus. It is hidden until typing finishes and is
hidden synchronously on click. A second Typed.js instance uses its native
backspacing of existing content before an empty target string. It never touches
the React root, canvas, camera or mastery state. The final state is empty text
and a persistent interactive visualization, with no further action.

The landing markup/styles (except adding the Demo bundle script), landing
`text.js`, `skateboard.js`, and `transition.js` were not changed for this feature.
Only Demo-scoped styles replaced the old cream preview-page styling.

Validation: production build succeeds; all 6 tests pass, including the previous
transition tests. Source comparison confirms the component changes only the
background/fog prop. Browser visual/WebGL verification remains outstanding:
access to localhost was denied because the browser security-policy check was
unavailable. The tests verify text sequencing and canvas DOM preservation, not
actual GPU appearance or camera interaction.


## Knowledge Space configuration and coordinates (2026-09-22)

Current integration defaults supersede the original App defaults noted above:
Q1–Q4 and Q9–Q11 mastered; all other entries zero. Influence radius 8,
isolation/surface threshold 45, opaque `#FF1414` MeshPhysicalMaterial,
roughness .42 and metalness .25 (the original Satin preset). Clearcoat and
all existing lights remain unchanged. Auto-rotation stays off.

`src/knowledge/KnowledgeScene.jsx` adds only scene references around the
existing field: positive and negative AxesHelpers through the origin, extent
±1.15, muted distinct colors at .65 opacity; X/Y/Z Html labels anchored at
positive 1.27 in their corresponding world axes; finite 2.4×2.4 XZ GridHelper
with 12 subdivisions at y=-1.05 and .25 opacity. Lines depth-test normally
without writing depth. Labels use the existing system font and no network font.
The grid is below the marching-cubes domain, so it cannot slice the volume.
Helpers use the same untransformed world coordinates as the question dataset.
No extra canvas, renderer, coordinate transform, or dependencies were added.

Initial camera position is [3.2, 2.4, 3.9], target [0, -0.1, 0], FOV 42.
The previous damping, orbit, zoom and distance limits remain. The slightly
wider framing accommodates the grid. No camera animation or auto-fit is added.
The component's source has no individual point-marker rendering system; the
existing coordinates remain intact and still drive volume generation. This
change does not invent a separate point-marker representation.

All coordinates and the KnowledgeField generation/damping implementation are
unchanged. The standalone demo under ~/sk/demo-example-ux is untouched and
retains its configuration controls. Website styling, typewriter, Next button,
page transition, and persistent mounting behavior are unchanged. The volume
and its coordinate references reveal together at the existing phrase trigger.

References reviewed: the user-linked threejsdemos GridHelper example,
https://github.com/agents-inc/skills/blob/main/src/skills/web-3d-react-three-fiber/SKILL.md,
https://threejs.org/docs/pages/AxesHelper.html,
https://threejs.org/docs/pages/GridHelper.html,
https://drei.docs.pmnd.rs/gizmos/grid, and
https://threejs.org/manual/pages/scenegraph.html.
Native GridHelper was chosen over an infinite shader grid for finite, subtle
world-space reference lines.

Verification: build and all 7 tests pass. `tests/knowledge-space.test.mjs`
constructs the configured field with the existing MarchingCubes implementation,
checks finite nonempty geometry and floor separation, and projects the full
volume, questions, grid corners, and labels into desktop/mobile camera frustums
with margins. The 6 previous text/transition tests also pass. Browser visual
verification is still blocked by the unavailable admin security-policy check;
no visual match to screenshots is claimed (the attachment supplied text only).


## Corrected internal concept sequence (2026-09-22)

Current behavior supersedes the previous separate-page implementation and older
notes saying Next stops after deletion. There are exactly two page sections:
landing and Knowledge Space. The extra `#concepts` section and its styles were
removed. The `skatebored:navigate` event and listener were removed. Real landing
navigation still uses the original skateboard transition unchanged.

Next deletes the complete introductory sentence using Typed.js, then calls a
local `onAdvance` callback returned by `initializeConceptSequence(presentation)`.
The callback types “Here is [empty phrase] represented in the embedding space.”
inside the same `#demo-typed` span and same heading. It clears the displayed
volume/highlights inside the original scene, preserving axes/grid, and briefly
holds the empty state. There is no navigation, page fade, canvas remount, or
camera mutation. The visualization's persistent host, size and position did not
change in this correction. The intro's full text footprint remains reserved.

Only the dynamic phrase is subsequently erased/retyped:
- Integration by parts: Q1.
- U-substitution: Q2.
- Integration methods: Q1–Q8 (replaces the previously named Calculus stage).
- John Doe’s knowledge: Q1, Q2, Q3, Q4, Q12, Q17, Q20, Q22, Q24.

The last sample was generated once with Python
`Random(20260922).sample(range(1,25),9)` and sorted, then hardcoded. All positions
are existing question coordinates. These memberships are illustrative, not
learned embeddings. No random sampling happens at runtime.

`src/concept-sequence.js` coordinates the existing Typed.js runtime with the
scene. A MutationObserver responds to the exact final phrase character;
onComplete is a guarded fallback. Selection returns a promise resolved by the
existing scene frame loop once point interpolation finishes, followed by the
2000ms hold. The final phrase/selection has no loop or erase timer. Reduced
motion preserves the same stages and holds without typing/interpolation.

The original KnowledgeField now stays mounted and visible at all times. The
added instanced point mesh and point-mode branch have been removed by the latest
mastery-vector correction below. No React key or component instance changes
during progression. `src/demo-entry.jsx` calls createRoot/render only once.

Files changed: `dist/index.html`, Demo-only rules in `dist/style.css`, removal of
the navigation event adapter from `dist/skateboard.js`, `src/demo-entry.jsx`,
`src/demo-page.js`, `src/concept-sequence.js`, and the relevant tests. Build output
is `dist/knowledge/knowledge.js`.

Verification: production build, syntax/diff checks, and all 11 tests pass.
The added combined-controller test runs the actual Typed.js intro, deletion,
shell typing and all four phrases; it verifies the original page remains active,
no navigation is emitted, the canvas DOM identity and host styling persist,
visualization stays visible, and final text remains with no pending timers.
Per-stage tests check exact phrase selection, renderer-settlement gating and
2000ms holds. Existing geometry/transition tests still pass. These are automated
DOM/geometry checks, not GPU appearance verification; browser visual checks have
been blocked by the unavailable security-policy check in this environment.


## Original mastery-vector renderer correction (2026-09-22)

The added `_ConceptPoints` renderer, sphere/instance geometry, separate selected-ID
state, point mode, and hidden field group are removed. KnowledgeField and the
24-question dataset match the original standalone source byte for byte.
All existing axes/grid, lights, materials, layout, and controls remain.

`_KnowledgeExperience` in `src/demo-entry.jsx` owns the sole current mastery vector
with React useState, initialized to the configured seven mastered questions.
It always returns the same KnowledgeScene component without a changing key.
An update supplies a new 24-element binary vector. React updates props without
remounting Canvas, Scene or KnowledgeField. Camera options and OrbitControls'
initial target now have stable useMemo identities so mastery re-renders do not
reapply initial camera configuration after user orbit/pan/zoom.

Stage membership constants create predefined binary vectors once:
- Empty: all 24 values zero.
- Integration by parts: Q1 only.
- U-substitution: Q2 only.
- Integration methods: Q1–Q8, the existing nearby cluster.
- John Doe: Q1–Q4, Q12, Q17, Q20, Q22, Q24.

KnowledgeField's original damping (4.4) and original addBall mapping perform all
shrinking/growth/merging. There is no replacement volume or manual concept shape.
A read-only Scene frame observer reports when each strength differs from its
current target by less than .004. Pending updates resolve only for the exact
vector reference supplied by the parent, preventing an old React commit from
prematurely completing the next stage. Empty-state shrinking and shell typing
must both finish before the 700ms initial hold. Later stage holds remain 2000ms
after the original volume settles. No changes to text-trigger synchronization,
page navigation, or skateboard behavior. The volume's original animation is
preserved even with reduced-motion text preferences.

Important source discrepancy: the supplied standalone demo has coordinates and
a volume renderer, but NO individual mastered/unmastered point marker renderer.
The request's assertion that the original already draws these markers is not
true of the available source. The user was asked whether to retain the original
volume-only output or explicitly allow minimal markers inside that component.
Until clarified, this change prioritizes the explicit no-new-renderer/no-new-
geometry constraint; the all-zero state shows no volume plus the axes/grid.
Question coordinates are retained but unmastered markers are not drawn.

Validation: all 12 tests pass, including running the original field callback
against the real MarchingCubes implementation across empty and all four stage
vectors, verifying smooth convergence and empty/nonempty output on the same
engine instance. A checksum protects the original KnowledgeField source.
Production build, syntax and diff checks pass. DOM tests preserve canvas identity
and no navigation throughout the full Typed.js sequence. GPU appearance and
interactive camera persistence have not been browser-verified due to the
previously reported unavailable browser security-policy check.


## Cinematic traversal and synchronized reveal (2026-09-22)

This supersedes the rigid orthographic sweep described above. The same OBJ,
textures, materials, lights, composer, and render loop remain. Navigation still
uses `createSkateboardTransition`; Demo changes pages and Next only advances the
existing concept sequence. No routes, history entries, dependencies, or models
were added. The original checkout remains untouched.

- The current perspective camera freezes for each sweep, including its orbit
  position, quaternion, FOV and framing offset. Only responsive aspect/framing
  updates occur if the viewport itself changes.
- One riding parent holds the centered original board. A fixed +90-degree Y
  correction maps its length to screen-right. The parent supplies a 12-degree
  viewing tilt plus a deterministic carve: about 14 degrees peak yaw and 2.3
  degrees peak bank. Position remains independent of rotation.
- The existing 1400ms clock drives smooth acceleration/deceleration over the
  first/last 15 percent, with constant cruising velocity between them. The
  board is uniformly fitted to at most 40 percent viewport width, starts fully
  offscreen, and exits fully before cleanup. Home transforms are restored.
- Each frame projects the original mesh vertices through the unchanged camera.
  Their minimum screen X controls both page clips; offscreen values clamp at the
  viewport edges. The persistent knowledge canvas receives the matching local
  clip so it cannot cover the outgoing page or leak into Home on return.
- Demo remains disabled until its existing initialization reports ready. The
  coordinator marks the incoming section `data-entering` to start intro typing
  during the wipe, while retaining inert/focus protection until completion.
  The phrase-triggered knowledge reveal and subsequent Next sequence remain.

Changed files: `dist/skateboard.js`, `dist/transition.js`, `src/demo-page.js`,
its regenerated `dist/knowledge/knowledge.js`, and the two relevant test files.
`.gitignore` also excludes local `.pi/` debugging artifacts from version control.
The user-supplied React View Transitions, R3F patterns, Three.js animation,
GSAP timeline, MathUtils, and clip-path references were reviewed. Their shared
progress/persistent-scene guidance is applied to the existing plain JS viewer;
React/GSAP animation controllers were not added. The router demo could not be
visually inspected because browser access was blocked.

Verification: production build, all 13 Node tests, the three required JavaScript
syntax checks, and `git diff --check` pass. The geometry test executes the actual
viewer against the original OBJ at 1440×900, 390×844, and 2560×1080, sampling 61
poses each. It checks projected trailing-edge accuracy, monotonic motion,
horizontal orientation, yaw/bank limits, fully offscreen endpoints, midpoint
reveal, stationary camera, and restoration across repeat navigation. Existing
reduced-motion, clipping, resize, text, and Next-sequence checks pass.

Browser acceptance remains outstanding: two attempts were denied because the
browser tool could not verify its admin-enforced security policy. No workaround
was used and no visual/GPU verification is claimed. Preview for manual review:
`http://localhost:4176` (Python static server serving this worktree's `dist/`).
Nothing was deployed.
