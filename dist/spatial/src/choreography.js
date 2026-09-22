import * as THREE from '../vendor/three.module.min.js';
import { clamp, smootherstep } from './motion.js';
import { locateConcept } from './landmark-layout.js';
import { PERIOD } from './trajectory.js';
import { tintFor } from './hierarchy.js';

// All encounter behavior derives from concept data, not a timed shot sequence.
// `ahead` is physical arc-length distance; positive means still to come.
export function encounterAt(concept, ahead) {
  const importance = clamp(concept.importance, 0, 1);
  const major = concept.role === 'milestone' || concept.role === 'goal';
  const farPlateau = major ? 24 + 8 * importance : 14 + 12 * importance;
  const farFeather = major ? 12 + 8 * importance : 8 + 8 * importance;
  const nearEdge = major ? -6 : -2;
  const nearFeather = major ? 14 + 5 * importance : 10;
  const approach = 1 - smootherstep((ahead - farPlateau) / farFeather);
  const departure = smootherstep((ahead - nearEdge) / nearFeather);
  const envelope = approach * departure;
  const floor = Math.max(.30, 1 - .75 * importance ** 2 - (major ? .095 : 0));
  const focus = smootherstep((ahead - 7) / 9)
    * (1 - smootherstep((ahead - (28 + 8 * importance)) / 18)) * importance ** 2;
  return {
    speedScale: 1 - (1 - floor) * envelope,
    focus,
    gaze: major ? Math.max(focus, .22 * importance ** 2 * smootherstep((ahead - 24) / 10) * (1 - smootherstep((ahead - 52) / 16))) : focus * .25,
    context: major ? focus : 0,
    passed: 1 - smootherstep((-ahead - 2) / 16),
  };
}

export function landmarkAttention(concept, ahead, contextStrength = 0) {
  const encounter = encounterAt(concept, ahead);
  const quiet = 1 - .18 * contextStrength * (1 - concept.importance) * (1 - encounter.focus);
  return {
    opacity: (1 + .10 * encounter.focus) * quiet * encounter.passed,
    scale: 1 + .06 * encounter.focus,
    illumination: 1 + .18 * encounter.focus,
  };
}

export function createChoreography({ concepts, arc }) {
  const placements = concepts.map(concept => ({ concept, tint: tintFor(concept).convertLinearToSRGB(), ...locateConcept(concept, 0, arc) }));
  function eachEncounter(distance, visit) {
    const cycle = Math.floor(distance / arc.length);
    for (let offset = -1; offset <= 1; offset++) {
      const index = cycle + offset;
      for (const placement of placements) {
        const ahead = placement.distance + index * arc.length - distance;
        // Outside the envelope all contributions are exactly neutral.
        if (ahead < -24 || ahead > 75) continue;
        visit(placement, index, encounterAt(placement.concept, ahead));
      }
    }
  }
  return {
    speedScale(distance) {
      let scale = 1;
      // Strongest encounter wins; dense prerequisite regions never multiply
      // slowdowns together or turn into an accidental stop.
      eachEncounter(distance, (_, __, encounter) => { scale = Math.min(scale, encounter.speedScale); });
      return scale;
    },
    sample(distance) {
      let totalGaze = 0, contextStrength = 0;
      const target = new THREE.Vector3();
      const lightPoint = new THREE.Vector3(), lightTint = new THREE.Color(0, 0, 0);
      let lightWeight = 0;
      eachEncounter(distance, (placement, cycle, encounter) => {
        contextStrength = Math.max(contextStrength, encounter.context);
        const weight = encounter.focus * (.4 + .6 * placement.concept.importance);
        lightPoint.x += placement.root.x * weight;
        lightPoint.y += placement.root.y * weight;
        lightPoint.z += (placement.root.z - cycle * PERIOD) * weight;
        lightTint.r += placement.tint.r * weight; lightTint.g += placement.tint.g * weight; lightTint.b += placement.tint.b * weight;
        lightWeight += weight;
        if (encounter.gaze > 0) {
          target.x += placement.anchor.x * encounter.gaze;
          target.y += placement.anchor.y * encounter.gaze;
          target.z += (placement.anchor.z - cycle * PERIOD) * encounter.gaze;
          totalGaze += encounter.gaze;
        }
      });
      if (totalGaze) target.divideScalar(totalGaze);
      if (lightWeight) { lightPoint.divideScalar(lightWeight); lightTint.multiplyScalar(1 / lightWeight); }
      return {
        contextStrength,
        attention: { point: target, strength: Math.min(1, totalGaze) },
        illumination: { point: lightPoint, tint: lightTint, strength: Math.min(1, lightWeight) },
      };
    },
  };
}
