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

## Screen-filling sweep, deck toward the viewer (2026-09-22)

This supersedes the sweep pose, scale, clearance and duration in the cinematic
traversal section above, and replaces an earlier same-day pose note. Nothing
else about that traversal changed: the camera freeze, constant-velocity ramp,
vertex-projected clipping, knowledge-canvas clip, restore, and readiness gating
are untouched.

Correction to the note above and to the older reusable-transition section: model
**+Y is the wheel side, and -Y is the deck's top face**. Both earlier sections
claim "+Y (deck-up)", which is wrong and put the wheels toward the viewer. The
model itself settles it: the four wheel meshes (11904 vertices each, 0.113 x
0.203 x 0.203, axis along X) are centred at y +0.107, while the full-length deck
plate (`pCube12`, 0.765 x 0.158 x 2.641) spans y -0.205 to -0.047. Verified again
by projection: the deck plate sits about one world unit nearer the camera than
the wheels across the sweep.

- Scale: the board is fitted to 1.25 times the visible width at its depth,
  replacing the previous 40 percent fit and its 3-unit cap. It measures 172
  percent of the viewport width and 86 percent of its height at 1440x900, and
  129 percent wide at 390x844, where a long board in a portrait viewport is a
  thin ribbon (24 percent of the height). It stays clear of the near plane.
- Pose, all in camera space via a ZYX euler, built by the `_pose` helper:
  roll -90 degrees about the board's own length brings the deck's top face to
  the viewer; that roll keeps travelling, -124 to -56 degrees across the sweep,
  so the board visibly rotates without ever reaching edge-on or showing its
  underside. Over it sit a constant 10-degree nose-up tilt and the existing yaw
  carve, reduced to 12 degrees peak (about 9 effective). The nose therefore
  stays within 18 degrees of the horizontal travel direction.
- Clearance: the sphere-based margin is replaced. Each end now uses the exact
  projected reach of the pose actually held there, summing every axis's worst
  box corner at its near depth. A sphere around a board wider than the screen
  overshot by seconds. Evaluating both ends at fixed progress 0 and 1 keeps the
  trailing edge monotonic; deriving them from the live pose did not.
- Duration: 1800ms to 3200ms. Because the board is far longer, its travel grew
  from about 4.0 to 6.6 NDC, so the raw duration understates the pacing: the
  board crosses at about 2.05 NDC per second, against 2.24 before.
- Consequence worth knowing: with a board wider than the viewport, the page wipe
  cannot begin until the trailing edge reaches the near screen edge. At 1440x900
  the wipe runs from about 2100ms to 3075ms (975ms of the 3200ms flight); before
  then the board is flying in over the outgoing page. The board is what hides the
  swap, and it spans the boundary to the far edge for the whole wipe.

Changed files: `dist/skateboard.js`, `dist/transition.js`, and
`tests/transition.test.mjs`. No `src/` change, so no rebuild was needed.

Verification: the three required JavaScript syntax checks, `git diff --check`,
and all 3 transition tests pass. The geometry test, which runs the production
viewer against the original OBJ at 1440x900, 390x844 and 2560x1080, now also
asserts that model -Y faces the viewer within 40 degrees (never the wheels),
that the board is wider than the viewport it sweeps, that the roll advances
monotonically and matches the pose formula, that the tilt holds at 10 degrees,
and that the board reaches past the far edge whenever the boundary it drives is
on screen. Its timing fixture was retimed for 3200ms.

Known unrelated failure: `tests/knowledge-space.test.mjs` "the original field
shrinks to empty and grows each mastery stage" fails its KnowledgeField source
checksum on a clean checkout of this branch, before and after this change.
`npm test` therefore reports 12 of 13 passing.

Browser acceptance is still outstanding: Playwright is not installed in this
checkout and installing it plus a browser download was not undertaken. The
orientation, coverage and pacing claims above come from projecting the real OBJ
through the production viewer, not from a rendered frame. Preview for manual
desktop/mobile/reduced-motion review:
`python -m http.server 4176 --directory dist`, then `http://localhost:4176`.

## Handover into the spatial calculus journey (2026-09-22)

The demonstration no longer ends on the John Doe selection. That selection holds
for the same 2000ms as every other stage, the sentence is erased, and the same
page cross-fades into the existing spatial study, which states the learner's
goal and then flies into the authored calculus path.

### What was reused rather than built

- The exit is the existing vocabulary only: the same 2000ms stage hold, the same
  full-sentence Typed.js erase the Next button already performs (backSpeed 28),
  and the existing 350ms opacity reveal used by `.knowledge-volume`. No new
  easing, duration, camera move or typography was introduced on this side.
- The spatial environment, its atmosphere and ambient field, its lighting, depth
  and type are untouched. Entering at its existing `prompt` phase is what puts
  the viewer in the floating-line space.
