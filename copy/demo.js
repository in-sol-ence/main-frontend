// Demo page copy (the 3D knowledge space). After editing, run `npm run build`.

export const demo = {
  intro: 'Our platform embeds math in an N-dimensional space. We have restricted this space to three dimensions so you can visualize it.',
  // The 3D space fades in the moment this part of the intro has been typed.
  // It must appear word for word in the intro above.
  revealAfter: 'three dimensions',
  nextButton: 'Next',

  // Typed after Next. {phrase} is replaced by each stage below, in order.
  conceptSentence: 'Here is {phrase} represented in the embedding space.',
  // One phrase per stage. Which questions each stage lights up is set in
  // src/concept-sequence.js, in the same order, so keep exactly four.
  stages: [
    'Integration by parts',
    'U-substitution',
    'Integration methods',
    "John Doe's knowledge",
  ],

  // The last screen before the spatial journey.
  closing: 'Skatebored maps complex syllabi directly into custom trajectories across our n-dimensional space.',
}
