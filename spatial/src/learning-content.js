import { isKnown, readLearner } from './adaptation.js';

// Educational data, not renderer logic. A future provider can supply these
// fields directly; the examples below only seed the local demonstration.
const lesson = (explanation, intuitiveExplanation, advancedExplanation, example, visualType, visualData) =>
  ({ explanation, intuitiveExplanation, advancedExplanation, examples: [example], visualType, visualData });
const guide = (explanation, intuitiveExplanation, intermediateExplanation, advancedExplanation, examples, visualType, visualData) =>
  ({ explanation, intuitiveExplanation, intermediateExplanation, advancedExplanation, examples, ...(visualType ? { visualType, visualData } : {}) });

export const learningLibrary = {
  vectors: lesson('A vector describes a quantity using ordered components.',
    'Think of an arrow: it tells you how far to move and in which direction.',
    'In a chosen basis, a vector is represented by ordered coordinates. Here we use the Euclidean plane.',
    'v = [3, 2] · 3 right, 2 up · length √13 ≈ 3.61', 'vector', { components: [3, 2] }),
  matrices: lesson('A matrix can transform a vector into another vector.',
    'Watch a grid stretch. Every point follows the same rule, not a separate instruction.',
    'A matrix represents a linear map in chosen bases. Its columns are the images of the input basis vectors.',
    'A = [[1.5, 0], [0, 0.7]] · [2, 2] → [3, 1.4]', 'matrix', { matrix: [[1.5, 0], [0, .7]], vector: [2, 2] }),
  linear: lesson('Linear algebra is the language of vectors and linear transformations.',
    'Describe something with numbers, then use one rule to move or combine those numbers.',
    'Vector spaces and linear maps provide representations for states, features, and value-function parameters.',
    'A stretches one direction and compresses the other.', 'matrix', { matrix: [[1.5, 0], [0, .7]], vector: [2, 2] }),
  probability: lesson('Probability assigns a share of possibility to each outcome.',
    'Two fair coin flips can give zero, one, or two heads. One head has two ways to happen.',
    'For two independent Bernoulli(½) trials, the head count has a Binomial(2, ½) distribution.',
    'P(0 heads) = ¼ · P(1 head) = ½ · P(2 heads) = ¼', 'distribution', { probabilities: [.25, .5, .25], outcomes: ['0 heads', '1 head', '2 heads'] }),
  gradient: lesson('Gradient descent adjusts parameters to reduce a loss.',
    'Feel which way is uphill, then take a small step in the opposite direction.',
    'Update θ ← θ − α∇L(θ). A sufficiently small learning rate reduces this smooth quadratic loss.',
    'L(x) = x² · α = 0.2 · x: 3 → 1.8 → 1.08 → …', 'descent', { initial: 3, rate: .2 }),
  mdp: lesson('An MDP describes decisions with states, actions, rewards, and uncertain outcomes.',
    'A robot chooses to move. It usually reaches the next square, but sometimes slips and stays.',
    'The next-state distribution depends on the current state and action, not the full history: P(s′ | s, a).',
    'Move right: 80% reach the goal (+1); 20% stay (0).', 'transition', { success: .8 }),
  q: lesson('Q-learning improves an estimate of how valuable an action is.',
    'After trying an action, move its estimate a little toward the reward plus the best predicted future.',
    'Q(s,a) ← Q(s,a) + α[r + γ maxₐ′ Q(s′,a′) − Q(s,a)]. A terminal next state contributes no future value.',
    'Q = 2 · reward = 1 · best next Q = 4 · γ = 0.9 · α = 0.5 → Q = 3.3', 'value-update', { old: 2, reward: 1, next: 4, discount: .9, rate: .5 }),
  reinforcement: lesson('Reinforcement learning improves decisions through actions and feedback.',
    'An agent tries something, sees what happens, and learns which choices tend to pay off over time.',
    'A policy is learned from interaction to maximize expected cumulative reward, often discounted over time.',
    'Robot acts → environment changes → reward + new observation.', 'feedback', {}),
  blackhole: lesson('A black hole is a region from which light cannot escape to the distant outside.',
    'The event horizon is a point of no return, not a solid surface.',
    'For an uncharged, nonrotating black hole, the event horizon is at Schwarzschild radius rₛ = 2GM/c².',
    'For one solar mass, rₛ ≈ 3 km. The rings are a schematic cross-section, not a photograph.', 'horizon', { radius: 1.2 }),
  calculus: lesson('Calculus connects how quantities change with how they accumulate.',
    'A tangent shows the slope at one instant. As the point moves, the slope changes.',
    'The derivative is a local rate of change. For f(x) = x², f′(x) = 2x; integration reverses differentiation up to a constant.',
    'At x = 1: f(x) = 1, and the tangent has slope 2.', 'derivative', { at: 1 }),
  neural: lesson('A neural network combines weighted inputs through layers of transformations.',
    'Each layer mixes the signals it receives. Nonlinear activations let the network learn more than one linear rule.',
    'A layer computes h = σ(Wx + b). Training adjusts weights and biases to reduce an objective.',
    'Inputs → weighted sums + activation → prediction. The pulse shows signal flow, not training.', 'network', { layers: [2, 3, 1] }),
};

