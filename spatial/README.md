# Skatebored — The adaptive learning loop

## Personalized path, on the path — handed-in journeys (0.19.2)

A handed-in journey (see the boot hook below) now also accepts `background`,
filled into the existing "I already know" field. The existing adaptive engine
does the rest: with `I know algebra` against the calculus map, algebra and
functions become known foundations and the forward route starts at limits.

Each concept's existing hover annotation carries one derived line about that
route — already known, needed first, needed after the concept before it, or the
destination. The lines are read off the compiled route, never asserted, so they
cannot disagree with the path. Clicking a concept states why the model targets
it: the existing learning weight stills travel while the reason is read, then
releases it. In a handed-in journey that click replaces entering the concept,
and the hover knowledge control is hidden. Opened without a `goal`, the study
enters concepts and offers that control exactly as before.

## Handed-in goals — boot hook (0.19.1)

An embedding page can hand this study a goal instead of the visitor typing one.
`index.html?goal=<goal>&statement=<line>` skips the front door, arrives at the
existing opening pose in the prompt phase, and replaces the prompt's text with
that single statement, using the prompt label's own treatment inside the same
form. The statement fades in, holds, then submits the goal through the existing
form handler, so discovery, the path and the journey are entirely unchanged.
Without a `goal` parameter nothing changes: the landing, prompt and examples
behave exactly as before.

Embedded in a same-origin frame it reports `skatebored:spatial:ready` and waits
for `skatebored:spatial:begin`, so the statement starts when the host has
actually revealed it. Opened directly it begins immediately. The goal must match
an existing example map's pattern; anything else falls back to reinforcement
learning. `src/handoff.js` is pure and covered by `tests/handoff.test.mjs`.

## Find your path — skateboard introduction (0.19.0)

The new front door is one physically modeled skateboard in the existing dark environment: a concave matte deck, seven laminated edges, mounting bolts, metal trucks, and shaped urethane wheels. Its restrained deck graphic is a set of fine curves with slowly travelling luminance. Idle float, tilt, and damped cursor parallax are deterministic and tightly bounded; there is no physics simulation or constant rotation.

Scroll down, swipe upward, use the keyboard, or select **Explore Skatebored ↓**. An 8.6-second controlled carving passage extends a path, follows the board, reveals the existing ambient knowledge field, and settles at the exact existing prompt camera position, orientation, and lens. The board recedes and disappears; it is not carried into the map. Reduced motion uses a short stationary dissolve instead of the camera flight. Hidden tabs pause elapsed motion.

The original prompt → discovery → RL story → recursive/adaptive learning system is unchanged. **New journey** returns to the existing prompt without replaying the introduction; a page reload replays the front door. The landing geometry is isolated in `src/landing.js` and disposed on arrival. No outside assets, packages, network requests, video, or changes to learning content are introduced.

124 tests cover the existing product plus launch envelopes, actual projected mesh clearance across seven viewport sizes, finite deck geometry, single-use entry, immutable paths, camera continuity, exact handoff, reduced motion, and bounded frame-rate-independent cursor response. Browser checks cover the deck materials, desktop and portrait spacing, scrolling and CTA entry, prompt arrival, and continuation into the existing RL story.

## A spatial product story (0.18.0)

Submit **Understand Reinforcement Learning**. The existing ambient-field convergence now leads into a roughly two-minute, progressively narrated journey. The opening adds only “A learning path built around you.” Concepts appear after the first two annotations; prerequisites lead into personalization, simultaneous learner routes, possible learning actions, a conceptual video-segment selection, and a pulled-back final landscape.

Both illustrative learners start with identical unknown mastery. Simulated observations establish A's understanding of Vectors and Matrices, removing those stops without pretending the learner knows every mathematical concept. B's incorrect response invokes the existing adaptive engine's Components prerequisite intervention, reassessment, and reconnection. Later transfer evidence removes repetition from B's route. The two fixed, subtly offset spaces converge at the same RL destination. Camera movement never rewrites their geometry. Old route variants remain faintly visible.

The **Question / Practice / Explanation / Video segment** annotations show possible next actions, not new buttons or course navigation. Near Q-Learning, a short highlighted section of an abstract timeline is connected to the Q-value-update concept. This is explicitly an illustrative selection, not a linked lecture, measured time saving, or implemented video recommendation service.

Scroll forward/back to guide both the camera and the story. Reverse travel reconstructs only the fictional demo snapshot; it never erases or injects real learner evidence. **Resume flow** continues from that moment. Hover slows autonomous travel and reveals a spatial description; clicking any visible concept follows its actual ancestor chain into the existing recursive learning space. Arrow keys inspect visible landmarks and Enter opens one. The final **Explore the map** control enters the original root map instead of forcing a quiz.

