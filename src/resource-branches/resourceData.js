// Resource segments for one leaf knowledge component, keyed by component id.
// Plain JSON: swap the text, drop in an `image: { src, alt }`, add or remove
// entries, and the animation follows without a code change.
//
// calculus -> Applications -> Motion (id `calculus-6-1` in src/example-maps.js)
// is a leaf: it has no children, so branches replace no existing descent.

export const motionSegments = [
  { id: 'ocw-pumpkin-drop', type: 'video', title: 'MIT 18.01: Pumpkin Drop',
    summary: 'Height h(t) = 80 - 5t^2 becomes an impact speed of -40 m/s.',
    url: 'https://www.youtube.com/watch?v=ryLdyDrBfvI', start: 243, end: 711, durationSeconds: 468,
    source: 'MIT OpenCourseWare 18.01SC, Session 3, Clip 3', license: 'CC BY-NC-SA 4.0',
    body: 'Prof. David Jerison drops a pumpkin off an 80 meter building and models its height as h(t) = 80 - 5t^2. He first takes the average speed over the whole fall, (0 - 80)/(4 - 0) = -20 m/s, then differentiates to get dh/dt = -10t, so the velocity at impact is -40 m/s, twice the average. The negative sign is the lesson: velocity is signed, and here it points downward.' },

  { id: 'khan-one-dimensional', type: 'video', title: 'Khan: Velocity and Acceleration',
    summary: 'Position to velocity to acceleration, and speed as a magnitude.',
    url: 'https://www.youtube.com/watch?v=MFrpe4Wm8-g', start: 176, end: 378, durationSeconds: 202,
    source: 'Khan Academy, AP Calculus AB', license: 'CC BY-NC-SA 4.0',
    body: 'Sal Khan takes a particle at position x(t) = t^3 - 3t^2 + 5, differentiates once for v(t) = 3t^2 - 6t, and again for a(t) = 6t - 6. He is explicit that speed is the absolute value of velocity, so a particle can be speeding up while its velocity is negative. All Khan Academy content is available for free at www.khanacademy.org.' },

  { id: 'strang-velocity-distance', type: 'lecture', title: 'Strang 1.1: Velocity, Distance',
    summary: 'Open MIT textbook section linking the odometer to the speedometer.',
    url: 'https://ocw.mit.edu/ans7870/textbooks/Strang/Edited/Calculus/1.1-1.4.pdf', durationSeconds: 1500,
    source: 'Gilbert Strang, Calculus (MIT OCW RES.18-001), Section 1.1, pages 1-8', license: 'CC BY-NC-SA 4.0',
    body: 'Section 1.1 opens with the two instruments every driver already reads: the odometer, reporting total distance f(t), and the speedometer, reporting velocity v(t). Strang frames differentiation as the trip from f to v and integration as the trip back, then works a velocity that flips from +V to -V so the car reverses. Exposition runs pages 1 to 6, exercises 7 to 8.' },

  { id: 'derivative-chain', type: 'explanation', title: 'Position, Velocity, Acceleration',
    summary: 'The derivative chain from position to acceleration, and speed.',
    url: 'https://www.khanacademy.org/math/ap-calculus-ab/ab-diff-contextual-applications-new/ab-4-2/v/one-dimensional-motion-with-calculus',
    durationSeconds: 45, source: 'Written for this map', license: 'Original text',
    body: 'For motion along a straight line, let s(t) be the signed position at time t. Velocity is the first derivative of position, and acceleration is the derivative of velocity, which makes it the second derivative of position. Velocity is signed, so it carries direction as well as size. Speed is the unsigned magnitude of velocity, which is why -4 and +4 describe the same speed but opposite motion.' },

  { id: 'acceleration-at-one', type: 'question', title: 'Check: Acceleration at t = 1',
    summary: 'Differentiate a cubic position function twice, then evaluate it.',
    source: 'Written for this map', license: 'Original question',
    body: 'A particle moves along a straight line with position s(t) = t^3 - 6t^2 + 9t + 2 meters at time t seconds. What is its acceleration at t = 1 second?',
    choices: [
      { id: 'a', text: '0 m/s^2', correct: false },
      { id: 'b', text: '-6 m/s^2', correct: true },
      { id: 'c', text: '6 m/s^2', correct: false },
      { id: 'd', text: '-12 m/s^2', correct: false },
    ],
    answerExplanation: 'v(t) = 3t^2 - 12t + 9 and a(t) = 6t - 12, so a(1) = -6 m/s^2. The tempting 0 is v(1), the velocity rather than the acceleration.' },
];

// A second component with a single segment, proving the fan is data driven
// rather than one hard-coded case. calculus -> Derivatives -> Difference
// Quotients -> Tangent Slopes, id `calculus-3-0-1`.
export const tangentSlopeSegments = [
  { id: 'essence-of-calculus-derivative', type: 'video', title: '3B1B: Distance to Velocity',
    summary: 'Shrinks a secant slope toward the tangent to derive a rate.',
    url: 'https://www.youtube.com/watch?v=9vKqVkMQHKk', start: 68, end: 434, durationSeconds: 366,
    source: '3Blue1Brown, Essence of Calculus, Chapter 2',
    license: 'Standard YouTube License, all rights reserved (link or embed only)',
    body: 'Grant Sanderson graphs the distance a car has travelled, then asks how the velocity curve is determined by that distance curve. The answer is a tiny change in distance over the tiny change in time that produced it. As the time step shrinks the ratio stops being a secant slope and becomes the tangent slope, which is the derivative.' },
];

export const resourceLibrary = { 'calculus-6-1': motionSegments, 'calculus-3-0-1': tangentSlopeSegments };