// The same small example remains consistent across depth variants. A more
// technical learner sees its notation and limitations, not a different figure.
const intermediate = {
  vectors: 'Each component measures displacement along one coordinate axis. Together they determine the arrow; its length comes from the Pythagorean theorem.',
  matrices: 'Multiply each row by the input vector. The resulting coordinates describe where that point moves, and the grid reveals the same rule everywhere.',
  linear: 'State features can be vectors, while matrices map one representation into another. Addition and scaling are the operations that tie them together.',
  probability: 'The probabilities of mutually exclusive outcomes add to one. A distribution records how that total is divided among the possible values.',
  gradient: 'The gradient points toward the steepest local increase. Subtracting a small multiple moves parameters toward lower loss.',
  mdp: 'For each state and action, a transition model gives possible next states. A policy chooses actions; rewards define what counts as success.',
  q: 'One observed transition supplies a target: immediate reward plus the discounted best next estimate. The learning rate controls how far Q moves toward it.',
  reinforcement: 'A policy chooses actions from states. The learner improves that policy using rewards, balancing immediate feedback with later consequences.',
  blackhole: 'An event horizon separates events that can send light to distant observers from those that cannot. Strong curvature affects both space and time.',
  calculus: 'A derivative measures local slope; a definite integral measures signed accumulation over an interval. Here the tangent follows a changing slope.',
  neural: 'Each connection scales a signal by a weight. A neuron adds its weighted inputs and bias, then applies an activation before passing the result onward.',
};
for (const [key, value] of Object.entries(intermediate)) learningLibrary[key].intermediateExplanation = value;
learningLibrary.vectors.examples = [
  'Walk 3 steps right, then 2 up. The arrow reaches the same place in one movement.',
  'v = [3, 2] · length √(3² + 2²) = √13 ≈ 3.61',
  'v = 3e₁ + 2e₂ · ‖v‖₂ = √13 in this orthonormal basis.',
];
learningLibrary.q.examples = [
  'Try moving right. Receive 1 reward. The estimated value of that choice rises from 2 to 3.3.',
  'Target = 1 + 0.9 × 4 = 4.6 · halfway from 2 to 4.6 gives 3.3.',
  'δ = 1 + 0.9 × 4 − 2 = 2.6 · Q ← 2 + 0.5δ = 3.3.',
];
learningLibrary.probability.visualData.caption = 'two fair coin flips';
learningLibrary.blackhole.examples = ['For one solar mass, rₛ ≈ 3 km. The curved surface is a spatial analogy, not a model of light paths or spacetime.'];

