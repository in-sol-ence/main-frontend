// Authored, topic-specific demo trees. Tuples keep content readable; the output
// is plain JSON and follows exactly the recursive RL contract.
// [title, domain, description, children?, prerequisite indexes?]
function region(id, title, rows, domain = 'mathematics') {
  function children(items, prefix) {
    return items.map(([name, family, description, nested = [], dependencies], i) => ({
      id: `${prefix}-${i}`, title: name, domain: family, description,
      importance: i === items.length - 1 ? .96 : .45 + (i % 4) * .13,
      prerequisites: (dependencies ?? (i ? [i - 1] : [])).map(index => `${prefix}-${index}`),
      children: children(nested, `${prefix}-${i}`),
    }));
  }
  return { id, title, domain, importance: 1, description: `A journey into ${title.toLowerCase()}.`, startDistance: 13, children: children(rows, id) };
}
const math = 'mathematics', physics = 'physics', space = 'spacetime', code = 'computing', graphics = 'graphics', learn = 'learning', probability = 'probability';

export const exampleMaps = {
  'black-holes': region('black-holes', 'Understanding Black Holes', [
    ['Physics Foundations', physics, 'The language of motion, energy, and light.', [
      ['Motion & Forces', physics, 'How interactions change motion.'], ['Energy & Momentum', physics, 'Quantities conserved in physical processes.'], ['The Speed of Light', physics, 'The invariant speed that links space and time.'],
    ]],
    ['Gravity', physics, 'From falling objects to the motion of planets.', [
      ['Newtonian Gravity', physics, 'Masses attract through an inverse-square force.'], ['Orbits', physics, 'Continuous free fall around another body.'], ['Escape Velocity', physics, 'The speed needed to escape a gravitational field.'],
    ]],
    ['Spacetime', space, 'Space and time form a single physical geometry.', [
      ['Events & Intervals', space, 'Locate happenings in space and time.', [
        ['Reference Frames', physics, 'Different observers assign different coordinates.'], ['Invariant Intervals', space, 'A spacetime separation all inertial observers agree on.'],
      ]], ['Light Cones', space, 'The boundary of possible causal influence.'], ['Proper Time', space, 'Time measured along an observer’s own path.'],
    ], [0]],
    ['General Relativity', space, 'Matter shapes spacetime; geometry guides motion.', [
      ['Equivalence Principle', physics, 'Locally, free fall removes the effects of gravity.'], ['Curvature', space, 'Geometry changes the relation between nearby paths.'], ['Geodesics', space, 'The natural paths of freely falling objects.'],
    ], [1, 2]],
    ['Event Horizons', space, 'A boundary beyond which light cannot escape.', [
      ['Schwarzschild Radius', space, 'The horizon scale of a nonrotating black hole.'], ['Causal Boundaries', space, 'Which events can communicate with the outside.'], ['Gravitational Redshift', physics, 'Light loses frequency as it climbs outward.'],
    ]],
    ['Black Hole Formation', physics, 'Gravity overwhelms the support inside a star.', [
      ['Stellar Evolution', physics, 'A star changes as its nuclear fuel is consumed.'], ['Core Collapse', physics, 'The stellar core loses support and contracts.'], ['Stellar Remnants', physics, 'The final object depends on the remaining mass.'],
    ], [1, 3]],
    ['Black Hole Physics', space, 'How we study objects that trap light.', [
      ['Accretion Disks', physics, 'Infalling matter heats up outside the horizon.'], ['Gravitational Waves', space, 'Merging compact objects send ripples through spacetime.'], ['Hawking Radiation', physics, 'Quantum fields predict radiation from black holes.'],
    ], [4, 5]],
  ], space),
  calculus: region('calculus', 'Calculus from the Beginning', [
    ['Algebra Foundations', math, 'Manipulate quantities and solve equations.', [
      ['Expressions', math, 'Combine numbers and symbols.'], ['Equations', math, 'Find values that make two expressions equal.'], ['Exponents', math, 'Describe repeated multiplication and its inverse.'],
    ]],
    ['Functions', math, 'Describe how one quantity depends on another.', [
      ['Domain & Range', math, 'The allowed inputs and resulting outputs.'], ['Graphs', math, 'See a function as a relationship in space.'], ['Composition', math, 'Feed one function into another.'],
    ]],
    ['Limits', math, 'Understand the value a function approaches.', [
      ['Approaching a Value', math, 'Study nearby inputs rather than only one point.'], ['One-Sided Limits', math, 'Approach from the left or the right.'], ['Continuity', math, 'A function’s value agrees with its limit.'],
    ]],
    ['Derivatives', math, 'Measure instantaneous change.', [
      ['Difference Quotients', math, 'Average change over a shrinking interval.', [
        ['Secant Slopes', math, 'A slope between two points.'], ['Tangent Slopes', math, 'The limiting slope at one point.'],
      ]], ['Differentiation Rules', math, 'Find derivatives of common expressions.'], ['The Chain Rule', math, 'Track change through composed functions.'],
    ]],
    ['Integrals', math, 'Accumulate small contributions into a whole.', [
      ['Riemann Sums', math, 'Approximate accumulation using thin slices.'], ['Definite Integrals', math, 'Take the limit of increasingly fine sums.'], ['Fundamental Theorem', math, 'Connect accumulation and differentiation.'],
    ]],
    ['Differential Equations', math, 'Describe systems through their rates of change.', [
      ['Initial Conditions', math, 'Choose one solution from a family.'], ['Separable Equations', math, 'Separate variables before integrating.'], ['Exponential Growth', math, 'A rate proportional to the current quantity.'],
    ], [3, 4]],
    ['Applications', math, 'Use change and accumulation to model the world.', [
      ['Optimization', math, 'Find the best value under constraints.'], ['Motion', physics, 'Connect position, velocity, and acceleration.'], ['Area & Volume', math, 'Add slices to measure geometric quantities.'],
    ], [3, 4]],
  ]),
  'neural-networks': region('neural-networks', 'How Neural Networks Learn', [
    ['Linear Algebra', math, 'Represent data and transformations.', [
      ['Vectors', math, 'Represent features as ordered quantities.'], ['Matrices', math, 'Transform batches of vectors.'], ['Dot Products', math, 'Combine inputs with learned weights.'],
    ]],
    ['Probability', probability, 'Reason about noisy data and uncertainty.', [
      ['Distributions', probability, 'Describe how outcomes are spread.'], ['Expectation', probability, 'Compute a probability-weighted average.'], ['Likelihood', probability, 'Measure how well a model explains observations.'],
    ], []],
    ['Optimization', learn, 'Adjust parameters to improve predictions.', [
      ['Loss Functions', learn, 'Measure the cost of a wrong prediction.'], ['Gradients', math, 'Find the direction of steepest increase.'], ['Learning Rate', learn, 'Control the size of each update.'],
    ], [0, 1]],
    ['Gradient Descent', learn, 'Reduce loss through repeated small updates.', [
      ['Parameter Updates', learn, 'Move parameters against the gradient.'], ['Mini-Batches', learn, 'Estimate updates from a subset of examples.'], ['Convergence', learn, 'Understand when improvement slows or stabilizes.'],
    ]],
    ['Neural Networks', learn, 'Compose learnable transformations into a model.', [
      ['Neurons', learn, 'Transform a weighted combination of inputs.', [
        ['Weights & Biases', math, 'Parameters control each input’s contribution.'], ['Activation Functions', learn, 'Nonlinearity allows richer relationships.'],
      ]], ['Layers', learn, 'Organize neurons into sequential transformations.'], ['Forward Pass', learn, 'Propagate inputs to a prediction.'],
    ], [0]],
    ['Backpropagation', learn, 'Distribute learning signals through the network.', [
      ['Computation Graphs', math, 'Express a calculation as composed operations.'], ['Chain Rule', math, 'Multiply local derivatives through a composition.'], ['Reverse-Mode Gradients', learn, 'Accumulate sensitivities from outputs to parameters.'],
    ], [3, 4]],
    ['Generalization', learn, 'Learn patterns that hold for unseen examples.', [
      ['Train & Validation', learn, 'Evaluate learning on held-out examples.'], ['Overfitting', learn, 'Recognize when a model memorizes its training data.'], ['Regularization', learn, 'Constrain learning to support better generalization.'],
    ]],
  ], learn),
  'game-engine': region('game-engine', 'Building a Game Engine', [
    ['Programming', code, 'Turn a simulation into executable instructions.', [
      ['Control Flow', code, 'Choose and repeat operations.'], ['Memory & Ownership', code, 'Manage the lifetime of data.'], ['Modules', code, 'Separate systems behind clear interfaces.'],
    ]],
    ['Data Structures', code, 'Organize the data a real-time world needs.', [
      ['Arrays & Maps', code, 'Store and retrieve collections efficiently.'], ['Trees', code, 'Represent hierarchies and spatial partitions.'], ['Data Locality', code, 'Arrange memory for efficient access.'],
    ]],
    ['Linear Algebra', math, 'Locate and transform objects in a virtual world.', [
      ['Vectors', math, 'Represent position, direction, and velocity.'], ['Transforms', math, 'Combine translation, rotation, and scale.'], ['Coordinate Spaces', math, 'Move between local, world, and camera coordinates.'],
    ], []],
    ['Computer Graphics', graphics, 'Turn a scene into an image.', [
      ['Meshes', graphics, 'Describe surfaces with connected triangles.'], ['Cameras & Projection', graphics, 'Map a three-dimensional view onto an image.'], ['Rasterization', graphics, 'Determine which pixels a triangle covers.'],
    ], [2]],
    ['Rendering', graphics, 'Build a repeatable pipeline for every frame.', [
      ['Shaders', graphics, 'Run programs across vertices and pixels.', [
        ['Vertex Stage', graphics, 'Transform geometry into clip space.'], ['Fragment Stage', graphics, 'Compute color for covered samples.'],
      ]], ['Materials & Lighting', graphics, 'Model how surfaces respond to light.'], ['Render Passes', graphics, 'Organize drawing into dependent stages.'],
    ]],
    ['Physics', physics, 'Simulate motion and contact over time.', [
      ['Time Integration', physics, 'Advance position and velocity in small steps.'], ['Collision Detection', code, 'Find objects that overlap or intersect.'], ['Collision Response', physics, 'Resolve contact using forces or impulses.'],
    ], [1, 2]],
    ['Engine Architecture', code, 'Bring real-time systems together coherently.', [
      ['The Game Loop', code, 'Coordinate input, simulation, and rendering.'], ['Entity Components', code, 'Compose world objects from independent capabilities.'], ['Asset Pipeline', code, 'Prepare and load the content a game uses.'], ['System Scheduling', code, 'Order work while preserving dependencies.'],
    ], [1, 4, 5]],
  ], code),
};
