# Hello World Skateboard — Agent Handoff

Last updated: 2026-09-22

## Keep this file current

This is the canonical handoff for the project. Update it in the same change whenever you add, remove, rename, or materially repurpose a file. Also update the behavior and verification sections when the site’s controls, defaults, deployment process, or architecture change. A new agent should be able to continue the project by reading this file and the files it points to.

## Product intent

This is a deliberately minimal single-page experience: oversized typed text over one interactive 3D skateboard. Preserve the sparse Swiss-style presentation and avoid adding decorative UI or unrelated content. The user prefers small, direct changes and a basic tuning panel on the right.

Current production URL: https://hello-world-type-solom.sautinaughty.chatgpt.site

Current palette defaults:

- Page: `#EDE8D0`
- Text and panel accent: `#3D2412`
- Cursor: `#000000`

## Architecture

There is no package manager, bundler, or build step. The site is plain static HTML, CSS, and JavaScript with vendored browser dependencies.

- `dist/index.html` contains all page markup and CSS, the Typed.js phrase list, typed-text setup, and the per-selection word-color editor.
- `dist/skateboard.js` creates the Three.js scene, loads and shades the OBJ model, manages camera/orbit/postprocessing behavior, builds the live tuning controls, and exports the current settings to the clipboard.
- `.openai/hosting.json` binds this checkout to the existing Sites project. Reuse its opaque `project_id`; never create a replacement site for this project.
- `dist/models/board.obj` is the skateboard geometry.
- `dist/models/albedo.webp`, `normal.webp`, `roughness.webp`, and `metalness.webp` are the board’s PBR texture maps.
- `dist/vendor/typed.umd.js`, its source map, and `typed-LICENSE.txt` are the local Typed.js runtime and license.
- `dist/vendor/three/` contains the local Three.js ESM runtime, OBJ loader, orbit controls, room environment, postprocessing passes, shaders, and license. Keep import paths local so the site does not depend on a CDN.

## Current behavior

The heading cycles through 15 phrases using Typed.js. Inline `^milliseconds` tokens create typing pauses. Reduced-motion mode shows static text and disables automatic board rotation by default.

The skateboard:

- Uses a perspective camera, ACES filmic tone mapping, a room environment, a hemisphere light, and a directional key light.
- Uses `OrbitControls` for drag rotation. Panning is disabled. Zoom is disabled by default but can be enabled in the panel.
- Spins automatically when idle, pauses while dragging, and resumes after a configurable delay.
- Resets its orbit view on double-click.
- Uses `EffectComposer` with render, bokeh depth-of-field, and output passes.
- Disposes render resources on a non-persisted `pagehide` event.

The open right-side tuning panel provides:

- Per-selection word colors: highlight any part of the full phrase transcript and choose a color. The typing animation restarts to preview it. “Use default color” clears the selected override.
- Page, global text, cursor, and panel accent colors.
- Idle spin, direction, delay, drag speed, smoothing, optional zoom, zoom sensitivity, and tilt limits.
- Board position, scale, and rotation.
- Camera position, target, field of view, distance limits, and framing offsets.
- Depth of field, focus, aperture, blur, exposure, and environment intensity.
- Reset by page reload and “Copy settings” as formatted JSON.

Settings are session-only. They are not persisted to local storage or applied back to source automatically. Preserve this unless the user asks for persistence.

## Implementation constraints

- Make the smallest change that fulfills the request. Do not refactor neighboring code without a direct need.
- Search for and extend the existing `_control` and tuning mechanisms before introducing another UI system.
- Helper functions local to these files use a leading underscore.
- Keep the page visually minimal and keep all asset/runtime references local.
- Preserve accessibility: the typed animation is hidden from assistive technology, a readable transcript is present, controls have labels, and reduced-motion behavior must continue working.
- When changing the Three.js viewer, use the installed `threejs-product-viewer` and `threejs-loaders` skills as applicable. Use `engineering-minimal-change-engineer` for narrow modifications. Use `frontend-design` and `swiss-minimalism` only for visual design work.
- Do not edit the original downloaded asset folder at `/Users/solom/Downloads/skateboard-globe-down-in-flames/`; the copies under `dist/models/` are the site assets.

## Verification

For every JavaScript change, at minimum run:

```sh
node --check dist/skateboard.js
git diff --check
```

Also exercise the exact control or animation path changed. Useful existing temporary test dependencies may be present at `/tmp/hello-typed-check/node_modules/linkedom` and `/tmp/hello-three-vendor/package`, but they are not part of the project and must not be required by production code.

Check responsive behavior around the `760px` breakpoint when layout or typography changes. Confirm reduced-motion behavior when changing animation. Confirm both the canvas clear color and CSS page color when changing background controls because the renderer is opaque.

## Publishing

The site is hosted through Sites and is currently owner-private. Preserve that audience. Follow the installed `sites-hosting` skill and use the existing project ID in `.openai/hosting.json`. The standard flow is:

1. Read the existing Site and obtain a short-lived source-repository credential. Never print or save its token.
2. Run the Sites `site-workflow.mjs` helper in this checkout, passing credentials through its hidden stdin prompt.
3. Package the exact pushed commit, save the version, and deploy it privately.
4. Verify the returned deployment status is `succeeded`, then hand off the production URL.

Do not hand-edit the generated Git commit created by the Sites workflow, and do not create a second Sites project.
