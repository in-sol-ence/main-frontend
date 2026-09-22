import { sampleKnowledge } from './knowledge.js';
import { compileKnowledge } from './knowledge-model.js';
import { exampleMaps } from './example-maps.js';
import { roboticsMap } from './robotics.js';
import { personalize } from './adaptation.js';
import { addLearningContent } from './learning-content.js';

const routes = [
  ['robotics', /\brobot(?:s|ics)?\b|autonomous navigation/i],
  ['black-holes', /black\s*holes?|astrophysics|event\s+horizons?/i],
  ['calculus', /calculus|derivatives?|integrals?|differentiation/i],
  ['neural-networks', /neural\s+networks?|deep\s+learning|backpropagation/i],
  ['game-engine', /game\s+engines?|engine\s+development|rendering\s+engine/i],
  ['reinforcement', /reinforcement|\bRL\b|q[ -]?learning/i],
];

function reinforcementCatalog() {
  const source = structuredClone(sampleKnowledge);
  source.children.find(node => node.id === 'policy-value').title = 'Value Functions';
  source.children.find(node => node.id === 'q-learning').prerequisites.push('policy-value');
  const policy = { id: 'policy-learning', title: 'Policy Learning', domain: 'reinforcement', importance: .87,
    description: 'Improve how an agent chooses its actions.', prerequisites: ['policy-value', 'q-learning'], children: [
      { id: 'policy-improvement', title: 'Policy Improvement', domain: 'reinforcement', importance: .7, description: 'Choose actions using better value estimates.', prerequisites: [], children: [] },
      { id: 'policy-gradient-method', title: 'Policy Gradients', domain: 'learning', importance: .9, description: 'Improve a policy using a return gradient.', prerequisites: ['policy-improvement'], children: [
        { id: 'policy-objective', title: 'Expected Return Objective', domain: 'reinforcement', importance: .75, description: 'Score the behavior induced by a policy.', prerequisites: [], children: [] },
        { id: 'policy-score-gradient', title: 'Score-Function Gradient', domain: 'mathematics', importance: .88, description: 'Relate action log-probabilities to expected return.', prerequisites: ['policy-objective'], children: [] },
      ] },
    ] };
  source.children.splice(source.children.length - 1, 0, policy);
  source.children.at(-1).prerequisites.push(policy.id);
  return source;
}

// Replace this provider with a backend later. Its only inputs are learner intent;
// its output is the same compiled knowledge contract consumed by every layer.
export async function buildJourney({ userGoal, userBackground = '', overrides = {}, evidence = {} }) {
  const goal = String(userGoal || '').trim().slice(0, 300);
  const background = String(userBackground).trim().slice(0, 300);
  if (!goal) throw new Error('Give your journey a destination.');
  const destination = goal.split(/\bfocus(?:ing)? on\b|\bwith (?:an? )?focus\b|\busing\b/i)[0];
  const matched = routes.find(([, pattern]) => pattern.test(destination));
  const key = matched?.[0] || 'reinforcement';
  const catalog = key === 'reinforcement' ? reinforcementCatalog() : key === 'robotics' ? roboticsMap : exampleMaps[key];
  const request = { userGoal: goal, userBackground: background, overrides: { ...overrides }, ...(Object.keys(evidence).length ? { evidence: { ...evidence } } : {}) };
  const { source, learner } = personalize(addLearningContent(catalog), request);
  const adapted = Object.values(learner).some(state => state !== 'unknown') || Object.keys(overrides).length > 0;
  return { map: compileKnowledge(source), request, learner, example: key, fallback: !matched, adapted,
    note: !matched ? 'Demo preview · Reinforcement Learning' : adapted ? 'Built from what you already know' : 'A journey from your starting point',
  };
}
