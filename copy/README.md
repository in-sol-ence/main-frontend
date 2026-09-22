# Site copy

All wording a visitor reads in the demo lives here. Edit the text between the
quotes, then run `npm run build` to publish it into `dist/`.

- `landing.js`: the typed phrases on the first page and its two buttons.
- `demo.js`: the 3D knowledge space: intro, Next, the four stages, closing line.
- `journey.js`: the spatial path: the opening statement, the topic line, the
  RL rationale, and the goal/background that decide the route.

Tips:
- Typographic apostrophes (’) and plain ones (') both work. Inside '...' quotes,
  a plain apostrophe needs double quotes around the line instead, as in
  `"John Doe's knowledge"`.
- `{phrase}` and `{topic}` are placeholders; keep them.
- `npm test` checks that the build is up to date with this folder.

Not here: the standalone spatial study's own interface (its landing page, goal
prompt, and concept names), which is the separate product in `spatial/`, and
the page title/description in `dist/index.html`.