Object.assign(learningLibrary, {
  numbers: guide('Numbers measure quantities; symbols let us reason about them.',
    'A symbol is a name for a value. The same rule can work with many different values without being rewritten.',
    'Variables stand for inputs, outputs, or parameters. An expression describes a computation; an equation asserts that two expressions are equal.',
    'Distinguish equality from assignment: x = x + 1 is impossible over the reals, while x ← x + 1 is a valid update to stored state.',
    ['If x = 3, then 2x + 1 = 7. Change x and the same expression still works.']),
  functions: guide('A function assigns one output to each allowed input.',
    'Think of a rule: give it a number and it returns a result. The same input always gives the same output for that rule.',
    'The domain specifies allowed inputs. Composition feeds one function’s output into another function’s input.',
    'A function f:D→C is single-valued but need not be invertible or linear. A stochastic policy can be a function from states to probability distributions.',
    ['f(x) = 2x + 1 · f(3) = 7 · f(0) = 1']),
  algorithms: guide('An algorithm is a precise procedure for carrying out a task.',
    'A recipe says what to do and when to repeat it. A learning algorithm is a recipe for revising a rule from experience.',
    'Specify inputs, operations, stopping conditions, and outputs. Separate the procedure from the data it operates on.',
    'An iterative update defines a sequence, but convergence requires assumptions. Correctness and computational cost are distinct questions.',
    ['Gradient descent: compute a gradient → update parameters → repeat until a stopping condition.']),
  eigen: guide('An eigenvector stays on its own line when a matrix transforms it.',
    'Most arrows change direction as the grid stretches. A special arrow only stretches, shrinks, or reverses along the same line.',
    'The scaling factor is its eigenvalue. In this diagonal transformation, horizontal and vertical directions are eigenvector directions.',
    'Av = λv for nonzero v. A real matrix need not have a real eigenbasis; repeated eigenvalues need not supply independent eigenvectors.',
    ['A[2, 0] = [3, 0] = 1.5[2, 0] · horizontal eigenvalue λ = 1.5.'], 'matrix', { matrix: [[1.5, 0], [0, .7]], vector: [2, 0] }),
  conditional: guide('Conditional probability updates the possibilities after learning an event occurred.',
    'Someone tells you the two coins include at least one head. Remove the no-heads outcome, then compare what remains.',
    'Restrict the sample space to the known event and renormalize. Among HH, HT, and TH, two outcomes have exactly one head.',
    'P(A|B)=P(A∩B)/P(B), for P(B)>0. Conditioning changes probabilities; it does not by itself establish causation.',
    ['Given at least one head: P(1 head) = ⅔, P(2 heads) = ⅓.'], 'distribution', { probabilities: [2/3, 1/3], outcomes: ['1 head', '2 heads'], caption: 'given at least one head' }),
  actionValue: guide('An action value estimates the return from making one particular choice now.',
    'Ask “what if I turn right here?” rather than just “is this a good place?” Later choices still affect the answer.',
    'Qπ fixes the first action and then follows policy π. Vπ averages those action values using the policy’s action probabilities.',
    'Qπ(s,a)=Eπ[Gₜ|Sₜ=s,Aₜ=a]; Vπ(s)=Σₐπ(a|s)Qπ(s,a). Optimal Q* instead assumes optimal future decisions.',
    ['If left has Q = 2 and right has Q = 6, a 50–50 policy has V = 4.']),
  agent: guide('The agent chooses actions; the environment determines what happens next.',
    'For a learning robot, the controller makes a choice and the world responds. The robot does not get to choose the outcome.',
    'Interaction produces observations, rewards, and new states. An observation can contain less information than the true environment state.',
    'The agent–environment boundary is a modeling choice. Partial observability may require history, memory, or a belief state for effective control.',
    ['Controller chooses right → robot moves or slips → sensors and reward return feedback.'], 'feedback', {}),
  interaction: guide('Each interaction supplies one more experience to learn from.',
    'See where you are, choose what to do, and notice what changed. Then make the next choice with that new information.',
    'A transition record contains the current state, action, reward, next state, and whether the episode ended.',
    'An experience tuple (s,a,r,s′,done) supports a TD update. Episode termination is distinct from an externally imposed time-limit truncation.',
    ['(A, right, +1, B, false): a move with reward 1; the episode continues.'], 'feedback', {}),
  objective: guide('The objective is good decisions over time, not just a large next reward.',
    'A small reward now can lead to a much better future. Evaluate the whole sequence, not just its first step.',
    'Expected return averages accumulated reward over the trajectories induced by a policy. Discounting controls how later rewards contribute.',
    'The objective depends on horizon, discounting, initial-state distribution, and reward design. Different choices can produce different optimal policies.',
    ['One trajectory gives 1 + 0.9 × 2 + 0.9² × 3 = 5.23. Compare policies by their expected return.'], 'return', { rewards: [1, 2, 3], discount: .9 }),
  foundations: guide('Learning algorithms turn observations into better rules.',
    'Start with three tools: numbers describe what happens, functions transform those numbers, and algorithms tell us what to do next.',
    'A learning system represents inputs, evaluates a rule, and updates that rule from feedback. These basic operations recur throughout RL.',
    'Representations, function evaluation, and iterative updates are prerequisites for expressing a learning procedure; they do not by themselves define an RL objective.',
    ['Observe a position → choose a move → use the outcome to revise the next choice.'], 'feedback', {}),
  components: guide('Components separate a vector into movements along reference directions.',
    'The diagonal arrow is one trip. Its components are the rightward and upward movements that make that trip.',
    'In these perpendicular axes, the horizontal component is 3 and the vertical component is 2. Adding those displacements reconstructs the vector.',
    'In basis B = (e₁, e₂), v = 3e₁ + 2e₂. Coordinates depend on the basis; the underlying vector does not.',
    ['3 right + 2 up = the same displacement as the diagonal arrow.', 'vₓ = 3 · vᵧ = 2 · v = [3, 0] + [0, 2]', '[v]B = (3, 2); a different basis generally gives different components.'],
    'vector', { components: [3, 2], mode: 'components' }),
  coordinates: guide('Coordinates are an ordered address in a chosen reference frame.',
    'Read the horizontal instruction first, then the vertical one. Swapping them leads to a different place.',
    'The pair (3, 2) locates the endpoint relative to the origin. A position needs an origin as well as axis directions and units.',
    'Point coordinates use an affine frame. Subtracting the coordinates of two points yields the displacement vector in its associated basis.',
    ['(3, 2): 3 along the first axis, 2 along the second. Not the same as (2, 3).'], 'vector', { components: [3, 2], mode: 'components' }),
  axes: guide('Coordinate axes establish the reference directions.',
    'Choose what counts as right and up. Then every movement can be measured against those directions.',
    'The horizontal x-axis and vertical y-axis meet at the origin. Their chosen units tell us what one step means.',
    'The displayed axes form an orthogonal Cartesian frame. Not all coordinate systems or bases are orthogonal.',
    ['The origin is (0, 0). The endpoint is 3 x-units and 2 y-units away.'], 'vector', { components: [3, 2], mode: 'components' }),
  ordered: guide('The position of a number tells you which direction it measures.',
    'The same two numbers can be two different instructions. Right then up is not up then right when assigning the numbers.',
    'Coordinate tuples use an agreed axis order. Here the first entry belongs to x and the second to y.',
    'A coordinate permutation changes the represented vector unless the basis ordering is permuted consistently.',
    ['[3, 2] ends at 3 right, 2 up. [2, 3] ends at 2 right, 3 up.'], 'vector', { components: [2, 3], mode: 'components' }),
  basis: guide('A basis is a set of independent directions that can build every vector in a space.',
    'Right and up are enough to describe any movement on this flat plane. Neither direction can replace the other.',
    'A basis must span the space and be linearly independent. Those two conditions make the coordinates of each vector unique.',
    'For an n-dimensional vector space, a basis contains n linearly independent vectors. Orthogonality is useful, not required.',
    ['e₁ = [1, 0] · e₂ = [0, 1] · 3e₁ + 2e₂ = [3, 2]'], 'vector', { components: [3, 2], mode: 'components' }),
  reconstruction: guide('Scale each basis direction, then add the pieces.',
    'Take three rightward steps and two upward steps. Their combined displacement is the original arrow.',
    'Each coordinate is a coefficient of its basis vector. Their weighted sum reconstructs the vector.',
    'With basis vectors as columns of B, v = B[v]B. Invertible B converts between coordinates and the ambient representation.',
    ['3[1, 0] + 2[0, 1] = [3, 2]'], 'vector', { components: [3, 2], mode: 'components' }),
  addition: guide('Adding vectors combines their displacements.',
    'Walk along the first arrow, then the second. The sum goes straight from where you started to where you finish.',
    'Add matching coordinates. The head-to-tail construction and component-wise addition give the same result.',
    'Vector addition is independent of coordinates: [u + v]B = [u]B + [v]B in every basis B.',
    ['[2, 0] + [1, 2] = [3, 2]'], 'vector-sum', { first: [2, 0], second: [1, 2] }),
  dot: guide('The dot product measures how strongly two vectors point together.',
    'Project one arrow onto the direction of the other. Pointing together gives a positive result; a right angle gives zero.',
    'Multiply matching components and sum them. This equals the product of the lengths times the cosine of their angle.',
    'uᵀv = ‖u‖₂‖v‖₂ cos θ in an orthonormal basis. Projection onto unit direction e is (vᵀe)e.',
    ['[3, 2] · [1, 0] = 3. The horizontal projection is [3, 0].'], 'projection', { components: [3, 2] }),
  distributions: guide('A distribution tells you how uncertainty is spread across possible values.',
    'Flip two coins. One head happens twice as often as either zero heads or two heads, because there are two ways to get it.',
    'For a discrete variable, the probability mass function assigns probability to each value. All masses sum to one.',
    'For X ~ Binomial(2, ½), P(X = k) = C(2,k)/4 for k ∈ {0,1,2}. A density for a continuous variable behaves differently: probabilities are areas.',
    ['HH → 2 · HT or TH → 1 · TT → 0 heads'], 'distribution', { probabilities: [.25, .5, .25], outcomes: ['0 heads', '1 head', '2 heads'], caption: 'probability mass · total = 1' }),
  random: guide('A random variable assigns a number to an uncertain outcome.',
    'The coins land as heads or tails. Count the heads and that uncertain result becomes a number.',
    'A variable and its distribution are different: X defines the quantity, while P(X = x) describes its chances.',
    'A random variable is a measurable function on a probability space. Here X maps each two-coin outcome to its head count.',
    ['X(HH) = 2 · X(HT) = X(TH) = 1 · X(TT) = 0'], 'distribution', { probabilities: [.25, .5, .25], outcomes: ['X = 0', 'X = 1', 'X = 2'], caption: 'X counts heads' }),
  expectation: guide('Expected value is an average weighted by how likely each outcome is.',
    'Repeat the same uncertain experiment many times. This is the average result to expect, not a promise about any one attempt.',
    'Multiply each possible value by its probability, then add. For two fair coin flips, the expected number of heads is one.',
    'For discrete X, E[X] = Σₓ xP(X=x), when the expectation exists. A long-run sample average requires appropriate sampling assumptions.',
    ['0 × ¼ + 1 × ½ + 2 × ¼ = 1 expected head.'], 'distribution', { probabilities: [.25, .5, .25], outcomes: ['0 heads', '1 head', '2 heads'], caption: 'weighted average = 1 head' }),
  optimization: guide('Optimization searches for parameters that improve an objective.',
    'Imagine adjusting a dial until the error gets smaller. The landscape tells you which settings work better.',
    'Define a loss, choose parameters, and repeatedly update them. Gradient descent is one method for this search.',
    'Minimize L(θ) over a feasible parameter space. Stationary points need not be global minima; this convex quadratic is a deliberately simple case.',
    ['L(x) = x² has its minimum at x = 0. Each shown update lowers this loss.'], 'descent', { initial: 3, rate: .2 }),
  gradients: guide('A gradient points toward the steepest local increase.',
    'On a hill, it points uphill. To reduce the height, take a small step the other way.',
    'Collect the partial derivatives into one vector. In one dimension, the gradient is simply the derivative.',
    '∇L gives the steepest ascent direction under the Euclidean norm. For L(x)=x², ∇L(x)=2x.',
    ['At x = 3, the gradient is 6. A step of −0.2 × 6 moves to x = 1.8.'], 'descent', { initial: 3, rate: .2 }),
  loss: guide('A loss assigns a numerical cost to an error.',
    'A prediction farther from its target should usually cost more. Squaring the error makes big misses especially expensive.',
    'For a zero target, squared error is L(x)=x². Training seeks parameters that reduce an aggregate loss over examples.',
    'Squared error is smooth and convex in a scalar prediction. It need not be convex in the parameters of a nonlinear model.',
    ['Predict 3 when the target is 0: loss = 9. Predict 1.8: loss = 3.24.'], 'descent', { initial: 3, rate: .2 }),
  rate: guide('The learning rate controls how much an update changes an estimate.',
    'Small steps are cautious. Oversized steps can jump past what you were trying to reach.',
    'For gradient descent, multiply the gradient by α before subtracting it. A useful step size depends on the local curvature.',
    'For L(x)=x², xₖ₊₁=(1−2α)xₖ converges for 0<α<1. General objectives require other conditions.',
    ['α = 0.2 · first step: 3 − 0.2 × 6 = 1.8'], 'descent', { initial: 3, rate: .2 }),
  states: guide('A state describes what matters for the next decision.',
    'For a robot, its current square might be enough. If speed matters too, the square alone is not enough information.',
    'A Markov state summarizes the history needed to predict future transitions and rewards, given the action.',
    'The Markov assumption requires P(sₜ₊₁,rₜ₊₁|history,aₜ)=P(sₜ₊₁,rₜ₊₁|sₜ,aₜ). Observations need not satisfy it.',
    ['Here the robot is at A. Choosing right can lead to B or leave it at A.'], 'transition', { success: .8 }),
  actions: guide('An action is a choice that can change the next state.',
    'Choosing right is the instruction. Reaching the next square is an outcome; the two are not the same.',
    'The action space lists available choices. The environment maps each state–action pair to possible outcomes.',
    'Actions may be discrete or continuous. A state-dependent feasible set A(s) excludes invalid choices.',
    ['Action: move right. Outcomes: 80% reach B, 20% remain at A.'], 'transition', { success: .8 }),
  rewards: guide('A reward is immediate feedback, not the whole objective.',
    'One choice may pay now but lead somewhere worse later. Learning should account for the sequence that follows.',
    'Return combines future rewards. A discount factor weights later rewards less strongly than immediate ones.',
    'Gₜ = Σₖ≥0 γᵏRₜ₊ₖ₊₁. The reward design defines the objective; maximizing it need not capture an unstated human intention.',
    ['Rewards 1, 2, 3 with γ = 0.9 give 1 + 1.8 + 2.43 = 5.23.'], 'return', { rewards: [1, 2, 3], discount: .9 }),
  values: guide('A value function estimates the future return from a state.',
    'Two places can look equally good now but lead to very different futures. Value estimates those later consequences.',
    'V evaluates a state under a policy. Q evaluates choosing a particular action first, then following that policy.',
    'Vπ(s)=Eπ[Gₜ|Sₜ=s]; Qπ(s,a)=Eπ[Gₜ|Sₜ=s,Aₜ=a]. A single rollout is a sample, not the expectation.',
    ['One rollout: 1 + 0.9 × 2 + 0.9² × 3 = 5.23. Value averages possible rollouts.'], 'return', { rewards: [1, 2, 3], discount: .9 }),
  policy: guide('A policy describes how an agent chooses actions.',
    'At the same place, a robot might always move right, or sometimes try another direction. Both are decision rules.',
    'A deterministic policy chooses one action per state. A stochastic policy assigns a probability to each available action.',
    'π(a|s) is an action distribution, not a transition probability. Changing π changes which trajectories are sampled.',
    ['At state A: choose right 80% of the time, left 20%. These are choices, not success rates.'], 'distribution', { probabilities: [.2, .8], outcomes: ['choose left', 'choose right'], caption: 'policy at state A' }),
  policyLearning: guide('Policy learning improves the rule that chooses actions.',
    'Experience helps an agent change what it tends to do. Promising choices become more likely, without assuming every lucky result was a good decision.',
    'A policy can be improved using value estimates or optimized directly from sampled returns.',
    'For a parameterized policy, optimize J(θ)=Eτ~πθ[R(τ)]. A finite sample gradient is noisy and does not guarantee improvement on every update.',
    ['Observe → choose an action → receive feedback → revise the decision rule.'], 'feedback', {}),
  policyGradient: guide('Policy gradients adjust action probabilities using experience.',
    'Make choices associated with better-than-expected outcomes more likely, using many experiences rather than one lucky result.',
    'Estimate how a small parameter change affects expected return, then step in the direction of improvement.',
    'For finite-horizon episodic REINFORCE, ∇J=E[Σₜ ∇log πθ(aₜ|sₜ)Gₜ]. A state-only baseline can reduce variance without bias.',
    ['The gradient changes the policy itself; it does not require an explicit transition model.']),
  advantage: guide('Advantage compares an action with the state’s usual outlook.',
    'A good result is more informative when the situation was difficult. Compare the choice with what was already expected.',
    'Subtract state value from action value, using the same policy. Positive advantage means better than that baseline.',
    'Aπ(s,a)=Qπ(s,a)−Vπ(s), so Eₐ~π[Aπ(s,a)]=0. Estimated advantages can still be noisy.',
    ['Qπ(s,right)=6 and Vπ(s)=4 → Aπ(s,right)=2.']),
  bellman: guide('A Bellman equation connects value now to reward and value next.',
    'Instead of imagining the entire future at once, separate the next reward from everything that comes afterward.',
    'The optimal action value averages reward plus discounted best next value over possible transitions. Q-learning uses a sampled transition.',
    'Q*(s,a)=E[r+γ maxₐ′Q*(s′,a′)|s,a]. The displayed sample target is an estimate, not the full expectation.',
    ['Observed reward 1 + 0.9 × best next estimate 4 = sample target 4.6.'], 'value-update', { old: 2, reward: 1, next: 4, discount: .9, rate: .5 }),
  td: guide('Temporal-difference error measures the gap to a bootstrapped target.',
    'Compare what you expected with the reward and new outlook you actually observed. Use that surprise to revise the old estimate.',
    'For Q-learning, subtract the current Q-value from reward plus discounted best next Q. Multiply that error by α for the update.',
    'δ=r+γ maxₐ′Q(s′,a′)−Q(s,a). At a terminal transition, the next-value term is zero.',
    ['δ = 4.6 − 2 = 2.6 · αδ = 1.3 · new Q = 3.3'], 'value-update', { old: 2, reward: 1, next: 4, discount: .9, rate: .5 }),
  exploration: guide('Exploration tries uncertain choices; exploitation uses the current best estimate.',
    'The familiar route may work well, but you will never discover a better one if you never try it.',
    'An ε-greedy policy usually chooses a highest-valued action and otherwise samples uniformly from all available actions.',
    'With a unique greedy action and n actions, ε-greedy assigns it 1−ε+ε/n, and assigns ε/n to each other action.',
    ['ε = 0.2 with two actions → greedy action 90%, other action 10%.'], 'distribution', { probabilities: [.1, .9], outcomes: ['other action', 'greedy action'], caption: 'ε-greedy · ε = 0.2' }),
  qtable: guide('A Q-table stores one estimate for each discrete state–action pair.',
    'Remember how promising each choice looks in each place. One experience revises the entry for the choice you actually made.',
    'The table is a representation of Q, not a different learning rule. Q-learning updates the visited pair toward a sampled target.',
    'Tabular storage scales as |S|×|A|. Large or continuous spaces usually need approximation rather than an entry for every pair.',
    ['At A, try right: Q(A,right) changes 2 → 3.3. Unvisited entries stay unchanged.'], 'value-update', { old: 2, reward: 1, next: 4, discount: .9, rate: .5 }),
});

