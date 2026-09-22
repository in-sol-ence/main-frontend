import * as THREE from '../vendor/three.module.min.js';
import { pointAt, tangentAt } from './trajectory.js';
import { clamp } from './motion.js';

const up = new THREE.Vector3(0, 1, 0);
const p = new THREE.Vector3(), tangent = new THREE.Vector3(), right = new THREE.Vector3();
const futureTangent = new THREE.Vector3(), target = new THREE.Vector3(), desired = new THREE.Vector3();
const orientation = new THREE.Matrix4(), rotation = new THREE.Quaternion();
const bankRotation = new THREE.Quaternion(), forward = new THREE.Vector3(0, 0, 1);
const attentionRotation = new THREE.Quaternion();
export const MAX_ATTENTION_ANGLE = 2.4 * Math.PI / 180;

export class CameraRig {
  constructor(camera) { this.camera = camera; this.bank = 0; this.initialized = false; }
  reset() { this.initialized = false; this.bank = 0; }
  update(station, dt, attention = null) {
    pointAt(station, p); tangentAt(station, tangent);
    right.crossVectors(tangent, up).normalize();
    // Eye-level travel, slightly off the trajectory. Never orbit the scene.
    const drift = Math.sin(station / 37) * .35;
    desired.copy(p).addScaledVector(right, 1.65 + drift).addScaledVector(up, 2.35);
    pointAt(station + 30, target); target.y += 1.45;
    tangentAt(station + 11, futureTangent);
    const turn = tangent.x * futureTangent.z - tangent.z * futureTangent.x;
    const desiredBank = clamp(turn * .15, -.038, .038);
    const smooth = this.initialized ? 1 - Math.exp(-2.6 * dt) : 1;
    this.bank += (desiredBank - this.bank) * smooth;
    this.camera.position.lerp(desired, smooth);
    orientation.lookAt(this.camera.position, target, up);
    rotation.setFromRotationMatrix(orientation);
    if (attention?.strength > 0) {
      orientation.lookAt(this.camera.position, attention.point, up);
      attentionRotation.setFromRotationMatrix(orientation);
      const difference = rotation.angleTo(attentionRotation);
      const strength = clamp(attention.strength, 0, 1);
      // Change orientation only, never position, field of view, or camera zoom.
      // The original forward framing remains dominant even off-axis.
      if (difference > .00001) rotation.slerp(attentionRotation,
        Math.min(.16 * strength, MAX_ATTENTION_ANGLE * strength / difference));
    }
    bankRotation.setFromAxisAngle(forward, this.bank);
    rotation.multiply(bankRotation);
    this.camera.quaternion.slerp(rotation, this.initialized ? 1 - Math.exp(-2.2 * dt) : 1);
    this.initialized = true;
  }
}
