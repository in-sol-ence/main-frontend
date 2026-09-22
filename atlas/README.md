# Atlas

A standalone concept demonstration for connected learning. It has its own branding, files, and local server; it does not link to or depend on the Skatebored website.

## Preview

Run `npm run dev` in this folder, then open http://127.0.0.1:4180/.

No installation or build step is required. The page uses JavaScript, CSS, SVG, and a real-time WebGL sculpture. Three.js is vendored locally with its license, so the sculpture does not depend on an external CDN. Web fonts have system fallbacks; a CSS sculpture remains available if WebGL cannot initialize.

The opening types a sample ambition, builds a curated RL map, and unfolds two levels. Any interaction hands control to the visitor. Replay restarts the sequence.

Hover a band to preview its next layer; click to hold it open. Move outside the map to return to the pinned path. Arrow keys move across concepts, Down enters an expanded layer, and Escape steps back. “Make this my goal” re-roots the map and removes relevance filtering inherited from RL.

Supported demo prompts: AI / reinforcement learning, linear algebra, and Python. Unrecognized goals are explicitly shown as the AI example. There is no model endpoint, personal-data collection, or persistence. Band widths are illustrative emphasis, not measured study time.

`data.js` contains the curated graph. `styles.css` and `sculpture.css` contain the visual design. `scene.js` creates and animates the dimensional knowledge stack, lights, terrain, and orbiting details. `app.js` handles the sequence, exploration state, and procedural background. Reduced-motion preferences are respected, with a manual motion control in the map.

Design direction: Kumo's physical focal point and floating selection cards; Etail and AICM's use of 3D objects to communicate a product's behavior. The illustration is original procedural geometry rather than an asset taken from a reference.
