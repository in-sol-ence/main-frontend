// Demo page copy (the 3D knowledge space). After editing, run `npm run build`.

export const demo = {
  intro: 'Skatebored places mathematical ideas in an embedding space. This view shows three dimensions so you can see how they connect.',
  // The 3D space fades in the moment this part of the intro has been typed.
  // It must appear word for word in the intro above.
  revealAfter: 'three dimensions',
  nextButton: 'Next',

  // Typed after Next. {phrase} is replaced by each stage below, in order.
  conceptSentence: 'This is {phrase} in the embedding space.',
  // One phrase per stage. Which questions each stage lights up is set in
  // src/concept-sequence.js, in the same order, so keep exactly four.
  stages: [
    'Integration by parts',
    'U-substitution',
    'Integration methods',
    "John Doe's knowledge",
  ],

  // The last screen before the spatial journey.
  closing: 'Skatebored turns a complex syllabus into a learning path through this space.',
  closingEmphasis: 'learning path',

}
