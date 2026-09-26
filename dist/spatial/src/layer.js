import * as THREE from '../vendor/three.module.min.js';
import { createWorld } from './world.js';
import { createArcTable, tangentAt } from './trajectory.js';
import { CameraRig } from './camera.js';
import { Journey, smootherstep } from './motion.js';
import { createReconfiguration } from './reconfiguration.js';
import { LearnerFocus } from './focus.js';
import { createLandmarks } from './landmarks.js';
import { createPathways } from './pathways.js';
import { createChoreography } from './choreography.js';
import { identityFrame, worldPose, localPose } from './exploration.js';

export function createLayer(definition, labelRoot, depth = 0, redTheme = false) {
  definition = structuredClone(definition);
  const arc = createArcTable(), world = createWorld(redTheme), focus = new LearnerFocus();
  const host = document.createElement('div'); host.className = 'knowledge-layer';
  host.dataset.layer = definition.id; labelRoot.append(host);
  const rigCamera = new THREE.PerspectiveCamera(53, 1, .08, 290);
  const viewCamera = rigCamera.clone(), rig = new CameraRig(rigCamera);
  const lookup = new Map(definition.children.map(concept => [concept.id, concept]));
  let choreography = createChoreography({ concepts: definition.children, arc });
  const landmarks = createLandmarks({ scene: world.scene, labelHost: host, arc, concepts: definition.children, redTheme });
  let pathways = createPathways({ scene: world.scene, arc, pathways: definition.pathways, conceptById: lookup, redTheme });
  let reconfiguration = null, relationReveal = 1;
  const tangent = new THREE.Vector3(), ahead = new THREE.Vector3();
  const journey = new Journey({ startDistance: definition.startAt !== undefined ? definition.startAt * arc.length : definition.startDistance ?? 13, speedAt(distance) {
    const station = arc.stationAtDistance(distance);
    tangentAt(station, tangent); tangentAt(station + 16, ahead);
    const arrival = definition.adaptive && definition.children.length ? smootherstep((definition.route.end * arc.length - 14 - distance) / 25) : 1;
    return Math.min(1 - Math.min(.42, tangent.distanceTo(ahead) * .65), choreography.speedScale(distance)) * focus.speedScale * arrival * (1 - layer.learningWeight) ** 2;
  } });
  const layer = {
    definition, arc, world, focus, rig, rigCamera, viewCamera, journey, landmarks, depth,
    learningWeight: 0,
    frame: identityFrame(), presence: depth ? 0 : 1, formation: null,
    retarget(next, options = {}) {
      reconfiguration = { plan: createReconfiguration(definition, next, { ...options, distance: journey.distance, arcLength: arc.length }), elapsed: 0 };
      focus.reset();
    },
    get reconfiguring() { return Boolean(reconfiguration); },
    get settling() { return relationReveal < .999; },
    adapt(dt, reduced = false) {
      if (!reconfiguration) { relationReveal += (1 - relationReveal) * (1 - Math.exp(-6 * dt)); return; }
      reconfiguration.elapsed += dt;
      const progress = Math.min(1, reconfiguration.elapsed / (reduced ? .7 : 2.4));
      relationReveal = 1 - smootherstep(progress / .25);
      const done = reconfiguration.plan.apply(progress);
      landmarks.relayout();
      choreography = createChoreography({ concepts: definition.children, arc });
      if (done) {
        reconfiguration = null;
        journey.startDistance = Math.max(0, ((definition.startAt || 0) + (definition.routeShift || 0)) * arc.length);
        pathways.dispose();
        lookup.clear(); definition.children.forEach(node => lookup.set(node.id, node));
        pathways = createPathways({ scene: world.scene, arc, pathways: definition.pathways, conceptById: lookup, redTheme });
      }
    },
    advance(dt, paused) {
      journey.update(dt, paused);
      rig.update(arc.stationAtDistance(journey.distance), paused && !journey.scroll.active ? 0 : dt,
        journey.scroll.active ? null : choreography.sample(journey.distance).attention);
      return worldPose(rigCamera, layer.frame);
    },
    resize(width, height) {
      for (const camera of [rigCamera, viewCamera]) {
        camera.aspect = width / height; camera.fov = camera.aspect < 1 ? 67 : 53; camera.updateProjectionMatrix();
      }
    },
    render(pose, dt, width, height, renderer, active = true, readingSpace = null) {
      localPose(pose, layer.frame, viewCamera);
      const station = arc.stationAtDistance(journey.distance);
      const motionState = choreography.sample(journey.distance);
      const exit = definition.adaptive && definition.children.length ? arc.stationAtDistance(definition.route.end * arc.length + 25) : 1000000;
      world.update(station, viewCamera, layer.presence, depth ? 0 : -1000000, layer.formation, motionState.illumination, exit);
      const state = { distance: journey.distance, camera: viewCamera, width, height, dt, motionState, focus, presence: layer.presence, freezeLayout: !active };
      landmarks.update({ ...state, presence: layer.presence * (1 - layer.learningWeight * .38), formation: layer.formation, readingSpace });
      pathways.update({ ...state, presence: layer.presence * (layer.formation?.relationships ?? 1) * relationReveal * (1 - layer.learningWeight * .6) });
      renderer.render(world.scene, viewCamera);
    },
    pick(pointer, width, height) { return landmarks.pick(pointer, viewCamera, width, height, focus.targetKey); },
    dispose() { landmarks.dispose(); pathways.dispose(); world.dispose(); host.remove(); },
  };
  layer.advance(0, true);
  return layer;
}
