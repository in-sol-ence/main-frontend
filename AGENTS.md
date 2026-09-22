# Skatebored frontend

Read and maintain `HANDOVER.md` in the same change when files, behavior,
configuration, or verification change.

Preserve the sparse typed-text and skateboard design. Reuse existing code and
local vendor assets. Keep helpers prefixed with `_`; avoid needless abstractions.
The scene is intentionally fixed to the user's settings; do not add a tuning UI.
Maintain the exact phrase list, reduced-motion support, readable transcript,
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
`src/` require `npm run build`; it outputs only `dist/knowledge/`. Run `npm test`
for all transition, text interaction, and knowledge-space geometry tests. Next erases the intro, then runs the concept sequence inside the same Knowledge
Space page. Never navigate or invoke the skateboard transition for Next. Only dynamic text changes between sequence stages; the final
John Doe selection stays visible indefinitely. Keep the original hidden back-button hook unless the
skateboard listener is deliberately updated in a future change.


The original KnowledgeField is the only knowledge renderer. Do not add point
meshes, hide the field, or switch rendering modes. Demonstration stages update
one React-owned 24-element binary mastery vector on the persistent KnowledgeScene.
Keep the original field algorithm/dataset unchanged. The source demo does not
render question markers; do not invent them without explicit clarification.