const exactContent = {
  'Numbers & Symbols': 'numbers', Functions: 'functions', 'Inputs & Outputs': 'functions', Algorithms: 'algorithms',
  'Eigenvalues & Eigenvectors': 'eigen', 'Invariant Directions': 'eigen', 'Eigenvalue Scaling': 'eigen',
  'Conditional Probability': 'conditional', Conditioning: 'conditional', 'Agent & Environment': 'agent',
  'Interaction Loop': 'interaction', 'Learning Objective': 'objective', 'Expected Return Objective': 'objective',
  Foundations: 'foundations', 'Components of a Vector': 'components', Coordinates: 'coordinates',
  'Coordinate Axes': 'axes', 'Ordered Coordinates': 'ordered', 'Basis Directions': 'basis', 'Reconstructing a Vector': 'reconstruction',
  'Vector Addition': 'addition', 'Adding Components': 'addition', 'Head-to-Tail Geometry': 'addition', 'Dot Product': 'dot', Projection: 'dot',
  'Probability Distributions': 'distributions', 'Random Variables': 'random', 'Expected Value': 'expectation', 'Weighted Average': 'expectation',
  Optimization: 'optimization', Gradients: 'gradients', 'Loss Functions': 'loss', 'Squared Error': 'loss', 'Learning Rate': 'rate', 'Step Size': 'rate',
  States: 'states', 'State Representation': 'states', 'Markov Property': 'states', Actions: 'actions', 'Action Space': 'actions',
  'Transition Probabilities': 'mdp', 'Transition Model': 'mdp', Rewards: 'rewards', Return: 'rewards', Discounting: 'rewards', 'Discount Factor': 'rewards',
  'Value Functions': 'values', 'Value Function': 'values', 'State-Value': 'values', 'Expected Return': 'values',
  'Q-Values': 'actionValue', 'Action-Value': 'actionValue', Policy: 'policy', Policies: 'policy', 'Stochastic Policy': 'policy',
  'Policy Learning': 'policyLearning', 'Policy Improvement': 'policyLearning', 'Policy Gradients': 'policyGradient', Advantage: 'advantage',
  'Bellman Equation': 'bellman', 'Bellman Target': 'bellman', 'Temporal-Difference Error': 'td', 'Q-Value Update': 'q',
  'Exploration vs Exploitation': 'exploration', 'Epsilon-Greedy': 'exploration', 'Q-Table': 'qtable', 'Updating the Table': 'qtable',
};

