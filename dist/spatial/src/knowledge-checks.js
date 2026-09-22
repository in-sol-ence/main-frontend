// Authored evidence, separate from the graph, learner model, and presentation.
// Choice IDs survive display reordering. Explanations address the misconception.
const check = (id, kcId, prompt, choices, answer, feedback, strength = 1.8) =>
  ({ id, kcId, prompt, choices: choices.map((text, i) => ({ id: String(i), text })), answer: String(answer), feedback, strength });
export const knowledgeChecks = [
  check('vectors-magnitude', 'vectors', 'What does the magnitude of a vector describe?',
    ['Its direction', 'Its length', 'Its number of components'], 1, 'Magnitude is length. Direction is a separate property of the arrow.'),
  check('vectors-length', 'vectors', 'An arrow moves 3 units right and 4 up. How long is it?',
    ['7 units', '12 units', '5 units'], 2, 'The perpendicular components form a right triangle: √(3² + 4²) = 5.'),
  check('components-order', 'components', 'In [3, 2], what does the second component specify on these axes?',
    ['2 units vertically', 'The total length', '3 units horizontally'], 0, 'The second coordinate belongs to the vertical axis; it is not the length of the diagonal.'),
  check('components-rebuild', 'components', 'Which sum reconstructs [3, 2]?',
    ['[3, 0] + [0, 2]', '[3, 3] + [2, 2]', '[0, 3] + [2, 0]'], 0, 'Add matching coordinates: [3 + 0, 0 + 2] = [3, 2].'),
  check('addition-pair', 'vector-addition', 'What is [2, 1] + [1, 3]?',
    ['[2, 3]', '[3, 4]', '[3, 3]'], 1, 'Add horizontal components together and vertical components together: [3, 4].'),
  check('addition-geometry', 'vector-addition', 'How does head-to-tail addition construct the sum?',
    ['Multiply both arrow lengths', 'Reverse the first arrow', 'Follow one displacement, then the other'], 2, 'The sum joins the starting point to the final endpoint after both displacements.'),
  check('dot-perpendicular', 'dot-product', 'Two nonzero vectors are perpendicular. What is their dot product?',
    ['Their lengths added', '1', '0'], 2, 'Perpendicular vectors have no component along each other, so their dot product is zero.'),
  check('dot-components', 'dot-product', 'What is [3, 2] · [1, 0]?',
    ['3', '5', '[3, 0]'], 0, 'Multiply matching components and add: 3×1 + 2×0 = 3. The dot product is a scalar.'),
  check('probability-total', 'probability', 'For all mutually exclusive outcomes of one experiment, probabilities sum to…',
    ['The number of outcomes', '1', 'An unknown amount'], 1, 'All possible outcomes together have total probability one.'),
  check('probability-coins', 'probability', 'Two independent fair coins are flipped. What is the chance of exactly one head?',
    ['1/4', '3/4', '1/2'], 2, 'HT and TH are two of the four equally likely outcomes, giving 1/2.'),
  check('mdp-outcome', 'mdp', 'A robot chooses “right.” In an MDP, what determines its next state?',
    ['The action always guarantees the destination', 'The transition distribution for its current state and action', 'Only the reward'], 1, 'A chosen action can have uncertain outcomes. The transition distribution describes their probabilities.'),
  check('mdp-markov', 'mdp', 'What makes a state Markov?',
    ['It summarizes history relevant to the next transition and reward', 'It stores every previous observation', 'It guarantees the same next state'], 0, 'A Markov state contains the relevant predictive information; uncertainty may still remain.'),
  check('q-target', 'q-learning', 'Reward is 1, discount is 0.9, and best next Q is 4. What is the Q-learning target?',
    ['3.3', '4.6', '5'], 1, 'The target is 1 + 0.9×4 = 4.6. The updated estimate also depends on the old value and learning rate.'),
  check('q-terminal', 'q-learning', 'The next state is terminal. What future-value term enters the Q-learning target?',
    ['The largest Q in the whole table', 'The old Q-value', 'Zero'], 2, 'There are no subsequent actions after termination; the target is just the observed reward.'),
  check('matrix-action', 'matrices', 'A = [[2, 0], [0, 1]]. Where does [3, 2] move?',
    ['[6, 2]', '[6, 4]', '[3, 4]'], 0, 'This matrix doubles the horizontal coordinate and leaves the vertical coordinate unchanged.'),
  check('matrix-origin', 'matrices', 'Where must a linear transformation send the zero vector?',
    ['Any point', 'The zero vector', 'A unit vector'], 1, 'Linearity requires A0 = 0. A translation is not a linear map on these coordinates.'),
];

export function validateChecks(graph, checks = knowledgeChecks) {
  const ids = new Set();
  for (const q of checks) {
    if (!graph.has(q.kcId)) continue; // Other authored journeys need not contain RL KCs.
    if (ids.has(q.id) || !q.prompt || !Number.isFinite(q.strength) || q.strength <= 0 || q.strength > 3 ||
      q.choices.length < 2 || new Set(q.choices.map(c => c.id)).size !== q.choices.length || !q.choices.some(c => c.id === q.answer)) throw new Error(`Invalid knowledge check: ${q.id}`);
    ids.add(q.id);
  }
}