The previous navigation behavior remains within the recursive map, including real knowledge checks, prerequisite interventions, restart, and return. Reduced motion starts the story paused in a stable overview. All 118 tests pass, including stable geometry, continuous camera positions, evidence isolation, rewind/replay, distinct learner routes, spatial picking, and earlier adaptive-learning behavior. Versioned notes below are historical; this section supersedes their opening-story timing and automatic Dot Product entry.

## Calm, scrollable spatial navigation (0.17.0)

Scroll down/up to move the camera forward/back along the current 3D trajectory. A wheel gesture changes a bounded target distance; a critically damped spring glides toward it. Pixel, line, and page deltas are normalized, fine trackpad input is preserved, and queued travel is capped. There is no vertical page scrolling and no timer that takes control back.

**Resume flow** explicitly restores autonomous travel from the current position. Space remains available. In the opening story, manual travel freezes the assessment clock and follows the current route (or the shared-space rail before a route exists). Resuming blends gently back into the paused choreography without resetting evidence. In the recursive learning map, scrolling exits the current reading/check presentation without changing mastery, cancels pending automatic actions, and explores the active region. Explicit enter/return and adaptive replacement passages finish atomically before accepting wheel navigation.

Default cruise speed is 2.6 rather than 7.2 world units/second. The existing importance slowdown and smooth acceleration remain. The opening story runs at 40% of its previous rate (about 73 seconds without pauses), giving names and assessment decisions time to register. Adaptive concept gaps are about a quarter tighter, and the shared overview is more compact; the underlying cinematic spline, concepts, relationships, and learning engine remain intact.

Labels keep fixed font metrics and use a single perspective transform. Their side is chosen only on placement or viewport changes, never on zero-time redraws or hover. Collision ownership uses stable concept order/importance rather than continually changing depth rankings; occluded text fades instead of relocating. Existing world-space stems stay attached. Story labels also fade through occlusion changes rather than flickering on/off.

Navigation tests cover unit normalization, fine input, forward/reverse glide, bounds, frame-rate independence, persistent manual control, same-position resume, stable collision priority, composition, geometry preservation, and separation from assessment evidence. Earlier version notes below remain historical.

## Instruction follows understanding (0.16.0)

Submitting **Understand Reinforcement Learning** automatically starts a 29-second spatial story. There is no comparison button, profile switcher, or second map.

- The first four seconds establish a shared landscape containing the existing recursive RL concepts. Their world coordinates and ribbon vertices remain fixed.
- Both simulated learners start with identical unknown mastery. Regional diagnostics give A evidence of mathematical understanding; those regions fade from instruction and a short route through MDPs, Q-Learning, and RL emerges.
- B receives different diagnostic evidence in the same space. The camera spends more time at foundations, follows the engine's Components prerequisite intervention, teaches, reassesses, and reconnects.
- Captions disclose that assessments are illustrative. Camera time represents instruction, not measured minutes or an asserted saving. Broad simulated diagnostic observations explicitly cover individual KCs; they are not inferred from one elementary answer.
- The camera blends continuously out of the ambient field, through the landscape, and into the native recursive Dot Product environment. Ribbon coordinates never change as the camera moves; route reveal only changes the draw range.
- At the end, your own Dot Product check opens automatically. Simulated A/B evidence is never assigned to you. A correct answer advances using your actual learner state; a wrong answer visits Components, teaches, asks a practice question, and reconnects.

Use **Restart check ↺** to try the opposite answer with fresh evidence. **New journey** returns to the prompt and lets you replay the opening. Pause freezes the demonstration; reduced motion starts paused and avoids the tour camera motion. The previous seven-second overview after real answers has been removed.

Tests cover identical priors, assessment-selected routes, broad-region bypass, prerequisite/reassessment behavior, separation of simulated and real evidence, camera blend endpoints, fixed renderer geometry, and all previous learning behavior.

The versioned notes below describe earlier stages; this automatic story supersedes their entry and comparison instructions.

## Visible two-outcome test (0.14.1)

Submit **“I want to understand reinforcement learning.”**, then select **Enter Vectors ↗** in the existing scene. It travels through the same recursive hierarchy and immediately presents the magnitude question; manually entering any checked concept also presents its question directly.

- Choose **Its length**: mastery updates, **Ready to move forward** appears, and the camera automatically travels toward Matrices. The next question appears on arrival.
- Select **Restart check ↺** (or press R). This clears answer evidence, overrides, pending actions, and detours; restores the original map for the same goal/background; and returns to the same first check.
- Choose **Its direction**: **Strengthening a prerequisite** appears, and the camera automatically enters the existing Components of a Vector interior instead. Its short explanation and geometry remain for nine seconds, then a practice question appears. Answering that correctly reconnects with Vectors and asks its other question.