function contentKey(title) {
  const authored = Object.keys(exactContent).find(key => key.toLowerCase() === title.toLowerCase());
  if (authored) return exactContent[authored];
  if (/^vectors$/i.test(title)) return 'vectors';
  if (/^(matrices|matrix transformations|linear transformations)$/i.test(title)) return 'matrices';
  if (/^linear algebra$/i.test(title)) return 'linear';
  if (/^(probability|distributions)$/i.test(title)) return 'probability';
  if (/^gradient descent$/i.test(title)) return 'gradient';
  if (/^markov decision processes$/i.test(title)) return 'mdp';
  if (/^q-learning$/i.test(title)) return 'q';
  if (/^(understanding )?reinforcement learning$/i.test(title)) return 'reinforcement';
  if (/^(understanding black holes|black hole physics|event horizons)$/i.test(title)) return 'blackhole';
  if (/^(calculus from the beginning|derivatives|tangent slopes)$/i.test(title)) return 'calculus';
  if (/^(how neural networks learn|neural networks)$/i.test(title)) return 'neural';
  return null;
}

export function addLearningContent(source) {
  const result = structuredClone(source);
  function visit(node) {
    const content = learningLibrary[contentKey(node.title)];
    if (content && !node.explanation) Object.assign(node, structuredClone(content));
    (node.children || []).forEach(visit);
  }
  visit(result); return result;
}