- The calculus path is the authored `exampleMaps.calculus` tree, reached by the
  existing goal router. The camera move from that space into the path, and the
  travel along it, are the existing 11.8s `constructionAt` choreography and
  `journey` phase. Nothing about the path was added, reordered or restyled.

### The join

`dist/index.html` gains `#spatial-stage`, a fixed full-screen host holding one
iframe, `inert` and `aria-hidden` until it is entered. It is not a `.page`, so
the skateboard transition never sees it and is never invoked for this step.

`src/spatial-handoff.js` owns the join. `preload()` is called when the concept
sequence starts, roughly twenty seconds before it is needed, so the study's
renderer and first frame already exist when it is shown. It points the iframe at
`./spatial/index.html` with `goal=Learn calculus from the beginning` and
`statement=Let’s say John Doe wants to learn calculus.`. `enter()` reveals the stage,
marks `#pages` inert, and posts a begin message. Messages are matched on exact
origin and on the frame's own window. If the study never reports ready, an 8s
fallback hands over anyway; if it reports ready late, it is told to begin then,
so a slow load cannot leave a motionless space.

Passing the goal matters: `buildJourney`'s router falls back to reinforcement
learning for anything it does not recognise. The string used here matches the
existing calculus pattern, and a test asserts the compiled map is the calculus
one with `fallback` false.

### The spatial boot hook

`spatial/` is otherwise unchanged. The hook is `spatial/src/handoff.js` plus a
contained path in `main.js`:

- `readHandoff(location.search)` returns null without a `goal`, so the normal
  front door, its landing skateboard and its prompt are completely unaffected.
- With a goal, `enterFromHandoff()` skips the landing, disposes it, and arrives
  at the existing `openingPose()` in the `prompt` phase with `phaseTime` at 2, so
  the field is already present for the cross-fade rather than fading up into it.
- `#handoff-statement` is a paragraph inside the existing `#goal-form`, carrying
  the exact treatment of the prompt label it stands in for. `[data-handoff]`
  hides the form's other children, so the signature, label, support line, both
  inputs and the submit control are gone. Living inside the form means the
  statement inherits the existing prompt recession during construction, and the
  ambient field opens its pool around it through the existing `promptBounds`.
- The statement fades in over 1.1s, holds to 2.9s, then sets the goal input and
  dispatches submit, entering the existing handler unchanged. Reduced motion
  shows it at once and holds 0.45s; every stage is preserved.
- Embedded, it waits for the parent's begin message so the reveal starts when it
  is actually visible. Opened directly, `spatial/index.html?goal=...` begins
  immediately, which is how to review this half on its own.

### Build and deployment

`dist/` is the deployable and now contains the study it hands over to, so
`npm run build` runs `scripts/sync-spatial.mjs` after Vite. It regenerates
`dist/spatial/` from `spatial/{index.html,style.css,src,vendor}`; the dev
server, tests, README and logs are not deployed. `spatial/` is the single
source. Editing `dist/spatial/` directly will be overwritten, and a test fails
if the copy has drifted from the source, which is what catches a forgotten
build. `spatial/server.mjs` also routes the new module for its own dev server.

### Verification

Root `npm test` is 17 of 18, spatial `npm test` is 127 of 127, the three
required syntax checks, both spatial check scripts, and `git diff --check` pass.
The one root failure is the pre-existing `knowledge-space.test.mjs` KnowledgeField
checksum, which fails identically on a clean checkout of this branch.

New coverage: the sequence test now runs the real Typed.js through all four
stages and out, asserting the 2000ms hold, that the erase only shrinks the
sentence, that warming happens once while the sequence runs, and that the
handover happens exactly once and only after the erase, under both motion
preferences. The combined controller test still asserts no navigation and no
canvas replacement across the whole run, now ending erased and handed over.
`tests/spatial-handoff.test.mjs` runs the real module against the real
`dist/index.html`: the URL and goal, that warming shows and takes over nothing,
that foreign-origin and foreign-source messages cannot start it, the reveal and
retirement of the page beneath, the timeout and late-ready paths, and that the
built `dist/spatial/` matches its source. `spatial/tests/handoff.test.mjs`
covers parsing, the calculus routing, and the statement envelope.

Not verified: no browser has run this. Playwright is not installed here, so the
cross-fade, the statement's appearance in the space, the camera's entry into the
path, mobile layout and reduced motion are all unexercised visually. The tests
are DOM, URL and geometry level. Two WebGL contexts are alive during the
handover, because the React knowledge scene keeps rendering behind the opaque
iframe; if the journey stutters, retiring that scene after the cross-fade is the
first thing to try. Serve the build and click through Demo, Next, then wait:
`python -m http.server 4176 --directory dist`, `http://localhost:4176`.

## Closing screen and the personalized path (2026-09-22)

Builds on the handover above; nothing in the existing visual language, spatial
environment, path or transitions was redesigned. The full sequence is now:
John Doe's knowledge state → what Skatebored does with a syllabus → his goal →
a trajectory shaped by what he already knows → a concept → why that concept.

