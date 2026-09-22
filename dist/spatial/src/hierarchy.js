import * as THREE from '../vendor/three.module.min.js';
import { domains } from './concepts.js';

export function hierarchyFor(concept) {
  const importance = Math.max(0, Math.min(1, concept.importance));
  const significant = concept.role === 'milestone' || concept.role === 'goal';
  return {
    weight: .23 + 1.65 * importance ** 1.5,
    markerRadius: .025 + .073 * importance ** 2,
    brightness: .49 + .51 * importance ** .8,
    illumination: significant ? .029 + .03 * importance : 0,
    reach: concept.role === 'goal' ? 2.35 : 1.55,
  };
}

export function tintFor(concept) {
  const color = new THREE.Color(domains[concept.domain].color);
  if (concept.secondaryDomain) color.lerp(new THREE.Color(domains[concept.secondaryDomain].color), .26);
  return color;
}