export function explanationFor(concept, context = {}) {
  if (!concept?.explanation) return null;
  const skills = readLearner(context.userBackground);
  const review = context.overrides?.[concept.id] === 'unknown';
  const technical = !review && (isKnown(concept.learnerState) ||
    (concept.domain === 'mathematics' && (isKnown(skills.linear) || isKnown(skills.calculus))) ||
    (concept.domain === 'probability' && isKnown(skills.probability)) ||
    (['physics', 'spacetime'].includes(concept.domain) && isKnown(skills.physics)) ||
    Object.values(skills).filter(isKnown).length >= 3);
  const relevant = { mathematics: ['algebra', 'linear', 'calculus'], probability: ['probability'],
    learning: ['optimization', 'programming', 'calculus'], reinforcement: ['probability', 'optimization', 'programming'],
    foundations: ['programming', 'algebra'], physics: ['physics'], spacetime: ['physics'] }[concept.domain] || [];
  const familiar = !review && (concept.learnerState === 'familiar' || relevant.some(skill => skills[skill] && skills[skill] !== 'unknown'));
  const variant = technical ? 'advanced' : familiar ? 'intermediate' : 'intuitive';
  const exampleIndex = { intuitive: 0, intermediate: 1, advanced: 2 }[variant];
  return { title: concept.title, explanation: concept.explanation,
    intuition: (technical ? concept.advancedExplanation : familiar ? concept.intermediateExplanation : concept.intuitiveExplanation) || concept.intuitiveExplanation || concept.explanation,
    example: concept.examples?.[exampleIndex] || concept.examples?.[0] || '', variant,
    visualType: concept.visualType || null, visualData: structuredClone(concept.visualData || {}) };
}