### One more screen, in the same voice

After the John Doe selection's existing 2000ms hold, the sentence is erased and
`closingSentence` is typed into the very same `#demo-typed` span, at the same
typeSpeed 65 and backSpeed 28, and held for the same 2000ms before it is erased
and the page hands over: "Skatebored maps complex syllabi directly into custom
trajectories across our n-dimensional space." The knowledge volume stays
mounted and visible behind it. No new element, duration or type was introduced;
`_erase` is the existing erase, now shared by both steps.

### The trajectory is actually personalized

The handoff also passes `background=I know algebra`, filled into the study's own
"I already know" field beside the goal. That is not decoration: the existing
adaptive engine reads it, marks Algebra Foundations and Functions known, and
moves them out of the forward route into foundations laid out small and early,
so the journey itself begins at Limits and runs Derivatives → Integrals →
Differential Equations → Applications. The route the viewer flies is the one the
engine produced.

### Why this concept, on hover

`personalNotes(map)` reads that compiled route and writes one short line per
concept into the concept's existing `annotation.detail`. Nothing new renders:
`.concept-annotation` is the study's own hover annotation, already positioned
above its label, already faded in by the existing focus weight, already styled
as small quiet type rather than a tooltip. The lines are derived, never
asserted: known concepts say he already knows them, the first forward concept
says he needs it first, the last says where he is heading, and the rest name the
concept the route puts before them. A test fails if any note claims knowledge
the compiled `learnerState` does not hold.

### Why this concept, on click

In the handed-in journey a click states a concept's reason instead of entering
it. `selectConcept` holds the selection, and its envelope drives the layer's
existing `learningWeight`, which the journey's own speed law already uses to
still travel for in-space reading and then resume. So the camera settles on the
concept, `#concept-rationale` fades in under its label carrying "Our RL model
targets this knowledge concept based on John Doe's knowledge state", it holds,
and then both release and travel continues. Moving to another concept carries
the hold so the journey does not lurch between reasons. The line uses the
annotation's own typography and is positioned from the existing hit candidate,
so it is projected type rather than a panel.

Two deliberate consequences, both scoped to the handed-in journey only and both
easy to revert if you disagree:
- Clicking no longer enters a concept as a child layer. Entering opens the
  understanding panel and the adaptive session, which is the deferred work.
- The hover "I know this" control is hidden. It mutates the learner state and
  re-plans the route, which is also deferred, and it competed with the reason.
Opened directly without a `goal`, the study still enters concepts and still
offers that control: the standalone product is unchanged.

### Verification

Root `npm test` is 17 of 18 and spatial is 129 of 129; the three required syntax
checks, both spatial check scripts, and `git diff --check` pass. The single root
failure is the pre-existing `knowledge-space.test.mjs` checksum, unchanged.

The sequence test now drives the real Typed.js out of the last stage, through
the erase, the closing sentence and its hold, to the handover, asserting the
text is only ever erased or typed and never swapped, that the closing screen is
left up for 2000ms, and that nothing hands over mid-sentence, under both motion
preferences. The spatial test runs the real engine: it asserts the background
moves algebra into foundations, that the forward route is the expected five
concepts, that every note matches the compiled learner state, that applying them
changes only the detail and not the category, and that with no background no
note claims prior knowledge. The rationale envelope is asserted to rise once,
reach a full stop, fall once and release.

Still not verified in a browser: Playwright is not installed here. The hover
annotation copy, the rationale's placement under a label, the camera's settle
and resume, and the closing screen's fit at mobile widths are all unexercised
visually. `spatial/index.html?goal=Learn%20calculus%20from%20the%20beginning&background=I%20know%20algebra&statement=John%20Doe%20wants%20to%20learn%20calculus.`
opens that half directly and begins immediately, which is the fastest way to
review the path interactions without sitting through the demo.

## Typed statement and the scripted concept demonstration (2026-09-22)

Builds on the two sections above and changes only the handed-in journey. The
earlier slides, the knowledge space, the closing screen, the cross-fade, the
spatial environment and the calculus path are untouched. The sequence is now:
John Doe's knowledge state → what Skatebored does with a syllabus → "Let’s say
John Doe wants to learn calculus." typed into the space → the calculus path →
the system hovers the first concept on his route and says what he wants to
learn → it opens that concept → its knowledge concepts appear → the PL rationale
→ everything fades and the journey continues.

### The statement types

`SPATIAL_STATEMENT` is now exactly "Let’s say John Doe wants to learn
calculus." `statementAt(seconds, length, reduced)` in `spatial/src/handoff.js`
reveals it a character at a time at `TYPE_INTERVAL` (81.25ms, the mean of
Typed.js's humanized typeSpeed 65 that types every earlier slide; the study has
no Typed.js and needs none for one deterministic line), holds `STATEMENT_HOLD`
2s, the same 2000ms as every stage before it, and only then submits the goal.
It never fades in: `#handoff-statement` lost its `opacity: 0` and gained a
`min-height` so the form does not reflow as the first character lands. Reduced
motion shows the full line and holds .45s, as before. `advanceHandoff` in
`main.js` only writes the text when the shown prefix changes.

