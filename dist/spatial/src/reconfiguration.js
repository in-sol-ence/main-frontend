import { smootherstep } from './motion.js';
import { isKnown } from './adaptation.js';

// Interpolate the live nodes rather than replacing the scene or teleporting the
// camera. Each layer owns its definition, so parent/child histories stay valid.
export function createReconfiguration(current, next, { anchorId, distance = 0, arcLength = 1, active = false } = {}) {
  const previous = new Map(current.children.map(node => [node.id, node]));
  if (next.children.length !== previous.size || next.children.some(node => !previous.has(node.id))) throw new Error('Adaptive retargeting requires stable concept identities.');
  const selected = previous.get(anchorId);
  const anchor = next.children.find(node => node.id === anchorId && !isKnown(node.learnerState)) ||
    next.children.find(node => !isKnown(node.learnerState) && previous.get(node.id).at >= (selected?.at ?? distance / arcLength)) || next.children.at(-1);
  const shift = active && anchor ? (distance + 34) / arcLength - anchor.at : (current.routeShift || 0);
  const tracks = next.children.map(target => {
    const node = previous.get(target.id);
    const from = { at: node.at, importance: node.importance, height: node.height, offset: node.offset };
    return { node, from, target: { ...structuredClone(target), at: target.at + shift } };
  });
  const fromEnd = current.route?.end ?? 1, toEnd = (next.route?.end ?? 1) + shift;
  return {
    apply(progress) {
      const t = smootherstep(progress);
      for (const { node, from, target } of tracks) {
        for (const field of ['at', 'importance', 'height', 'offset']) node[field] = from[field] + (target[field] - from[field]) * t;
        if (progress >= 1) Object.assign(node, target);
        node.position = { at: node.at, offset: node.offset, height: node.height, side: node.side };
      }
      current.route = { ...next.route, end: fromEnd + (toEnd - fromEnd) * t };
      if (progress >= 1) {
        const children = next.children.map(node => previous.get(node.id));
        Object.assign(current, structuredClone(next), { children, routeShift: shift, route: { ...next.route, end: toEnd } });
      }
      return progress >= 1;
    },
  };
}
