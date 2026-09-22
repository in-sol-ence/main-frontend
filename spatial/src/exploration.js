import * as THREE from '../vendor/three.module.min.js';
import { clamp, smootherstep } from './motion.js';
import { pointAt } from './trajectory.js';

export const identityFrame = () => ({ position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: 1 });
export function worldPose(camera, frame) {
  return {
    position: camera.position.clone().multiplyScalar(frame.scale ?? 1).applyQuaternion(frame.rotation).add(frame.position),
    quaternion: frame.rotation.clone().multiply(camera.quaternion),
  };
}
export function localPose(pose, frame, camera) {
  const inverse = frame.rotation.clone().invert();
  const scale = frame.scale ?? 1;
  camera.position.copy(pose.position).sub(frame.position).applyQuaternion(inverse).divideScalar(scale);
  camera.quaternion.copy(inverse).multiply(pose.quaternion);
  // Shared world-space clip planes keep depth consistent between scaled layers.
  if (camera.near !== .08 / scale || camera.far !== 290 / scale) {
    camera.near = .08 / scale; camera.far = 290 / scale; camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();
}

export function frameAtConcept(parentFrame, location, fromPose, childCamera) {
  const parentScale = parentFrame.scale ?? 1;
  const scale = parentScale * .82;
  const portal = location.root.clone().multiplyScalar(parentScale).applyQuaternion(parentFrame.rotation).add(parentFrame.position);
  const approach = portal.clone().sub(fromPose.position); approach.y = 0;
  if (approach.lengthSq() < .01) approach.set(0, 0, -1).applyQuaternion(fromPose.quaternion);
  approach.normalize();
  const localForward = new THREE.Vector3(0, 0, -1).applyQuaternion(childCamera.quaternion);
  const yaw = Math.atan2(approach.x, approach.z) - Math.atan2(localForward.x, localForward.z);
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const position = portal.clone().sub(pointAt(0, new THREE.Vector3()).multiplyScalar(scale).applyQuaternion(rotation));
  // The new ribbon begins at the parent's physical location, not at an
  // unrelated screen origin. Each interior occupies a subtly smaller region,
  // while its own camera/importance units remain consistent and readable.
  return { frame: { position, rotation, scale }, portal: portal.add(new THREE.Vector3(0, 2.35 * scale, 0)) };
}

function hermite(a, b, va, vb, t, duration) {
  const t2 = t * t, t3 = t2 * t;
  return a.clone().multiplyScalar(2 * t3 - 3 * t2 + 1)
    .addScaledVector(va, (t3 - 2 * t2 + t) * duration)
    .addScaledVector(b, -2 * t3 + 3 * t2)
    .addScaledVector(vb, (t3 - t2) * duration);
}

// Two joined cubic trajectories pass through the selected region. Position and
// velocity match at the join; the lens stays fixed, and rotation has eased ends.
export class CameraPassage {
  constructor({ from, to, portal, speed = 2, arrivalSpeed = 2.4, duration }) {
    this.from = from; this.to = to; this.portal = portal.clone();
    const first = from.position.distanceTo(portal), second = portal.distanceTo(to.position);
    this.duration = duration || clamp((first + second) / 9, 3.6, 10);
    this.split = clamp(first / Math.max(first + second, .01), .22, .78);
    this.startVelocity = new THREE.Vector3(0, 0, -1).applyQuaternion(from.quaternion).multiplyScalar(Math.min(speed, 5));
    this.endVelocity = new THREE.Vector3(0, 0, -1).applyQuaternion(to.quaternion).multiplyScalar(arrivalSpeed);
    this.midVelocity = to.position.clone().sub(from.position).normalize().multiplyScalar((first + second) / this.duration * .85);
  }
  sample(elapsed) {
    const u = clamp(elapsed / this.duration, 0, 1);
    const position = u < this.split
      ? hermite(this.from.position, this.portal, this.startVelocity, this.midVelocity, u / this.split, this.duration * this.split)
      : hermite(this.portal, this.to.position, this.midVelocity, this.endVelocity, (u - this.split) / (1 - this.split), this.duration * (1 - this.split));
    return { position, quaternion: this.from.quaternion.clone().slerp(this.to.quaternion, smootherstep(u)), progress: u };
  }
}

export function layerReveal(progress) {
  return { parent: 1 - .86 * smootherstep((progress - .06) / .70), child: smootherstep((progress - .26) / .72) };
}

// Persistent layer instances preserve parent distance, lens, focus, and rig
// state. Transitions are guarded so rapid clicks never create duplicate layers.
export class ExplorationHistory {
  constructor(root) { this.layers = [root]; this.busy = false; }
  get active() { return this.layers.at(-1); }
  canEnter(concept) { return !this.busy && Array.isArray(concept?.children) && (concept.children.length > 0 || Boolean(concept.explanation)); }
  push(layer) { this.layers.push(layer); }
  pop() { return this.layers.length > 1 ? this.layers.pop() : null; }
  get canReturn() { return !this.busy && this.layers.length > 1; }
}
