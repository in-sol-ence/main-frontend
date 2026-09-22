import * as THREE from '../vendor/three.module.min.js';
import { pointAt, tangentAt } from './trajectory.js';
import { clamp, smootherstep } from './motion.js';

const up = new THREE.Vector3(0, 1, 0);
const tangent = new THREE.Vector3();
const right = new THREE.Vector3();

export function cycleForSlot(slot, currentCycle) {
  const first = currentCycle - 1;
  return first + ((slot - first) % 3 + 3) % 3;
}

export function locateConcept(concept, cycle, arc) {
  const distance = (cycle + concept.at) * arc.length;
  const station = arc.stationAtDistance(distance);
  const root = pointAt(station, new THREE.Vector3());
  tangentAt(station, tangent);
  right.crossVectors(tangent, up).normalize();
  const foot = root.clone().addScaledVector(right, concept.offset);
  const anchor = foot.clone().addScaledVector(up, concept.height);
  return { distance, station, root, foot, anchor };
}

export function appearanceAt(depth, weight, viewportHeight) {
  if (depth <= 0) return { opacity: 0, size: 0 };
  // A bounded perspective scale keeps type crisp, but never screen-locked.
  const perspective = Math.pow(30 / Math.max(depth, 3), .76);
  const size = clamp(23 * Math.sqrt(weight) * perspective * Math.min(1.08, Math.sqrt(viewportHeight / 720)), 4, 37 * Math.sqrt(weight));
  const atmospheric = Math.exp(-Math.pow(depth / (83 + Math.min(1.9, weight) * 9), 1.55));
  const entry = smootherstep((depth - 4) / 8);
  const far = 1 - smootherstep((depth - 125) / 65);
  return { size, opacity: clamp(atmospheric * entry * far * (.83 + weight * .1), 0, .96) };
}

export function overlap(a, b, padding = 8) {
  return a.x < b.x + b.width + padding && a.x + a.width + padding > b.x
    && a.y < b.y + b.height + padding && a.y + a.height + padding > b.y;
}

export function chooseLabelSide({ side, x, labelWidth, gap, width, opacity, immediate }) {
  const fits = direction => {
    const left = direction === 0 ? x - labelWidth / 2 : direction === 1 ? x + gap : x - gap - labelWidth;
    return left >= 22 && left + labelWidth <= width - 22;
  };
  // Only change sides while invisible (or on an explicit viewport resize).
  // Never drag a visible name across its anchor to keep it on screen.
  if (!fits(side) && (opacity < .04 || immediate)) {
    for (const alternative of [side === 0 ? 1 : -side, 0, -1]) {
      if (fits(alternative)) return alternative;
    }
  }
  return side;
}

// The nearest readable location wins. Far labels gently yield rather than
// shifting around in screen space and looking like dashboard annotations.
export function resolveLabels(candidates, width, height) {
  const accepted = [];
  for (const candidate of [...candidates].sort((a, b) =>
    ((b.learner?.weight || 0) > .15 ? 1 : 0) - ((a.learner?.weight || 0) > .15 ? 1 : 0) ||
    (b.priority ?? 0) - (a.priority ?? 0) || (a.order ?? a.depth) - (b.order ?? b.depth))) {
    let opacity = candidate.opacity;
    const gutter = 12;
    const clearance = Math.min(candidate.x - gutter, width - gutter - candidate.x - candidate.width,
      candidate.y - gutter, height - gutter - candidate.y - candidate.height);
    opacity *= smootherstep((clearance + 12) / 32);
    if (accepted.some(other => overlap(candidate, other, 8 + 8 * (candidate.importance || 0)))) opacity = 0;
    candidate.targetOpacity = opacity;
    if (opacity > .04) {
      accepted.push(candidate);
      if (candidate.learner?.weight > .15 && candidate.annotationBounds) accepted.push(candidate.annotationBounds);
    }
  }
  return candidates;
}
