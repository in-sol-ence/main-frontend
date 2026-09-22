import { smootherstep } from './motion.js';

export const examples = ['Understand reinforcement learning', 'Learn how black holes work', 'Learn calculus from the beginning', 'Build my first game engine', 'Understand how neural networks learn'];

// A finite, deterministic choreography, separate from loading or generation.
// A future asynchronous provider resolves BEFORE this sequence begins.
export const DISCOVERY_DURATION = 11.8;
export function constructionAt(seconds, reduced = false) {
  const duration = reduced ? 1.4 : DISCOVERY_DURATION;
  const t = Math.max(0, Math.min(1, seconds / duration));
  const ease = (start, end) => Math.max(0, Math.min(1, smootherstep((t - start) / (end - start))));
  return {
    done: t === 1, prompt: 1 - ease(0, .19), seed: 0,
    path: ease(.58, .91), handoff: ease(.63, .92), labels: ease(.76, .98), relationships: ease(.86, 1),
    travel: reduced ? 0 : ease(.79, 1), context: ease(.87, 1),
    convergence: ease(.04, .64), selection: ease(.16, .70), softness: ease(.32, .94),
    camera: reduced ? Number(t >= .5) : ease(0, .96),
    arrival: reduced ? ease(.5, 1) : 1, field: reduced ? 1 - ease(0, .48) : 1,
  };
}

export function resetAt(seconds, reduced = false) {
  return 1 - smootherstep(seconds / (reduced ? .45 : 1.5));
}