export const visualTypes = ['vector', 'vector-sum', 'projection', 'return', 'matrix', 'distribution', 'descent', 'transition', 'value-update', 'feedback', 'horizon', 'derivative', 'network'];
export function validateLearning(source) {
  for (const key of ['explanation', 'intuitiveExplanation', 'intermediateExplanation', 'advancedExplanation']) {
    if (source[key] !== undefined && (typeof source[key] !== 'string' || !source[key].trim() || source[key].length > 600)) throw new Error(`Invalid ${key}: ${source.id}`);
  }
  if (source.examples !== undefined && (!Array.isArray(source.examples) || source.examples.length > 4 || source.examples.some(example => typeof example !== 'string' || example.length > 600))) throw new Error(`Invalid examples: ${source.id}`);
  if (source.visualType !== undefined && !visualTypes.includes(source.visualType)) throw new Error(`Unknown learning visual: ${source.id}`);
  if (source.visualType && !source.explanation) throw new Error(`A visual needs an explanation: ${source.id}`);
  if (!source.visualType) return;
  const data = source.visualData;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`Missing visual data: ${source.id}`);
  if (data.caption !== undefined && (typeof data.caption !== 'string' || data.caption.length > 80)) throw new Error(`Invalid visual caption: ${source.id}`);
  const finite = (n, min = -10, max = 10) => Number.isFinite(n) && n >= min && n <= max;
  const pair = value => Array.isArray(value) && value.length === 2 && value.every(n => finite(n));
  const valid = {
    vector: () => pair(data.components) && data.components.some(n => n !== 0) && (data.mode === undefined || data.mode === 'components'),
    'vector-sum': () => pair(data.first) && pair(data.second),
    projection: () => pair(data.components) && data.components.some(n => n !== 0),
    return: () => Array.isArray(data.rewards) && data.rewards.length === 3 && data.rewards.every(n => finite(n, 0, 4)) && finite(data.discount, 0, 1),
    matrix: () => pair(data.vector) && Array.isArray(data.matrix) && data.matrix.length === 2 && data.matrix.every(pair),
    distribution: () => Array.isArray(data.probabilities) && data.probabilities.length >= 2 && data.probabilities.length <= 5 && data.probabilities.every(n => finite(n, 0, 1)) && Math.abs(data.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-6 && Array.isArray(data.outcomes) && data.outcomes.length === data.probabilities.length && data.outcomes.every(s => typeof s === 'string' && s.length < 40),
    descent: () => finite(data.initial, .1, 3) && finite(data.rate, .01, .45),
    transition: () => finite(data.success, 0, 1),
    'value-update': () => finite(data.old, 0, 10) && finite(data.reward, 0, 10) && finite(data.next, 0, 10) && finite(data.discount, 0, 1) && finite(data.rate, 0, 1),
    feedback: () => true,
    horizon: () => finite(data.radius, .3, 2),
    derivative: () => finite(data.at, .2, 1.8),
    network: () => Array.isArray(data.layers) && data.layers.length === 3 && data.layers.every(n => Number.isInteger(n) && n >= 1 && n <= 4),
  };
  if (!valid[source.visualType]()) throw new Error(`Invalid learning geometry: ${source.id}`);
}