### The demonstration is scripted, not built

`demonstrate(dt, active)` in `main.js` runs each journey frame of a handed-in
journey, between transitions, and returns the concept the system is hovering.
It is a small state machine over existing behaviour; nothing new is rendered:

- `approach`: `HOVER_DELAY` 1.4s after the constructed journey begins, it
  looks for the landmark candidate of `firstConcept(map)`, which is
  `route.forward[0]` off the engine's own compiled route (Limits, given the
  algebra background; Algebra Foundations without it). `hoverable()` is the
  pointer's own hit window (depth 6–155) plus a legible label (opacity ≥ .3).
- `hover`: that candidate is fed to the layer's existing `focus.update` in
  place of a pointer hit, so the existing spring brightens and scales the label,
  slows travel, and reveals the existing `.concept-annotation`. Its detail line
  for the first forward concept is now "John Doe wants to learn Limits.", set by
  `personalNotes`, so the hover statement names the actual topic. Held
  `HOVER_HOLD` 2.4s.
- `entering`: the existing `requestEnter(candidate)` is called, exactly as a
  click would; the existing hold, `CameraPassage` dive (about 4.8s here) and
  child layer at the concept follow. Its knowledge concepts are the authored
  ones: Approaching a Value, One-Sided Limits, Continuity. In a handed-in
  journey the enter completion no longer calls `openUnderstanding()`, so no
  panel and no adaptive check open; the breadcrumb `#spatial-context` and the
  "Understand …" control are hidden for handed-in journeys too.
- `reveal`: `REVEAL_DELAY` 1.2s after arrival, once the KC labels are up,
  `#concept-rationale` shows `RATIONALE`, now exactly "Our PL model targets
  knowledge concepts based on John Doe’s knowledge state.", through the existing
  `rationaleAt` envelope (rise .6s, hold 3.4s, fall .9s) driving the child
  layer's `learningWeight`, so the existing speed law stills travel while it is
  read. It is placed by the shared `placeRationale` under the label of the
  first KC the child route lists, or the nearest legible one; the click-selected
  reason uses the same helper.
- `returning`: the existing `requestReturn()` flies back to the parent at its
  saved pose and the calculus journey continues from where it was held.

While the demonstration runs, wheel, arrow/Enter/Space keys and canvas clicks
are ignored, so the viewer cannot break the script or move the camera under it;
afterwards the existing hover and click-to-reason behaviour is available again.
New journey clears the demonstration. `canvas.dataset.demonstration` exposes
the stage. If the target concept is never legible, or an enter/return is
refused, the demonstration simply ends and travel continues.

### Verification

Root `npm test` is 17 of 18 (the pre-existing `knowledge-space.test.mjs`
checksum), spatial `npm test` is 130 of 130, the three required syntax checks,
all seven spatial check scripts, `npm run build`, and `git diff --check` pass.
`dist/spatial/` was regenerated and matches `spatial/`.

`spatial/tests/handoff.test.mjs` now asserts the statement reveals exactly one
character per step and never submits mid-sentence; that the first concept and
its "wants to learn" line come off the compiled route under both backgrounds;
the exact PL rationale; and, running the real layer, camera passage and child
layer without WebGL, that at `HOVER_DELAY` the first concept is hoverable and
mid-frame while the camera is already moving, that the focus is fully up well
inside `HOVER_HOLD` and slows travel, that it can be entered, that all three
KCs are legible by `REVEAL_DELAY` with the anchor on screen, and that the
learning weight brings the child's travel to rest inside the rationale hold.

Browser verification, study half: Playwright is still not installed, but the
built study was run in headless Chrome 153 (SwiftShader WebGL) driven over its
debugging protocol at 1440×900, polling the page's own state each frame and
capturing a frame per stage. Observed in order: the statement typing a
character at a time in the floating-line space, the complete sentence held,
construction, the journey, `demonstration=hover` with `focus=0:calculus-2` and
the annotation "Mathematics · Foundation / John Doe wants to learn Limits."
above the brightened Limits label mid-frame, entry to `layer=calculus-2` at
`depth=1`, the three KC labels with the PL rationale under "Approaching a
Value" rising to opacity 1, holding, and fading once, the return to
`depth=0`, and travel continuing on the calculus path. `#concept-understanding`,
`#spatial-context` and `#reopen-understanding` stayed hidden throughout. Under
SwiftShader the frame clock is clamped, so the run is slower than real time
but the stage order and holds are the page's own. Not browser-driven: the
landing → knowledge → cross-fade path in front of it (its only change here is
the statement string, covered by the root tests), mobile widths, and reduced
motion. Serve `dist/` and click Demo, then Next, or open the study half
directly:
`spatial/index.html?goal=Learn%20calculus%20from%20the%20beginning&background=I%20know%20algebra&statement=Let%E2%80%99s%20say%20John%20Doe%20wants%20to%20learn%20calculus.`

