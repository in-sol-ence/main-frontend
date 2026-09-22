# Skatebored minimal adaptive-learning demo

A ten-stage Bloom's 2 Sigma learning demo with four exclusive presentation modes:

- knowledge visualization;
- core or transfer question;
- remediation video;
- fallback explanation after an incorrect transfer answer.

The page background is pure black. No header, navigation, progress display, score,
legend, or completion dashboard is rendered. The final screen is the knowledge
visualization with the learner's final mastery vector.

## Run

```sh
cd ~/sk/adaptive-learning-demo
npm ci
npm run dev
```

`npm test` validates the curriculum and deterministic learning state. `npm run build`
creates the production bundle in `dist/`.

## Learning flow

The session starts with the knowledge scene, then advances through the ten stages in
prerequisite order. Clicking an answer submits it immediately.

- Correct core or transfer answers set that concept's vector position to `1` and
  briefly show the updated knowledge scene before the next core question.
- Incorrect core answers open the exact remediation segment, followed by the
  corresponding transfer question when the segment ends.
- Watching a video never changes mastery.
- Incorrect transfer answers show the fallback explanation and Continue control;
  the concept remains `0`.
- Session actions are stored locally and replayed through the same state machine.

The structured curriculum is [src/data/bloom.json](src/data/bloom.json). Grading,
history, persistence, and mastery updates remain in [src/learning.js](src/learning.js).

## Reused knowledge scene

[src/KnowledgeScene.jsx](src/KnowledgeScene.jsx) is a minimal extraction of the actual
scene from `~/sk/demo-example-ux/knowledge-volume-demo/src/KnowledgeScene.jsx`. It
retains the source camera, lighting, fog, physical material, marching-cubes geometry,
field strength, damping, and orbit controls. The first ten source positions map to
KC_01 through KC_10 by stable concept index. The application passes the indexed
concept dictionary and ten-bit mastery vector directly to the scene.

The app does not create a second visualization or display the knowledge scene behind
questions or videos. Reduced-motion mode removes field damping while preserving the
same final geometry.

## Video behavior and limitations

All remediation resources use the YouTube IFrame Player API with explicit start and
end seconds. The player advances only when it reaches the configured end. YouTube may
block autoplay; the learner can start playback through the player without any added
tutorial UI. A player/API failure shows only an Open video link and Continue control.

The supplied video candidates include some segments whose exact audiovisual coverage
could not be independently verified. See
[references/resource-verification.md](references/resource-verification.md). The TED
stages use TED's official YouTube edition (`U6FvJ6jMGHU`) and the supplied timestamps.

## Validation

As of 2026-09-22:

- 25 automated tests pass, including the all-correct, successful-remediation,
  persistent-misconception, and all-fallback sessions.
- The production build passes.
- Browser checks confirm knowledge-only, question-only, video-only, and fallback-only
  screens; automatic segment completion; and knowledge visualization after mastery.
