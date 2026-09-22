import * as THREE from '../vendor/three.module.min.js';
import { conceptById } from './concepts.js';
import { pointAt, tangentAt } from './trajectory.js';
import { smootherstep } from './motion.js';

const up = new THREE.Vector3(0, 1, 0);
const tangent = new THREE.Vector3(), right = new THREE.Vector3();

export function pathwaySpan(pathway, arc, cycle = 0, lookup = conceptById) {
  return {
    start: (cycle + lookup.get(pathway.source).at) * arc.length,
    end: (cycle + lookup.get(pathway.target).at) * arc.length,
  };
}

export function pathwayPoint(pathway, arc, u, cycle = 0, out = new THREE.Vector3(), lookup = conceptById) {
  const { start, end } = pathwaySpan(pathway, arc, cycle, lookup);
  // A zero-slope envelope means both ends join the primary path tangentially.
  // The center bows sideways AND vertically; no coplanar graph connectors.
  const envelope = Math.sin(Math.PI * u) ** 2;
  const travel = u + pathway.drift * Math.sin(2 * Math.PI * u) * envelope;
  const station = arc.stationAtDistance(start + (end - start) * travel);
  pointAt(station, out); tangentAt(station, tangent);
  right.crossVectors(tangent, up).normalize();
  out.addScaledVector(right, pathway.bend * envelope * (.86 + .14 * Math.cos(Math.PI * u)));
  out.y += pathway.lift * envelope;
  return out;
}

export function pathwayPresence(pathway, arc, distance, cycle = 0, lookup = conceptById) {
  const span = pathwaySpan(pathway, arc, cycle, lookup);
  // Threads emerge as their source comes into view, then recede just after the
  // convergence. Geometry stays put; nothing draws itself or flashes on arrival.
  const enter = smootherstep((distance - span.start + 70) / 55);
  const exit = 1 - smootherstep((distance - span.end + 3) / 25);
  const focus = 1 - smootherstep((span.end - distance - 50) / 100);
  return enter * exit * focus * pathway.strength;
}