## Cinematic narration for the scripted demonstration (2026-09-22)

Supersedes the placement and typography of the two demonstration sentences in
the section above. The spatial path, camera system, passages, KC data, route
and overall aesthetic are unchanged. The small hover annotation and the small
`#concept-rationale` under a label are gone from the demonstration; both
sentences now belong to one storytelling layer.

### The storytelling layer

`#narration` (in `spatial/index.html`, `aria-hidden`; the full sentence is sent
once to the existing `#journey-status` live region) is large, bright type
beside the space: the handed-in statement's voice (Segoe UI 300, -.035em) at
`clamp(28px, 2.9vw, 44px)` (41.8px at 1440 wide), `#f4f2e9`, with a soft
shadow in the space's own black and no panel. A small eyebrow in the journey
eyebrow's letterspaced caps states the hierarchy: "Calculus from the Beginning
→ Limits" for the topic, "Limits → Knowledge concepts" for the KCs. The untyped
remainder is laid out invisibly (`.narration-rest`) so the lines wrap where they
end and nothing reflows while it types.

`narrationPlacement()` in `spatial/src/handoff.js` puts it on the side away from
what it explains, chosen once per sentence: level with the selected topic, and
below the cluster of legible KC labels for the PL sentence. Under 720px wide it
runs along the bottom under the visualization. `main.js` eases it toward that
placement so camera drift never drags it, and passes its box as the existing
`readingSpace` so labels it would cover dim instead of colliding.

### Sequence and timing

