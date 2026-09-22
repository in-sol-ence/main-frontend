# Skatebored frontend

Read and maintain `HANDOVER.md` in the same change when files, behavior,
configuration, or verification change.

Preserve the sparse typed-text and skateboard design. Reuse existing code and
local vendor assets. Keep helpers prefixed with `_`; avoid needless abstractions.
The scene is intentionally fixed to the user's settings; do not add a tuning UI.
All visitor-facing wording lives in `copy/` (landing, demo, journey); change
copy there, never as literals in code. `npm run build` publishes it to
`dist/copy/`, and the journey lines reach the spatial study as boot-hook URL
parameters. Maintain the phrase list, reduced-motion support, readable transcript,
and mailto action. Demo opens the knowledge introduction. Keep the canvas mounted
and derive both page clips from the viewer’s exact trailing-edge position.

All code and built output belong in `/Users/solom/sk/frontend`. Do not modify the
original checkout or synced project reference files. `dist/` is the static build.
Do not deploy this branch to the inherited original site's hosting target.

For JavaScript changes run `node --check dist/skateboard.js`,
`node --check dist/text.js`, `node --check dist/transition.js`,
`node --test tests/transition.test.mjs`, and `git diff --check`. Exercise changed behavior in
a browser; check desktop/mobile layout and reduced motion after visual changes.


The Demo page embeds `src/knowledge/KnowledgeScene.jsx` from the existing demo.
Preserve its renderer, camera, and state through typing and Next. Changes to
`src/` require `npm run build`; it outputs `dist/knowledge/` and syncs
`dist/spatial/`. Run `npm test` for all transition, text interaction,
knowledge-space geometry, and handover tests. Next erases the intro, then runs the concept sequence inside the same Knowledge
Space page. Never navigate or invoke the skateboard transition for Next. Only dynamic text changes between sequence stages; the final
John Doe selection holds for the same 2000ms as every other stage, one closing
screen types in the same span at the same speed, and then the page hands over to
the spatial journey. Keep the original hidden back-button hook unless the
skateboard listener is deliberately updated in a future change.


The spatial study in `spatial/` is the existing separate product and stays the
single source: it is warmed in an iframe behind the Demo and cross-faded to, not
navigated to or re-implemented. Change it only through its boot hook, and run its
own `npm test` and `npm run check*` scripts there. `dist/spatial/` is generated
by the build; never edit it. Pass the goal that routes to the intended example
map; an unmatched goal silently falls back to reinforcement learning. Pass the
background too: the study's own adaptive engine is what personalizes the route,
and every on-path note must be read off the route it produced, never asserted.
The handed-in journey states a concept's reason on click instead of entering it;
leave the standalone study's own click, entry and knowledge controls alone.
The handed-in statement types at the earlier slides' pacing and holds 2000ms.
The demonstration that follows is scripted, never pointer-driven: it reuses the
existing hover, entry, and return paths, derives the hovered topic and its
knowledge concepts from the compiled route, and shows no understanding panel.
Keep the exact hover line "John Doe wants to learn [topic]." and the exact
rationale "Our PL model targets knowledge concepts based on John Doe’s
knowledge state." Both type in the one `#narration` storytelling layer: large
bright type beside the space, away from what it explains, never under a label.
No cards, panels, boxes or tooltips. The selection's emphasis is the topic's own
point marker growing; the KCs rise out of the topic through the layer's existing
formation.


The original KnowledgeField is the only knowledge renderer. Do not add point
meshes, hide the field, or switch rendering modes. Demonstration stages update
one React-owned 24-element binary mastery vector on the persistent KnowledgeScene.
Keep the original field algorithm/dataset unchanged. The source demo does not
render question markers; do not invent them without explicit clarification.
