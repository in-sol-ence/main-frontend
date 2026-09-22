import { concepts, pathways } from './concepts.js';
import { annotations } from './annotations.js';
import { compileKnowledge } from './knowledge-model.js';

// Authored sample content only. The interaction/rendering system never branches
// on these IDs. A future generator can supply this same plain JSON structure.
const n = (id, title, domain, importance, description, prerequisites = [], children = []) =>
  ({ id, title, domain, importance, description, prerequisites, children });
const math = (id, title, importance, description, prerequisites = [], children = []) => n(id, title, 'mathematics', importance, description, prerequisites, children);
const prob = (id, title, importance, description, prerequisites = [], children = []) => n(id, title, 'probability', importance, description, prerequisites, children);
const learn = (id, title, importance, description, prerequisites = [], children = []) => n(id, title, 'learning', importance, description, prerequisites, children);
const rl = (id, title, importance, description, prerequisites = [], children = []) => n(id, title, 'reinforcement', importance, description, prerequisites, children);

const interiors = {
  foundations: [
    math('numbers-symbols', 'Numbers & Symbols', .45, 'A compact language for quantities.'),
    math('functions', 'Functions', .68, 'Mapping an input to an output.', ['numbers-symbols'], [
      math('function-inputs', 'Inputs & Outputs', .45, 'What a function receives and returns.'),
      math('function-composition', 'Composition', .72, 'Using one function inside another.', ['function-inputs']),
    ]),
    learn('algorithms', 'Algorithms', .82, 'A sequence of steps for solving a problem.', ['functions']),
  ],
  'linear-algebra': [
    math('vectors', 'Vectors', .82, 'Quantities with magnitude and direction.', [], [
      math('components', 'Components of a Vector', .46, 'The coordinates that describe a vector.', [], [
        math('component-coordinates', 'Coordinates', .48, 'A number for each direction in a basis.', [], [
          math('coordinate-axes', 'Coordinate Axes', .42, 'Reference directions for locating a point.'),
          math('ordered-coordinates', 'Ordered Coordinates', .68, 'The order tells us which axis a number belongs to.', ['coordinate-axes']),
        ]),
        math('basis-directions', 'Basis Directions', .82, 'Independent directions that span a space.', ['component-coordinates']),
        math('component-reconstruction', 'Reconstructing a Vector', .72, 'Combine scaled basis directions.', ['component-coordinates', 'basis-directions']),
      ]),
      math('vector-addition', 'Vector Addition', .65, 'Combining vectors component by component.', ['components'], [
        math('componentwise-addition', 'Adding Components', .6, 'Add the numbers in matching positions.'),
        math('head-to-tail', 'Head-to-Tail Geometry', .78, 'Place one displacement after another.', ['componentwise-addition']),
      ]),
      math('dot-product', 'Dot Product', .9, 'Measuring how two vectors align.', ['components', 'vector-addition'], [
        math('paired-products', 'Paired Products', .52, 'Multiply matching components.'),
        math('projection', 'Projection', .84, 'Measure one vector along another.', ['paired-products']),
        math('orthogonality', 'Orthogonality', .7, 'Perpendicular vectors have zero dot product.', ['projection']),
      ]),
    ]),
    math('matrices', 'Matrices', .66, 'Organizing transformations and systems.', ['vectors'], [
      math('matrix-shape', 'Rows & Columns', .44, 'The shape of a rectangular array.'),
      math('matrix-multiplication', 'Matrix Multiplication', .85, 'Compose compatible linear operations.', ['matrix-shape']),
      math('matrix-transformations', 'Matrix Transformations', .78, 'Use a matrix to move vectors through space.', ['matrix-multiplication']),
    ]),
    math('linear-transformations', 'Linear Transformations', .9, 'Moving space while preserving linear combinations.', ['vectors', 'matrices'], [
      math('linearity', 'Linearity', .6, 'Preserving addition and scaling.'),
      math('rotation-scaling', 'Rotation & Scaling', .78, 'Change direction or stretch space.', ['linearity']),
      math('kernel-image', 'Kernel & Image', .83, 'What disappears, and what can be reached.', ['linearity']),
    ]),
    math('eigenvectors', 'Eigenvalues & Eigenvectors', .94, 'Directions a transformation keeps aligned.', ['matrices', 'linear-transformations'], [
      math('invariant-directions', 'Invariant Directions', .68, 'Directions that remain on their own line.'),
      math('eigenvalue-scaling', 'Eigenvalue Scaling', .86, 'How much an invariant direction is stretched.', ['invariant-directions']),
    ]),
  ],
  probability: [
    prob('random-variables', 'Random Variables', .8, 'Assign numbers to uncertain outcomes.', [], [
      prob('sample-space', 'Sample Space', .45, 'The set of possible outcomes.'),
      prob('discrete-variables', 'Discrete Variables', .7, 'Values that can be counted.', ['sample-space']),
      prob('continuous-variables', 'Continuous Variables', .73, 'Values drawn from a continuous range.', ['sample-space']),
    ]),
    prob('distributions', 'Probability Distributions', .84, 'How probability is spread across outcomes.', ['random-variables'], [
      prob('bernoulli', 'Bernoulli Distribution', .58, 'One trial with two possible outcomes.'),
      prob('normal-distribution', 'Normal Distribution', .8, 'A symmetric, bell-shaped distribution.'),
      prob('distribution-variance', 'Variance', .65, 'How widely values spread around their mean.', ['normal-distribution']),
    ]),
    prob('expected-value', 'Expected Value', .77, 'A probability-weighted average.', ['distributions'], [
      prob('weighted-average', 'Weighted Average', .62, 'Weight each outcome by its probability.'),
      prob('long-run-mean', 'Long-Run Mean', .82, 'The average approached over many trials.', ['weighted-average']),
    ]),
    prob('conditional-probability', 'Conditional Probability', .88, 'Update uncertainty when information is known.', ['random-variables'], [
      prob('conditioning', 'Conditioning', .63, 'Restrict attention to a known event.'),
      prob('bayes-rule', 'Bayes’ Rule', .88, 'Update a belief using new evidence.', ['conditioning']),
    ]),
  ],
  optimization: [
    learn('loss-functions', 'Loss Functions', .65, 'Measure how far a prediction is from its target.', [], [
      learn('prediction-error', 'Prediction Error', .5, 'The gap between a prediction and a target.'),
      learn('squared-error', 'Squared Error', .77, 'A smooth penalty for prediction errors.', ['prediction-error']),
    ]),
    math('gradients', 'Gradients', .88, 'The direction of steepest local increase.', ['loss-functions'], [
      math('partial-derivatives', 'Partial Derivatives', .62, 'Change one input while holding others fixed.'),
      math('gradient-vector', 'Gradient Vector', .85, 'Collect partial derivatives into a direction.', ['partial-derivatives']),
      math('chain-rule', 'Chain Rule', .78, 'Differentiate a composition of functions.', ['partial-derivatives']),
    ]),
    learn('gradient-descent', 'Gradient Descent', .94, 'Step against the gradient to reduce a loss.', ['gradients'], [
      learn('update-rule', 'Update Rule', .83, 'Adjust parameters using the negative gradient.'),
      learn('convergence', 'Convergence', .7, 'When successive updates settle down.', ['update-rule']),
    ]),
    learn('learning-rate', 'Learning Rate', .58, 'Control how large each update is.', ['gradient-descent'], [
      learn('step-size', 'Step Size', .5, 'The distance moved in a single update.'),
      learn('rate-schedules', 'Rate Schedules', .8, 'Adjust step size as learning progresses.', ['step-size']),
    ]),
  ],
  mdp: [
    rl('states', 'States', .63, 'The information used to describe a situation.', [], [
      rl('state-representation', 'State Representation', .58, 'Choose what information a state contains.'),
      rl('markov-property', 'Markov Property', .9, 'The present state summarizes relevant history.', ['state-representation']),
    ]),
    rl('actions', 'Actions', .55, 'The choices available to the learner.', ['states'], [
      rl('action-space', 'Action Space', .6, 'The set of choices that can be made.'),
      rl('available-actions', 'Available Actions', .72, 'Which choices are valid in a given state.', ['action-space']),
    ]),
    rl('rewards', 'Rewards', .79, 'Feedback attached to an action or transition.', ['actions'], [
      rl('immediate-reward', 'Immediate Reward', .53, 'Feedback from the current transition.'),
      rl('return', 'Return', .86, 'The accumulated reward over time.', ['immediate-reward']),
      rl('discount-factor', 'Discount Factor', .7, 'How strongly future rewards are weighted.', ['return']),
    ]),
    rl('transition-probabilities', 'Transition Probabilities', .88, 'How actions change the distribution of states.', ['states', 'actions'], [
      rl('next-state', 'Next-State Outcomes', .61, 'The situations an action can lead to.'),
      rl('transition-model', 'Transition Model', .85, 'Assign probabilities to possible next states.', ['next-state']),
    ]),
    rl('mdp-policies', 'Policies', .84, 'A rule for choosing actions from states.', ['rewards', 'transition-probabilities'], [
      rl('state-action-rule', 'State-to-Action Rule', .67, 'Connect a situation to an action choice.'),
      rl('policy-rollout', 'Policy Rollout', .81, 'Follow a policy through a sequence of states.', ['state-action-rule']),
    ]),
  ],
  'q-learning': [
    rl('q-values', 'Q-Values', .78, 'Estimate the return from a state and action.', [], [
      rl('q-state-action', 'State–Action Pairs', .51, 'Evaluate a choice in a particular situation.'),
      rl('q-future-return', 'Future Return', .82, 'Include rewards beyond the next step.', ['q-state-action']),
    ]),
    rl('bellman-equation', 'Bellman Equation', .95, 'Relate a value to rewards and future values.', ['q-values'], [
      rl('bellman-target', 'Bellman Target', .7, 'Reward plus a discounted next-state value.'),
      rl('td-error', 'Temporal-Difference Error', .88, 'The gap between a prediction and its target.', ['bellman-target']),
      rl('q-update', 'Q-Value Update', .83, 'Move the estimate toward the target.', ['td-error']),
    ]),
    rl('explore-exploit', 'Exploration vs Exploitation', .74, 'Balance trying new actions with using known ones.', ['q-values'], [
      rl('greedy-choice', 'Greedy Choice', .53, 'Choose the action with the highest estimate.'),
      rl('epsilon-greedy', 'Epsilon-Greedy', .83, 'Occasionally explore instead of acting greedily.', ['greedy-choice']),
    ]),
    rl('q-table', 'Q-Table', .59, 'Store a value for each discrete state–action pair.', ['bellman-equation', 'explore-exploit'], [
      rl('table-entries', 'Table Entries', .48, 'One estimate for each state–action pair.'),
      rl('table-updates', 'Updating the Table', .8, 'Revise the entry for the observed transition.', ['table-entries']),
    ]),
  ],
  'policy-value': [
    rl('value-function', 'Value Function', .78, 'Predict expected return under a policy.', [], [
      rl('value-expected-return', 'Expected Return', .63, 'Average the future return over possible outcomes.'),
      rl('value-discounting', 'Discounting', .76, 'Weight near and distant rewards differently.', ['value-expected-return']),
    ]),
    rl('policy', 'Policy', .87, 'Describe how an agent chooses an action.', [], [
      rl('deterministic-policy', 'Deterministic Policy', .6, 'Choose one action for each state.'),
      rl('stochastic-policy', 'Stochastic Policy', .83, 'Assign probabilities to actions in a state.'),
    ]),
    rl('state-value', 'State-Value', .67, 'Evaluate a state before choosing an action.', ['value-function', 'policy']),
    rl('action-value', 'Action-Value', .73, 'Evaluate a state together with an action.', ['value-function', 'policy'], [
      rl('action-comparison', 'Comparing Actions', .69, 'Compare expected returns from different choices.'),
      rl('policy-weighted-value', 'Policy-Weighted Value', .82, 'Average action values using policy probabilities.', ['action-comparison']),
    ]),
    rl('advantage', 'Advantage', .94, 'How much better an action is than the state average.', ['state-value', 'action-value'], [
      rl('value-baseline', 'Value Baseline', .59, 'A reference expectation for the current state.'),
      rl('relative-action-value', 'Relative Action Value', .88, 'Subtract the baseline from an action value.', ['value-baseline']),
    ]),
  ],
  'reinforcement-learning': [
    rl('agent-environment', 'Agent & Environment', .69, 'A learner acts in a world that responds.'),
    rl('interaction-loop', 'Interaction Loop', .84, 'Observe, act, receive feedback, and repeat.', ['agent-environment']),
    rl('learning-objective', 'Learning Objective', .92, 'Improve decisions to increase expected return.', ['interaction-loop']),
  ],
};

export const sampleKnowledge = {
  id: 'rl-journey', title: 'Reinforcement Learning', domain: 'reinforcement', importance: 1,
  description: 'Understanding how agents learn through actions and feedback.', startDistance: 39,
  children: concepts.map(concept => ({
    ...concept, description: annotations[concept.id].detail, category: annotations[concept.id].category,
    layout: { at: concept.at, side: concept.side, offset: concept.offset, height: concept.height, lines: concept.lines, role: concept.role },
    children: interiors[concept.id] || [],
  })),
  pathways,
};
export const knowledge = compileKnowledge(sampleKnowledge);