No extra “Try a check,” “Revisit,” or “Reconnect” click is required. Those existing controls can still advance earlier. Escape and Explore freely cancel pending automatic steps. Hidden tabs and lost WebGL contexts do not run down the reading time. Restart works during route adaptation or camera travel and invalidates outstanding work. The existing paths, geometry, question bank, mastery model, and camera passages are reused; this stage adds no concepts or new engine layer.

The earlier implementation notes below describe the original manually gated loop; the automatic delivery and fresh-state restart above supersede those interaction details.

The RL demonstration now responds to actual answers. Knowledge, learner evidence, decisions, and presentation are separate modules:

- `knowledge.js` / `knowledge-model.js`: the existing recursive graph and prerequisite relationships.
- `knowledge-checks.js`: 16 authored checks across Vectors, Components, Vector Addition, Dot Product, Probability, Matrices, MDPs, and Q-Learning. Stable choice IDs, feedback, KC identity, and evidence strength are data.
- `learner-model.js`: normalized per-KC mastery, uncertainty/confidence, fractional evidence counts, attempts, self reports, and a serializable response history. State is local to one journey and never transmitted or persisted. Reading, skipping, and self-reporting are not counted as successful checks.
- `adaptive-engine.js`: a deterministic, replaceable decision policy returning `QUESTION`, `EXPLANATION`, `EXAMPLE`, `PRACTICE`, `PREREQUISITE`, or `ADVANCE`. The policy contains no concept-name conditionals and no UI/Three.js code.
- `learning.js` / `main.js`: render actions as typography and open answer choices inside the same scene; apply mastery evidence to the existing route; follow prerequisite detours using the existing recursive camera passages.

Try **“I want to understand reinforcement learning.”** with no background. Enter MDPs and select **Try a quick check**. Choosing “The action always guarantees the destination” lowers estimated MDP mastery and makes Probability the immediate intervention. Select **Revisit Probability**: the camera returns through the existing hierarchy, then enters Probability. The original goal remains visible. Answer its practice check successfully and choose **Reconnect with Markov Decision Processes**. A different MDP item tests whether that foundation transfers. Conflicting evidence produces an example and further practice, not an unconditional advance. Correct first answers instead enable moving toward the next relevant component. These are the same initial journey and policy, not separate learner profiles.

The initial demo estimate uses fractional Beta counts (a weak one-unit prior, typically 1.8 units per distinct check). This is transparent, uncalibrated demo logic—not a validated educational assessment. Low estimates (<0.35) trigger an available weak prerequisite or a simpler explanation; middling estimates lead to a worked example and practice; estimates above 0.70 permit advancement. Repeating an item replaces its old contribution at lower strength, so retries cannot accumulate artificial certainty. Duplicate or stale submissions are ignored. Exhausted question banks say so and allow free exploration, rather than inventing assessment evidence. A prerequisite without checks can be read and then reconnected without marking it mastered. Assessment evidence stays local to its KC: a successful Probability check does not silently mark all of Probability’s untested descendants as known. Existing explicit background/manual personalization remains available.

After a response, uncertain concepts and the needed prerequisite relationship gain prominence through the existing in-place route transition. **Revisit / Reconnect** controls confirm the camera redirection; **Explore freely** keeps navigation optional. No page replacement, quiz modal, score, progress bar, video, simulated learner, or additional visual theme is introduced. Restarting the camera preserves session evidence; **New journey** clears it.

`npm run check:loop` checks the new modules. The test suite covers response-driven divergence, confidence/strength, repeat-item safeguards, question exhaustion, all six action types, prerequisite/reconnection stacks, hierarchy navigation, stable geometry identities, and existing spatial/content behavior.

## Learning inside the knowledge space

The existing concept-understanding layer now has authored content for every main RL destination and every immediate child of those destinations. The Vectors → Components → Coordinates → Axes / Ordered Coordinates branch has distinct explanations at each depth, not copies of the vector introduction. These are concise curated demonstrations, not a comprehensive generated curriculum; unseeded deeper leaves retain their existing structural descriptions.

Explanations have three learner variants: intuitive, intermediate, and advanced. `intermediateExplanation` is optional and backward-compatible with the existing JSON contract. Familiarity and relevant prior knowledge choose terminology; merely requesting an advanced goal does not imply expertise. Explicit “needed” overrides select the intuitive explanation. Examples may contain beginner, intermediate, and advanced variants in positions 0–2, falling back to the first example. The renderer and recursive structure do not depend on authored concept IDs.

The geometry remains in the active world, with screen-crisp labels projected from world anchors. Components trace the two axial movements; addition constructs the sum; projection drops a point onto the reference direction; a matrix moves its vector together with its grid. Probability stems gradually reveal a normalized distribution (the reveal is not an empirical estimator). A Q-learning example observes A → B before changing Q(A,right) from 2 to 3.3. Discounted-return geometry distinguishes one sample return from a value function’s expectation. Neural connections have restrained weighted activation; black-hole curvature is explicitly an analogy, not a spacetime or ray simulation. Reduced motion presents the final mathematical state directly.