`approach` (1.4s into the journey) → `hover`: the existing focus spring on
Limits plus `focus.emphasis`, which grows the topic's own point marker 2.6×,
brightens its stem and footprint, and hides its small annotation outright.
The existing learning weight settles travel to near rest (`NARRATION_STILLNESS`
.8) so the topic stays in frame. After `NARRATION_LEAD` .8s the sentence types at
`TYPE_INTERVAL` (the slides' pace) and holds `NARRATION_HOLD` 2.8s. The existing
simulated click, hold and `CameraPassage` then run while the sentence fades over
.7s. During the dive the child layer runs its own construction formation
(`emergenceAt`, 3.2s), opened from where the viewer arrives, so the path draws
out of the topic and the KCs rise out of it in order. `REVEAL_DELAY` 1.2s after
arrival and once emergence has let go, the PL sentence types with the same lead,
pace and hold, fades, and the existing return continues the journey.
Reduced motion shows each sentence whole, holds 2.2s, and shows KCs at once.
A post-demonstration click reason uses the same layer, fully shown, with the
existing `rationaleAt` envelope.

`focus.emphasis` is set only by the demonstration and cleared by `reset()`, so
pointer hover in the standalone study is unchanged.

### Verification

Spatial `npm test` 134/134 and all seven check scripts pass; root `npm test`
17/18 (the pre-existing `knowledge-space.test.mjs` checksum); the three syntax
checks, the transition test, `npm run build` and `git diff --check` pass. New
tests cover typing/lead/hold/reduced timing, side placement at three desktop
sizes and on mobile, the emphasis being selection-only, and emergence. The
real-layer test now runs the full statement duration and asserts the topic stays
legible and settled throughout, and that KCs are absent before emergence and
all present before the PL sentence.

Browser: the built study was driven in headless Chrome (SwiftShader) at
1440×900, 390×844 and 1440×900 with reduced motion, capturing each stage.
Observed: the statement typing beside Limits with its marker enlarged and no
small annotation; the dive with the child path and three KCs rising; the PL
sentence typed below-left of the KCs; fade, return and continued travel. No
page errors. Known compromise: at 1440×900 the near ribbon of the path crosses
the lower part of the PL sentence (legible through the shadow), and on mobile
"Approaching a Value" sits off the right edge in the camera's existing framing.
Not browser-driven: the landing → knowledge → cross-fade half, which this change
does not touch.

## All copy in one folder (2026-09-22)

Every line a visitor reads in the demo now lives in `copy/`, so wording can be
edited without touching code. `copy/README.md` explains each file.

- `copy/landing.js`: the 16 typed phrases, Demo and Contact labels, email.
  The red characters are marked inline with `[brackets]` instead of the old
  hardcoded character range 66–92. Rendering is identical (verified character
  by character; the range's two red newlines were never drawn).
- `copy/demo.js`: intro sentence, the `revealAfter` trigger ("three
  dimensions"), Next, the `{phrase}` concept sentence, the four stage phrases,
  and the closing line. Question memberships stay in `src/concept-sequence.js`,
  matched to the phrases by order.
- `copy/journey.js`: learner name, spatial statement, `{topic}` line, PL
  rationale, the "Knowledge concepts" eyebrow, and the goal/background that
  select and personalize the route.

How each consumer reads it:
- `src/` imports it directly; Vite bundles it.
- `dist/text.js` is now `type="module"` and imports `./copy/landing.js`. The
  build step `scripts/sync-copy.mjs` publishes `copy/` to `dist/copy/`, so
  landing edits also need `npm run build`. `dist/index.html` no longer holds the
  button labels, mailto href, or intro `aria-label`; the scripts set them.
- The spatial study gets `learner`, `topicLine`, `rationale` and `conceptsLabel`
  through its existing boot hook (`readHandoff`), with its previous wording as
  defaults, so the standalone study is unchanged.

Not moved: the standalone study's own interface text in `spatial/`, the page
`<title>`/meta description, accessibility labels on the canvases, and the
hidden back-button hook.

Verification: root `npm test` 19/20 (the pre-existing `knowledge-space`
checksum) including the new `tests/copy.test.mjs`, which fails if `dist/copy/`
is stale or an edit breaks a placeholder, the red markup, the reveal trigger,
or the stage count. Spatial `npm test` 134/134, all spatial check scripts,
syntax checks and `git diff --check` pass. In headless Chrome the landing
button labels, mailto, typed text and transcript, the Demo intro and
`aria-label`, and Next all rendered from the copy files.

## Landing actions restyled, board slightly smaller (2026-09-22)

Supersedes "Both buttons are red `#f04c4c`" under Actions and the 1.06 scale
multiplier under Locked settings.

- The landing actions are no longer filled red blocks. They use the Demo page's
  Next vocabulary: bare Helvetica 500 text at `clamp(1.05rem, 1.45vw, 1.35rem)`,
  no fill, border or radius, 44px tap height. Demo is the phrases' red
  `#f04c4c` with a CSS `→` (`::after`, so the label in `copy/landing.js` stays
  plain) that nudges 4px on hover/focus; Contact us is 55% cream and brightens
  to full cream. Disabled Demo is 55% opacity. Focus is a 1px currentColor
  outline. Reduced motion removes the color transition and the arrow nudge.
- Board scale multiplier 1.06 → 1.02 in `dist/skateboard.js` (about 4% smaller
  on the landing). The sweep computes its own fitted scale and restores the home
  scale, so the transition is unaffected.

Verification: syntax checks, transition tests (3/3) and `git diff --check`
pass. Checked in headless Chrome at 1440×900 and 390×844, including Demo hover.

### Correction: boxed red actions (2026-09-22)

The bare-text actions above read as links, not buttons, and are superseded.
Both are square 52px-tall red boxes in Helvetica 600: Demo is solid `#f04c4c`
with black text and the `→` (brightens to `#f76a6a`, arrow nudges 4px); Contact
us is a 1.5px `#f04c4c` outline with red text that fills red with black text on
hover/focus. Focus ring is 2px cream. Reduced motion drops the transitions and
the nudge. Checked in headless Chrome at 1440×900 and 390×844.

## Running it: must be served, never opened from disk (2026-09-22)

`npm start` (`vite preview --outDir dist --port 4173 --open`) serves `dist/`
and opens `http://localhost:4173`. Opening `dist/index.html` directly
(`file://`) cannot work: Chrome blocks ES module scripts there, so
`skateboard.js`, `text.js` and `knowledge/knowledge.js` never load. The Demo
button then stays disabled, and since the copy folder moved the labels into
`text.js`, both buttons also render empty. Verified in headless Chrome: over
`file://` all three scripts fail with CORS errors; over `npm start` the labels
render and Demo opens the knowledge page. The Python server above still works.

### Correction: pill actions (2026-09-22)

Supersedes the boxed red actions. Both actions are 54px pills (50px on mobile),
echoing the deck's rounded silhouette, in Helvetica 600 17px. Demo: solid
`#f04c4c`, near-black `#160707` label, a 1px inner highlight and soft red drop
glow, and its `→` in a 40px near-black circle with a cream arrow; hover lifts
1px, brightens and nudges the arrow 3px. Contact us: dark glass (cream 5% fill,
22% cream hairline, 10px backdrop blur), cream label; hover raises fill/border.
Reduced motion removes all transitions and movement. Checked in headless
Chrome at 1440×900 (rest and Demo hover) and 390×844.
`python scripts/serve.py [port]` (default 4176) serves `dist/` with
`Cache-Control: no-store`, so a refresh always shows the latest CSS/JS; the
plain `python -m http.server` let Chrome keep a stale `style.css`.

## KC resource branches, transplanted from spatial-expansion (2026-09-22)

Branch `kc-resources`, cut from `transition-fix` at `38dff07`, so it can be
merged into `transition-fix` later with no conflicts. Nothing was merged or
cherry-picked from `spatial-expansion`; its old spatial scene, camera, layout,
typography and demo host were not brought over.

### Source

`spatial-expansion` (`65d7fc9`, based on the older `7eff360`) adds a
standalone React Three Fiber prototype in `src/resource-branches/`:
`resourceData.js` (KC id → segments), `placement.js` (seeded fan layout,
S-curve branches, grow/reveal/collapse timing), `ResourceBranches.jsx` (the
fan), `ResourceContent.jsx` (the expanded card), plus a demo host with its own
fake KC, ribbon and camera (not transferred).

### What landed, in `spatial/`

- `src/resource-library.js`: the prototype's data, unchanged. Motion
  (`calculus-6-1`): MIT 18.01 pumpkin drop 243–711s, Khan 176–378s, Strang 1.1
  lecture, an explanation and a question. Tangent Slopes (`calculus-3-0-1`):
  3Blue1Brown 68–434s. Both ids exist on the current calculus map.
- `src/resource-placement.js`: `placement.js` unchanged except that `clamp`
  and `smootherstep` now come from the study's own `motion.js`.
- `src/resource-content.js`: `ResourceContent.jsx` as plain DOM: http(s)-only
  links, YouTube `t=`, a youtube-nocookie embed cut to `start`/`end` and loaded
  only on click, the question with its answer feedback, segment times, credits.
- `src/resource-branches.js`: `ResourceBranches.jsx` adapted to this study's
  architecture (no React). Branch lines live in the active layer's own
  `world.scene` at the KC's landmark anchor, scaled by the KC's depth / 6.8
  (the prototype's camera distance) and turned to face the camera. Cards are
  projected DOM in `#resource-branches`, as concept labels are. One set alive at
  a time; the prototype's portrait "ladder" shape; opening stills travel via
  the layer's existing `learningWeight` (0.9), released on collapse.
- `src/main.js` (+31 lines): `activateResources(hit)` on canvas click and
  Enter, standalone study only. Escape collapses; clicking empty space
  collapses; leaving the layer disposes the set. Cursor shows pointer.
- `index.html` gains `<div id="resource-branches">`; `style.css` gains the card
  styles (the prototype's, in the study's Segoe UI annotation voice).

### Deliberate scope limits

- Only KCs that cannot be entered qualify. Motion is such a leaf, so it now
  grows resources where a click previously did nothing. Tangent Slopes has an
  `explanation`, so its click still enters it and opens the understanding
  panel as before; its resource set is present but not yet reachable. Deciding
  where it belongs inside that panel is the open question for the merge.
- The handed-in demo journey is untouched (its click still states a reason).

### Verification

Spatial `npm test` 140/140 (ported `resource-placement.test.mjs`, and new
`resource-branches.test.mjs`: ids are real leaves on the compiled map, embeds
are private and cut to their segment, and the real fan on the real
Applications layer opens five distinct on-screen cards, stills travel, expands
the pumpkin segment in place with the others receding, collapses cleanly,
releases travel and never duplicates). All seven spatial check scripts, root
`npm test` 19/20 (the pre-existing checksum), syntax checks, `npm run build`
and `git diff --check` pass. In headless Chrome at 1440×900: goal submitted,
Applications entered, Motion clicked → five branches and cards, first card
expanded → embed `youtube-nocookie.com/embed/ryLdyDrBfvI?start=243&end=711`,
Escape → collapsed. Mobile and reduced motion were not browser-driven.

## Demonstration continues into resources, the rest of the branch, and the finale (2026-09-22)

Builds on the KC resource branches above. "PL model" is now "RL model"
everywhere (`copy/journey.js`, the study's default `RATIONALE`, tests, AGENTS).

New sequence after the rationale inside Limits:
1. `resources`: the explained KC (Approaching a Value, `calculus-2-0`, the
   child route's first KC) grows its resource branches, holding travel at the
   rationale's weight so nothing lurches. After the fan settles
   (`openDuration` + `RESOURCE_LEAD` .7s) its video card expands and the embed
   loads, exactly as clicking would; held `RESOURCE_READ` 5.5s, then collapses.
2. `repeats`: `copy/journey.js` `repeats` ("The process repeats.") types in the
   narration layer while travel resumes at the journey's own pace. Each later
   forward KC of the branch (One-Sided Limits, Continuity) is selected with the
   existing focus + marker emphasis for `PASS_HOLD` 1.8s once within
   `PASS_DEPTH` 36; the statement sits beside whichever is selected.
3. `finale`: `finaleReached()` in `handoff.js`. An adaptive branch never
   passes its last KC: layer.js's arrival law brings travel to rest
   `ARRIVAL_STOP` 14 units short of it. So the finale fires once every forward
   KC has been selected, the last selection has finished, and the camera is
   within `FINALE_LEAD` 22 of that resting point (about 20s into the branch,
   measured on the real Limits layer), or after `REPEATS_LIMIT` 40s regardless.
   The study then posts `skatebored:spatial:finale` to its parent (standalone
   it only sets `canvas.dataset.finale`). The demo no longer returns to the
   parent calculus layer. (A first version waited to pass the route end and
   never fired; a real-layer test now covers this.)
4. The page (`src/spatial-handoff.js` `onFinale`/`exit`) accepts the message
   only from its own frame and origin, once, after entering; it reverses the
   350ms cross-fade and makes the page live. `src/concept-sequence.js`
   `_finale` sets the heading label, and after 1.2s on John Doe's existing
   volume updates the one mastery vector to `finaleStage` (his nine plus Q5–Q11,
   Q13, Q14: 18 of 24, illustrative) while typing `copy/demo.js` `finale`
   ("John Doe's knowledge state after Skatebored.") at typeSpeed 65 in the same
   span. The original KnowledgeField damping performs the growth.

Resources for `calculus-2-0` in `spatial/src/resource-library.js`: 3Blue1Brown,
Essence of Calculus ch. 7 (`kfF40MiS7zA`), 292–593s, the upload's own
"Epsilon delta definition" chapter (title, channel and 1106s length read from
YouTube's public metadata); plus an explanation and a check question written
for this map. The segment's teaching content was not watched end to end.

Verification: spatial 141/141, root 20/21 (pre-existing checksum only), with a
new root test that the finale is accepted once, only from the entered study,
and restores the page; all spatial checks and the build pass.

### Correction: the finale appears at the end of the path (2026-09-22)

Supersedes step 4 above. The page no longer cross-fades away from the journey.
With the finale message the study sends `point` (view fractions, exposed as
`canvas.dataset.vanishing`) from `vanishingPoint()`: the path at the branch's
route exit, `route.end` + `ROUTE_EXIT` 25, the station where layer.js stops
drawing the line and world.js fades it out over its last 18 units, i.e. where it
converges into nothing. If that tip is out of view, the farthest in-view point of
the remaining line is used, else the centre. The page
validates it (non-finite values become the centre) and calls
`presentation.anchor(point)` in `src/demo-entry.jsx`: the one persistent
volume element is moved to a square of `min(42vw, 62vh)` centred there, kept
clear of the label's reserved area (shifted/shrunk to its right on wide screens,
below it on narrow ones; the slot's ResizeObserver stops placing it), its scene drops its background so the
canvas is transparent (`KnowledgeScene` renders `<color>` only when given a
background; fog stays black), `body.is-finale` raises `#pages` above
`#spatial-stage` with page backgrounds transparent and pointer events off, and
the volume fades in over 900ms. After 1.2s it grows to `finaleStage` while the
label types, as before. No remount, no second renderer, KnowledgeField
unchanged. `handoff.exit()` was removed.

Verification: root 21/21 (the knowledge-space checksum test now passes too),
spatial 141/141, all checks and the build pass; the finale test now asserts the
point is forwarded once, only from the entered study, that the journey stays
on screen, and that a malformed point falls back to the centre.

## Opening copy and red emphasis (2026-09-22)

The landing phrases now use plain, specific language. The brand and the key
idea in each phrase use the existing bracket markup for red text. The Demo
intro, concept sentence, closing line, and finale were tightened without
changing their timing, reveal phrase, stage count, or learning sequence.
Cream remains the default across the Demo heading and pre-journey statement.
Only the key terms in the Demo intro, concept labels, closing, and finale take
the red accent. Copy continues to come from `copy/`; `npm run build` syncs it
and the spatial stylesheet into `dist/`.

## Text fast-forward (2026-09-22)

Clicking the open page or pressing Space finishes whichever landing phrase,
Demo sentence, or concept label is currently typing. Each step keeps its
existing hold, selection, and handoff; another step does not start from the
same input. The Demo's erase animation can also be completed this way.
The spatial handoff statement and the journey's typed narration reveal their
remaining characters immediately, while their existing reading time remains.
Buttons, links, fields, and other interactive controls retain their own click
and Space behavior. The landing phrase loop resumes at the next phrase.

## Center-aligned skateboard reveal (2026-09-22)

This supersedes the trailing-edge reveal descriptions above. During the
unchanged perspective sweep, `viewer.move()` projects every OBJ vertex and
returns the midpoint of the leftmost and rightmost screen X coordinates. That
same-frame center drives both complementary page clips and the persistent
knowledge canvas clip. The board's movement, pose, scale, easing, duration,
page positions, and navigation behavior are unchanged. Completion still
unclips the incoming page only after the board exits the viewport.

The geometry test checks the actual OBJ's projected center and canvas clip at
25%, 50%, and 75% of the sweep at 1440×900, 390×844, and 2560×1080, as well as
offscreen endpoints and unchanged pose/camera. All 23 root tests, the three
required JavaScript syntax checks, and `git diff --check` pass. Browser capture
was blocked by the unavailable admin-enforced security check, so rendered
desktop, mobile, and reduced-motion screenshots could not be inspected.
