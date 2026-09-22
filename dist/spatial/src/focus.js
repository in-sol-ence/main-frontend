import * as THREE from '../vendor/three.module.min.js';
import { clamp, dampSpring } from './motion.js';

// World-space ray tests use a small screen-readable tolerance. The stem is
// sampled too: the learner does not have to find a one-pixel point or a word.
const raycaster = new THREE.Raycaster(), pointerNDC = new THREE.Vector2();
const sphere = new THREE.Sphere(), sample = new THREE.Vector3();
export function pickConcept({ pointer, camera, width, height, candidates, retainedKey = null }) {
  if (!pointer || width <= 0 || height <= 0) return null;
  raycaster.setFromCamera(pointerNDC.set(pointer.x / width * 2 - 1, 1 - pointer.y / height * 2), camera);
  let nearest = null;
  for (const item of candidates) {
    if (item.depth <= 6 || item.depth > 155 || item.presence < .035) continue;
    const padding = item.key === retainedKey ? 6 : 0;
    const pixels = 12 + 5 * item.concept.importance + padding;
    const radius = pixels * 2 * item.depth / (height * camera.projectionMatrix.elements[5]);
    let spatialHit = false;
    for (let i = 0; i <= 3; i++) {
      sample.copy(item.anchor).lerp(item.foot, i / 3);
      sphere.set(sample, radius);
      if (raycaster.ray.intersectsSphere(sphere)) { spatialHit = true; break; }
    }
    const box = item.label;
    const note = item.annotation;
    const textHit = item.labelOpacity > .035 && box &&
      pointer.x >= box.x - 5 - padding && pointer.x <= box.x + box.width + 5 + padding &&
      pointer.y >= box.y - 5 - padding && pointer.y <= box.y + box.height + 5 + padding;
    const annotationHit = note && item.labelOpacity > .035 &&
      pointer.x >= note.x - padding && pointer.x <= note.x + note.width + padding &&
      pointer.y >= note.y - padding && pointer.y <= note.y + note.height + padding;
    if ((spatialHit || textHit || annotationHit) && (!nearest || item.depth < nearest.depth)) nearest = item;
  }
  // Ray depth, not DOM order or concept importance, resolves overlapping targets.
  return nearest;
}

export class LearnerFocus {
  // `emphasis` names a concept the system itself is selecting. Only the
  // scripted demonstration sets it; pointer focus never does.
  constructor() { this.entries = new Map(); this.targetKey = null; this.emphasis = null; }
  update(hit, dt) {
    this.targetKey = hit?.key || null;
    if (hit && !this.entries.has(hit.key)) this.entries.set(hit.key, { ...hit, value: 0, velocity: 0 });
    if (hit) Object.assign(this.entries.get(hit.key), hit);
    for (const [key, entry] of this.entries) {
      const next = dampSpring(entry.value, entry.velocity, key === this.targetKey ? 1 : 0, key === this.targetKey ? 9 : 7.5, clamp(dt, 0, .05));
      entry.value = clamp(next.value, 0, 1); entry.velocity = next.velocity;
      if (entry.value < .0001 && key !== this.targetKey) this.entries.delete(key);
    }
  }
  reset() { this.entries.clear(); this.targetKey = null; this.emphasis = null; }
  get strength() {
    let sum = 0;
    for (const entry of this.entries.values()) sum += entry.value;
    return Math.min(1, sum);
  }
  get speedScale() {
    let reduction = 0;
    for (const entry of this.entries.values()) reduction += entry.value * (.46 + .12 * entry.concept.importance);
    return 1 - Math.min(.58, reduction);
  }
  weight(key) { return this.entries.get(key)?.value || 0; }
  relevance(concept, cycle) {
    let connected = 0;
    for (const entry of this.entries.values()) {
      if (entry.cycle !== cycle) continue;
      if (entry.concept.id === concept.id || entry.concept.prerequisites.includes(concept.id) || concept.prerequisites.includes(entry.concept.id)) connected += entry.value;
    }
    return Math.min(1, connected);
  }
  pathway(source, target, cycle) {
    let value = 0;
    for (const entry of this.entries.values()) {
      if (entry.cycle === cycle && (entry.concept.id === source || entry.concept.id === target)) value += entry.value;
    }
    return Math.min(1, value);
  }
}

export function focusAppearance(focus, concept, cycle) {
  const weight = focus?.weight(`${cycle}:${concept.id}`) || 0;
  const unrelated = Math.max(0, (focus?.strength || 0) - (focus?.relevance(concept, cycle) || 0));
  return {
    weight,
    presence: (1 + weight * (.25 + .15 * concept.importance)) * (1 - unrelated * .30),
    scale: 1 + weight * (.08 + .08 * concept.importance),
    // A system selection grows the concept's own point marker and gives the
    // statement beside the space the job its small annotation would do.
    selected: focus?.emphasis === `${cycle}:${concept.id}`,
    emphasis: focus?.emphasis === `${cycle}:${concept.id}` ? weight : 0,
  };
}