Only background typography that overlaps the explanation recedes further while reading. No backdrop, card, panel, modal, extra scene, or automatic mastery is introduced. “I understand this” continues to use the existing in-place known-state adaptation; children and return history remain intact. Knowledge is session-local, as before. Ambient opening, discovery choreography, path, camera rig, picking, and personalized route rules are preserved.

`npm test` covers all prior spatial behavior plus three-level explanations, content coverage, compiler round trips, distinct recursive content, authored geometry, observe-before-update sequencing, label separation, known-state retention, reduced motion, and resource disposal. Educational checks include [Berkeley’s value iteration notes](https://inst.eecs.berkeley.edu/~cs188/textbook/mdp/value-iteration.html) and [OpenAI Spinning Up’s policy-gradient derivation](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html), in addition to the references below.

## Preserved opening: continuous field discovery

The opening uses 72 finite traveling cubic B-spline strands. Their three-dimensional control cages evolve while the strands accelerate through them, cross at different depths and fade before each offscreen replenishment. Six related flows provide coherent companions without a radial tunnel. Muted colors, depth attenuation, a quiet zone behind the unchanged prompt, depth-dependent edge softness and a small projected-motion footprint keep the field atmospheric.

On submission, a currently visible strand is selected from the live geometry. No strand is added. Its motion eases toward rest while neighboring trajectories bend toward its region. The camera steers toward the same strand as it continuously conforms to samples of the existing journey spline. Only after alignment does an 11.8-second passage hand visual weight to the native ribbon: one shared envelope grows its cross-section and trades opacity with the ambient strand. Concepts then rise out of their existing path anchors, followed by prerequisite relationships. Native camera position and orientation are matched exactly at arrival, including personalized starts.

The field is still one draw call with preallocated dynamic buffers. Control cages are cached once per strand per frame. The local Node update benchmark averaged about 5.3 ms; browser/frame performance depends on the device. Reduced motion freezes the field and uses the existing short hidden-pose dissolve. New journey releases the selected strand back into ambient motion. Recursive structure, authored spline, hover logic, content and normal journey camera are retained.

Tests cover actual depth/curvature changes, invisible lifecycle boundaries, selection without geometry replacement, ordered strand/ribbon/landmark emergence, camera continuity and existing map interactions. Historical implementation notes follow; the uniform-only animation and 9.2-second entry descriptions below are superseded.

# Skatebored — Study 12: a field of possible knowledge

## Opening field and path discovery

The prompt now sits inside a living field of 72 fine trajectories, arranged as six coherent flows rather than unrelated random curves. Near transverse streams cross deeper longitudinal flows. Slowly evolving bends, different drift rates, atmospheric depth, and restrained blue, violet, green, and warm tints give the space volume. A soft, invisible quiet zone follows the prompt bounds so the text remains the focus. There are no nodes, particles, labels, arrows, or extra interface elements in the field.

Submitting a valid goal starts a 9.2-second continuous camera passage in the existing world. The field begins to align, one strand converges onto samples of the **actual unchanged journey spline**, the main ribbon becomes defined, and peripheral flows soften and recede. Concept labels and prerequisite threads then emerge through the existing formation system. The passage tracks the native map camera's moving destination and hands over without replacing or resetting that camera's motion. It supports both beginner and personalized starting positions.

The field remains at a very low atmospheric presence around the root world after entry, including behind the selected path. It does not get cloned into recursive layers. New journey fades the old scene before returning to the same continuously evolving field. Background tabs do not advance time. Reduced motion freezes ambient drift and replaces the flight with a 1.4-second dissolve, hiding the field at the camera-pose switch.

`src/knowledge-field.js` owns one batched mesh, its shader, a camera matched to the existing lens, and the discovery pose function. All 72 strips share one draw call and preallocated geometry; ordinary frames update uniforms only. `src/entry.js` owns the ordered discovery/reveal envelopes. Changes to `src/main.js` are confined to opening, construction, background rendering, and resize/reset handling. The recursive model, learning content, hover, selection, knowledge-state changes, and native journey camera are unchanged.

Regression tests cover field geometry bounds and disposal, exact spline alignment for different learner starts, forward departure, frame-to-frame camera continuity, exact moving-camera handoff, reduced-motion behavior, and resource reuse. Existing map and learning tests remain part of the full suite. The computer-use review checks the actual shader, desktop/mobile prompt readability, discovery, and return to the field.

The sections below describe the previous stages. This opening replaces their empty-space/prompt-to-seed construction notes; their map and learning behavior is retained.

## The learning layer

Entering a supported concept now reveals a concise definition, a learner-specific intuition, one example, and an explanatory figure in the existing 3D layer. The camera eases toward rest through its existing speed motor, without snapping or changing its lens. The child landmarks remain present and selectable. **Continue exploring** fades the explanation and resumes normal travel; **Escape** first closes it, then returns one level. A small **Understand [concept]** action can reopen it. Root explanations are intentional rather than automatically covering the newly constructed journey.

**I understand this** is self-reported knowledge, not an assessment. It updates the existing `known` override, smoothly adapts the current and ancestor routes, and lets the temporary visual recede. It does not force the learner into another lesson or remove recursive children. New journey/reload clears these local overrides, as before. Supported leaf concepts can also be entered for their explanation, with a return action instead of invented deeper branches.

Authored content covers Linear Algebra, Vectors, Matrices, Probability, Gradient Descent, Markov Decision Processes, Q-Learning, and Reinforcement Learning, plus Black Holes, Calculus, and Neural Networks. Selected related nodes reuse these explanations; unsupported concepts remain structural exploration only. No generic decorative visual is added as a fallback.

The educational contract adds `explanation`, `intuitiveExplanation`, `advancedExplanation`, `examples`, `visualType`, and `visualData`. These fields survive compilation, adaptation, serialization, and recursive entry. `explanationFor(concept, learnerContext)` selects an intuitive or technical variant. `learning-content.js` provides the finite demo catalog and validates its data; `learning-visual.js` contains bounded figure renderers; `learning.js` owns attention, projected typography, and resource lifecycle. Future generated content can supply this same contract. There is still no content-generation service or full lesson engine.

Figures use real Three.js lines/points in the current scene, anchored when opened rather than permanently attached to the camera. Labels are crisp projected DOM text. Animations make one explanatory pass, then settle. Reduced-motion mode shows the final geometry directly. Mobile repositions text above the figure without a card, sidebar, or modal.

The regression suite adds checks for every priority concept, cross-domain content, learner variants, supported leaves, validation failures, exact numerical examples, continuous camera response, repeated entry, stable recursive landmarks, and disposal of all explanatory resources. Browser QA covers desktop, narrow screens, contextual acknowledgement, and return to exploration.

### Content references

Explanations are short original demo summaries. Their technical details were checked against primary educational references: [Berkeley CS188 on MDPs](https://inst.eecs.berkeley.edu/~cs188/textbook/mdp/markov-decision-processes.html), [Berkeley on reinforcement learning](https://inst.eecs.berkeley.edu/~cs188/textbook/rl/rl.html), [Berkeley Q-learning updates](https://www-inst.eecs.berkeley.edu/~cs188/sp21/project6/), [Stanford CS231n](https://cs231n.github.io/neural-networks-2/), and [NASA on event horizons](https://imagine.gsfc.nasa.gov/science/objects/black_holes1.html). These are not runtime dependencies. The black-hole figure is explicitly a schematic cross-section, and the neural-network pulse represents a forward signal, not training.

The following sections document the previous stages; the learning behavior above supersedes older notes about leaf entry and keyboard Escape.

## Adaptive journeys

The existing spatial system now constructs a route from the goal, stated knowledge, explicit corrections, and local prerequisite relationships. This is deterministic demo logic, not an AI model or a mastery assessment. The same concept tree powers every recursive layer. This section supersedes the historical Stage 9 implementation notes below.

- Begin with **Understanding Reinforcement Learning** and **I'm new to machine learning.** Nine landmarks form the forward journey, including foundations.
- Repeat with **I already know Python, linear algebra, probability, and calculus.** Four foundations remain small and quiet near the beginning; the forward route becomes MDPs → Value Functions → Q-Learning → Policy Learning → Reinforcement Learning. Its remaining spatial span is about 39% shorter. The ribbon itself fades at the personalized destination and the camera gently settles there.
- Hover or inspect a concept to reveal the tiny **I know this** action. Known concepts expose **I need this** instead. Corrections ease existing landmarks into new positions, update importance and relationships, and preserve the current camera and recursive location. There is no reload or scene replacement.
- Knowledge states are unknown, familiar, known, and mastered. Known parents inform descendants; explicitly requesting a deeper prerequisite restores its relevance and downgrades affected ancestors. Known concepts remain explorable.
- Goal phrases such as **focus on mathematics**, **focus on building**, or **a quick overview** alter relative emphasis, eligible ordering, and spacing while preserving prerequisite constraints. The parser is intentionally limited to demonstrated vocabulary; it is not natural-language understanding.
- **Build a robot that can navigate autonomously** combines programming, geometry, linear algebra, sensors, probability, computer vision, control, planning, and robotics in one journey, with asymmetric recursive depth.

The provider accepts `{ userGoal, userBackground, overrides }`. Compiled concepts also carry `learnerState`, `relevanceToGoal`, `estimatedDifficulty`, `baseImportance`, and `position`. Each region carries a derived forward route, retained foundations, and finite route extent. Corrections are page-local and disappear on a new journey or reload; nothing is transmitted or persisted.

Left/right arrows inspect visible concepts; Enter explores; Tab reaches the contextual knowledge action. Touch first inspects, then a second tap explores. Space pauses, R restarts the current route, and Escape returns one level. Reduced motion keeps spatial changes short and does not start automatic travel.

Validation covers adaptive ordering, negation, mastery, recursive overrides, mixed-domain depth, cycle rejection, stable landmark/camera identity, smooth reversible reconfiguration, and resource disposal, alongside the previous regression suite.

## Visual refinement

This pass preserves the existing entry, maps, spline, camera rig/lens, hover, recursive navigation, and personalization. It adds no new product functionality or scene objects.

- Stronger importance contrast and more physical perspective falloff: distant type can become smaller than 8px rather than staying artificially readable.
- The existing landmark stems rise in a shallow curve; important locations retain a restrained, elongated footprint. Hover response reaches useful clarity in roughly a quarter second, with stronger local illumination and a smooth release.
- A bounded domain tint touches only the nearby ribbon surface. The environment remains monochromatic, with no bloom pass, depth-of-field blur, particles, or added light objects.
- Default generated placements use deterministic, importance-weighted intervals, small offset variation, and varied elevations. Explicit authored layouts—including all original RL root positions—stay unchanged.
- Important concepts receive earlier anticipation within the existing 2.4-degree gaze cap. Camera position, field of view, and normal travel remain unchanged.
- Relationship trajectories fade sooner into the atmosphere and share a continuous visual budget, so dense convergence does not overwhelm the primary path.
- Mobile names wrap at a viewport breakpoint, never every frame while approaching. Wider collision clearance gives important typography breathing room; annotations are retained through resizing.
- Recursive reveal overlap is quieter: the parent starts receding before child knowledge fully emerges. The physical passage and saved parent state are unchanged.
- Picking reuses its ray/sphere/vector objects and finds the nearest hit in one pass rather than sorting an allocation per pointer frame.

The 56-test suite includes hierarchy/depth contrast, deterministic spacing, bounded domain illumination, relationship density, responsive label lifecycle, and recursive reveal continuity, in addition to the existing end-to-end model/layer regression tests. Actual desktop and narrow-screen appearance, entry, deeper exploration, and return are reviewed in the browser.

The existing spatial world now begins with a minimal Skatebored learning-goal prompt and optional prior-knowledge input. The trajectory, environment geometry, normal camera rig, lens, original RL data, hierarchy, hover, and recursive exploration are preserved. This is the standalone Skatebored experience prototype, not an integration with accounts, a dashboard, or a backend.

## Before the map

On load, only the atmosphere and prompt are visible. No RL concepts or labels are instantiated. Submit a goal with Enter or the small arrow. The prompt recedes toward a point on the actual ribbon; a shader reveal grows along the unchanged curve, landmarks appear behind the reveal front, prerequisite threads emerge, and camera travel eases in. The full sequence lasts 6.4 seconds. Reduced motion uses a short dissolve with no prompt movement or automatic travel. No network request, spinner, artificial backend delay, or chat UI is involved.

Six authored catalogs are available: Reinforcement Learning, Black Holes/Astrophysics, Calculus, Neural Networks, Game Engine Development, and Autonomous Robotics. Their concepts, local prerequisites, and recursive interiors are personalized into routes. Unsupported goals retain the original request but explicitly identify the Reinforcement Learning demo being shown. All are demonstration curricula, not generated or comprehensive courses.

For RL, try background **“I know basic Python and algebra”**. Foundations becomes retained known context rather than a forward learning requirement. Empty or beginner backgrounds retain the full forward route. A small contextual note identifies the adjustment.

The edge control **New journey** dissolves the current map, including any recursive layers, then disposes it and returns to empty space. It works while exploring or during a concept-entry passage. Goal/background inputs are local to this page and are neither persisted nor transmitted.

`buildJourney({ userGoal, userBackground })` is the asynchronous provider boundary. It returns `{ map, request, example, fallback, adapted, note }`; `map` follows the existing compiled knowledge contract. A future backend can replace example selection without changing the visualization. The construction choreography starts only after a valid map exists, and submissions are guarded against duplication. An error restores the prompt and keeps the entered text.

## Existing spatial system

Travel order remains Foundations → Probability → Linear Algebra → Optimization → Markov Decision Processes → Q-Learning → Policy & Value Functions → Reinforcement Learning. Prerequisites are now explicit data, separate from this order. This is an editorial visual sample, not an AI-generated or universal curriculum.

Probability and Linear Algebra converge at Optimization. Probability supports decision-process theory; Optimization supports Q-Learning; decision processes support policy/value ideas. Q-Learning and policy/value ideas converge at the final RL landmark. Seven selected relationships receive thin spatial geometry; remaining prerequisites are implicit in the primary journey rather than drawn as a complete network.

In the original journey, only Optimization, MDPs, and the RL goal receive a faint local illumination footprint. Child journeys use the same importance-based visual rules. All concepts use the same typographic style. Importance changes size and luminance, not the amount of UI. Domain tint is softly blended for concepts spanning fields, and supporting threads gradually take on their destination's tint. The primary ribbon remains neutral.

Every concept now contributes a smooth spatial speed envelope derived from its importance and role. Optimization, MDPs, and the RL goal receive longer, deeper slowdowns while supporting concepts pass more quickly. The existing critically damped speed motor eases into and out of each encounter; overlapping envelopes take the strongest influence rather than multiplying into a stop. Curvature-based slowing remains in place. Cruise speed is 7.2 units/second, with the strongest encounter targeting 30% of cruise.

Attention gently favors an approaching landmark, capped at 2.4 degrees without changing camera position or lens. It releases before the landmark passes so the camera never turns backward. Approaching landmarks gain at most 6% marker scale and 10% label presence; minor context becomes quieter. Relevant prerequisite threads briefly strengthen. A restrained local ribbon lift and a gradual behind-camera fade communicate progression without adding UI.

## Open

Run `npm run dev` here and open http://127.0.0.1:4181/. No installation, build, network resources, or external services are required. Three.js and its license are reused locally from the existing frontend project.

Space pauses/resumes; R returns to the beginning of the original journey. These controls intentionally have no visible interface. Reduced-motion preference starts with a still composition and replaces explicit entry/return camera flights with a restrained dissolve. Background tabs stop rendering; returning does not skip forward.

Mouse/pen hover over a landmark, its stem, or its readable label temporarily focuses that location. Three.js ray/sphere intersection uses perspective-scaled hit volumes along the actual landmark stem, complemented by projected text bounds. Nearest physical depth wins overlapping hits. A small retention margin avoids edge chatter, and targets are re-tested every animation frame even when the pointer stays still. Invisible, behind-camera, and atmospherically absent targets are excluded.

Learner attention uses its own critically damped envelope, separate from journey importance. It reduces the existing speed target without resetting distance or ever requesting a stop. Focus brightens the label, slightly enlarges the landmark, quiets unrelated concepts and atmosphere, and strengthens incident prerequisite threads. A short category and one-line explanation fade in above the label without a container. Space is reserved against nearby labels, and the annotation remains hoverable while visible. Moving away, leaving the canvas/window, or switching tabs releases focus. Reduced-motion/paused scenes allow annotation fading without automatic camera travel. Touch does not simulate sticky hover; a tap can enter an authored child journey.

## Enter and return

All eight original landmarks now contain authored interiors. The map contains **111 nodes and 39 explorable regions**, including Probability, Optimization, Markov Decision Processes, Q-Learning, and Policy & Value Functions. Linear Algebra → Vectors → Components of a Vector → Coordinates demonstrates repeated entry using the same system. Vectors contains Components, Vector Addition, and Dot Product. Q-Learning contains Q-Values, the Bellman Equation, Exploration vs Exploitation, and a Q-Table. Other branches have their own varied local prerequisites and levels of importance. Leaves remain inspectable without pretending to have more content.

Entry retains inspection for a brief beat, then follows a continuous two-part cubic camera passage through the selected region. The child ribbon's beginning is anchored at the parent's concept location in shared world space. Each interior occupies 82% of its parent's world scale, with matching inverse camera transforms and shared physical clipping planes. This gradually takes the learner into a smaller region without changing the lens or making labels unreadable. Child landmarks and relationships emerge with smooth opacity envelopes while the parent remains faint. No lens zoom, scene cut, page change, loading overlay, or new visual design is used.

The minimal lower-left context shows the current ancestry and a return arrow; Escape also returns one level. Ancestor names are also clickable: selecting one smoothly retraces the intermediate layers rather than teleporting. Parent journey distance, speed, rig, scale, and label placement are retained rather than reconstructed. The small context prioritizes the current level when space is narrow. Inputs are guarded during transitions, and leaving a child disposes its scene resources. Only the current region and its ancestry are instantiated, never all 111 concepts at once.

## Knowledge contract

Every node uses one JSON-compatible shape: `id`, `title`, `domain`, `importance`, `description`, `prerequisites`, and `children`. The compiler assigns each node a `parent` ID (the root uses `null`). An empty children array means a leaf. Prerequisite IDs refer to siblings within the current region; IDs are unique across the tree.

`compileKnowledge(input)` validates unique IDs, cycles, domains, importance, local prerequisites, optional placement hints, and pathway geometry. It assigns stable topological ordering, sparse default placements, restrained label wrapping, hierarchy roles, annotations, and selected curved prerequisite threads. Optional `layout` and `pathways` preserve authored placements, including the entire original RL journey. The renderer receives the resulting node and renders its children, without checking any concept names. A future `generateLearningMap(goal, priorKnowledge)` can supply this input contract; generation is not implemented here.

## Structure

- `src/trajectory.js`: periodic cubic B-spline with continuous position, tangent, and curvature; arc-length lookup for uniform physical travel.
- `src/world.js`: a physical four-sided ribbon, restrained directional lighting in its surface shader, perspective haze, and a quiet spatial gradient. No bloom, particles, starfield, or decorative objects.
- `src/motion.js`: unchanged frame-rate-independent damped speed control, eased startup, and an injectable `speedAt(distance)` policy.
- `src/choreography.js`: data-driven encounter envelopes, importance-responsive speed, bounded attention targets, context quieting, and departure fading. No concept-name checks or timed shot sequence.
- `src/focus.js`: spatial picking, overlap depth resolution, smooth temporary learner attention, and cycle-specific relationship relevance. The journey's importance values are never mutated.
- `src/annotations.js`: compact sample category/context copy, also included in the accessible journey text.
- `src/knowledge.js`: the authored sample tree. Original root concepts are extended without modifying their placements, importance, or hover copy.
- `src/knowledge-model.js`: generic validation, parent linkage, ordering, visual defaults, and prerequisite-path compilation; independent of sample concept IDs.
- `src/layer.js`: one reusable journey instance per depth, with its own frame, camera rig, focus, landmarks, and curved paths. Scaled local/world transforms preserve perspective and shared depth.
- `src/exploration.js`: anchored child frames, continuous camera passages, layer reveal curves, and parent history.
- `src/camera.js`: eye-height path following, anticipation, orientation damping, restrained banking, and a capped landmark-attention adjustment.
- `src/main.js`: entry/construct/journey/clear lifecycle, rendering, resize, visibility, reduced motion, keyboard controls, and WebGL recovery.
- `src/journey-provider.js`: goal matching, conservative prior-knowledge adaptation, explicit fallback, and the replaceable async generation boundary.
- `src/example-maps.js`: four additional authored recursive topic maps; no topic-specific rendering logic.
- `src/entry.js`: pure construction/reset envelopes and unobtrusive example placeholders.
- `src/concepts.js`: concept identities, domains, normalized goal importance, minor/supporting/milestone/goal roles, prerequisites, unchanged arc-length locations, and selected spatial-route parameters.
- `src/hierarchy.js`: bounded visual prominence and domain blending. Supporting concepts never receive local illumination.
- `src/pathway-layout.js`: continuous world-space branch routes that leave and rejoin the ribbon tangentially, with lateral, vertical, and longitudinal separation. Distance-based visibility keeps far relationships quiet.
- `src/pathways.js`: thin, antialiased spatial threads with depth fading, domain blending, and stable cycle pooling. No arrows, edge labels, drawing animation, or separate colored lanes.
- `src/landmarks.js`: tiny 3D points and stems attached to the path, paired with crisp projected DOM labels, restrained focus emphasis, and spatial annotations. Three pooled copies support uninterrupted repetition without moving visible landmarks.
- `src/landmark-layout.js`: world placement, perspective scaling, atmospheric fading, edge fading, and near-first overlap suppression. Labels never rotate with the camera or move away from their world anchors to solve collisions.

`npm run check` checks JavaScript syntax. `npm test` checks the existing spline, camera, motion, hierarchy, hover, and prerequisite behavior, plus recursive data integrity, unchanged root data, nested scale/projection, anchored entrances, continuous transitions, guarded entry, and history restoration. Model tests cover unfamiliar sample IDs, JSON round trips, malformed inputs, every branch's importance, and bounded relationship density. A layer integration test constructs, projects, ray-picks, focuses, and disposes all 39 authored interiors with the real Three.js modules and a lightweight typography host. WebGL appearance and navigation are additionally reviewed in the browser.

The curve and sample journeys repeat beyond the view distance; camera distance is continuous and never reset at a join. The ribbon is real narrow mesh geometry, not a screen-space line or glowing tube. Supporting threads are world-space curves with a subpixel screen-width floor for clean distant rendering. No dashboard, progress UI, cards, panels, tutorials, lessons, or AI generation is implemented.

`npm run check:entry` additionally checks the new entry modules. The 51-test suite covers all five maps, deeper renderer integration, prior-knowledge changes, explicit fallback, unchanged original data, and ordered/bounded construction envelopes. Browser checks cover the empty prompt, submission, personalized route, reset, and recursive navigation.
