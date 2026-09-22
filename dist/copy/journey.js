// Spatial journey copy (the path after the demo). After editing, run `npm run build`.

export const journey = {
  // Used in the small per-concept notes, e.g. "John Doe already knows this."
  learner: 'John Doe',
  // Typed into the space before the path is built.
  statement: 'Let’s say John Doe wants to learn calculus.',
  // Typed beside the topic the system selects. {topic} becomes its name.
  topicLine: 'John Doe wants to learn {topic}.',
  // Typed beside that topic's knowledge concepts.
  rationale: 'Our RL model targets knowledge concepts based on John Doe’s knowledge state.',
  // Small caps line above the rationale: "Limits → Knowledge concepts".
  conceptsLabel: 'Knowledge concepts',
  // Typed as the rest of that branch goes by, after its lecture segment.
  repeats: 'The process repeats.',

  // Not shown as written, but they decide the route. The goal must match one of
  // the spatial study's example maps, or it silently falls back to
  // reinforcement learning. The background decides which topics count as known.
  goal: 'Learn calculus from the beginning',
  background: 'I know algebra',
}
