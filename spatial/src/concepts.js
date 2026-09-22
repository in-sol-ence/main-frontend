// Editorial sample: goal-conditioned importance and prerequisites are distinct
// from travel order. `at` retains the exact Stage 2 arc-length placements.
export const domains = Object.freeze({
  foundations: { color: '#b6b5aa' },
  probability: { color: '#9fadb9' },
  mathematics: { color: '#acb7a4' },
  learning: { color: '#bbae99' },
  reinforcement: { color: '#b8b5c5' },
  physics: { color: '#a8b7b6' },
  spacetime: { color: '#acaabd' },
  computing: { color: '#b4b8a8' },
  graphics: { color: '#baa997' },
});

export const concepts = Object.freeze([
  { id: 'foundations', title: 'Foundations', lines: ['Foundations'], domain: 'foundations', importance: .25, role: 'minor', prerequisites: [], at: .145, side: 1, offset: 0, height: .95 },
  { id: 'probability', title: 'Probability', lines: ['Probability'], domain: 'probability', importance: .53, role: 'supporting', prerequisites: ['foundations'], at: .24, side: -1, offset: -.38, height: .65 },
  { id: 'linear-algebra', title: 'Linear Algebra', lines: ['Linear Algebra'], domain: 'mathematics', importance: .57, role: 'supporting', prerequisites: ['foundations'], at: .33, side: 1, offset: .28, height: .8 },
  { id: 'optimization', title: 'Optimization', lines: ['Optimization'], domain: 'mathematics', secondaryDomain: 'learning', importance: .78, role: 'milestone', prerequisites: ['linear-algebra', 'probability'], at: .425, side: -1, offset: 0, height: .7 },
  { id: 'mdp', title: 'Markov Decision Processes', lines: ['Markov Decision', 'Processes'], domain: 'reinforcement', secondaryDomain: 'probability', importance: .87, role: 'milestone', prerequisites: ['probability'], at: .53, side: 1, offset: .42, height: 1.05 },
  { id: 'q-learning', title: 'Q-Learning', lines: ['Q-Learning'], domain: 'learning', secondaryDomain: 'reinforcement', importance: .69, role: 'supporting', prerequisites: ['optimization', 'mdp'], at: .635, side: -1, offset: -.24, height: .75 },
  { id: 'policy-value', title: 'Policy & Value Functions', lines: ['Policy & Value', 'Functions'], domain: 'reinforcement', importance: .74, role: 'supporting', prerequisites: ['mdp'], at: .745, side: 1, offset: 0, height: .85 },
  { id: 'reinforcement-learning', title: 'Reinforcement Learning', lines: ['Reinforcement', 'Learning'], domain: 'reinforcement', importance: 1, role: 'goal', prerequisites: ['q-learning', 'policy-value', 'mdp'], at: .855, side: -1, offset: -.32, height: 1.2 },
]);

export const conceptById = new Map(concepts.map(concept => [concept.id, concept]));

// Only selected dependencies are given secondary geometry. The main journey
// carries the rest. No arbitrary decorative lines or complete edge network.
export const pathways = Object.freeze([
  { id: 'probability-optimization', source: 'probability', target: 'optimization', bend: -5.2, lift: 2.1, drift: .025, strength: .7 },
  { id: 'algebra-optimization', source: 'linear-algebra', target: 'optimization', bend: 3.8, lift: -1.3, drift: -.02, strength: .9 },
  { id: 'probability-mdp', source: 'probability', target: 'mdp', bend: 7.5, lift: 3.3, drift: .045, strength: .64 },
  { id: 'optimization-q', source: 'optimization', target: 'q-learning', bend: -5.8, lift: -2.4, drift: -.035, strength: .8 },
  { id: 'mdp-policy', source: 'mdp', target: 'policy-value', bend: 5.5, lift: 2.7, drift: .03, strength: .72 },
  { id: 'q-goal', source: 'q-learning', target: 'reinforcement-learning', bend: -7.4, lift: 3.2, drift: .04, strength: .9 },
  { id: 'policy-goal', source: 'policy-value', target: 'reinforcement-learning', bend: 4.4, lift: -1.8, drift: -.025, strength: 1 },
]);
