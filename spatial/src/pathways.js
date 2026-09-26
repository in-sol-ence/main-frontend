import * as THREE from '../vendor/three.module.min.js';
import { pathways as defaultPathways, conceptById as defaultLookup } from './concepts.js';
import { PERIOD } from './trajectory.js';
import { cycleForSlot } from './landmark-layout.js';
import { pathwayPoint, pathwayPresence } from './pathway-layout.js';
import { tintFor } from './hierarchy.js';
import { encounterAt } from './choreography.js';

export function pathwayGeometry(pathway, arc, lookup = defaultLookup) {
  const steps = 256;
  const positions = [], directions = [], sides = [], progress = [], indices = [];
  const before = new THREE.Vector3(), after = new THREE.Vector3(), point = new THREE.Vector3();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    pathwayPoint(pathway, arc, u, 0, point, lookup);
    pathwayPoint(pathway, arc, Math.max(0, u - .001), 0, before, lookup);
    pathwayPoint(pathway, arc, Math.min(1, u + .001), 0, after, lookup);
    after.sub(before).normalize();
    for (const side of [-1, 1]) {
      positions.push(point.x, point.y, point.z);
      directions.push(after.x, after.y, after.z);
      sides.push(side); progress.push(u);
    }
    if (i < steps) {
      const j = i * 2;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('direction', new THREE.Float32BufferAttribute(directions, 3));
  geometry.setAttribute('side', new THREE.Float32BufferAttribute(sides, 1));
  geometry.setAttribute('progress', new THREE.Float32BufferAttribute(progress, 1));
  geometry.setIndex(indices); geometry.computeBoundingSphere();
  return geometry;
}

export function createPathways({ scene, arc, pathways = defaultPathways, conceptById = defaultLookup, redTheme = false }) {
  const group = new THREE.Group(); group.name = 'prerequisite-pathways'; scene.add(group);
  const geometry = new Map(pathways.map(pathway => [pathway.id, pathwayGeometry(pathway, arc, conceptById)]));
  const entries = [];
  for (let slot = 0; slot < 3; slot++) {
    for (const pathway of pathways) {
      const material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
        uniforms: {
          resolution: { value: new THREE.Vector2() }, eye: { value: new THREE.Vector3() },
          strength: { value: 0 },
          sourceTint: { value: tintFor(conceptById.get(pathway.source), redTheme).convertLinearToSRGB() },
          targetTint: { value: tintFor(conceptById.get(pathway.target), redTheme).convertLinearToSRGB() },
        },
        vertexShader: `attribute vec3 direction; attribute float side; attribute float progress;
          uniform vec2 resolution; varying float vSide; varying float vProgress; varying vec3 vPosition;
          void main(){
            vec4 world=modelMatrix*vec4(position,1.); vPosition=world.xyz;
            vec4 view=viewMatrix*world;
            vec4 clip=projectionMatrix*view;
            vec4 forward=projectionMatrix*viewMatrix*modelMatrix*vec4(position+direction,1.);
            vec2 heading=(forward.xy/max(abs(forward.w),.01)-clip.xy/max(abs(clip.w),.01))*resolution;
            vec2 perpendicular=normalize(vec2(-heading.y,heading.x)+vec2(.00001));
            float pixels=clamp(.032*projectionMatrix[1][1]*resolution.y/(2.*max(-view.z,1.)),.48,1.35);
            clip.xy+=perpendicular*side*pixels/resolution*clip.w;
            gl_Position=clip; vSide=side; vProgress=progress;
          }`,
        fragmentShader: `precision highp float;
          uniform vec3 eye; uniform vec3 sourceTint; uniform vec3 targetTint; uniform float strength;
          varying float vSide; varying float vProgress; varying vec3 vPosition;
          void main(){
            float edge=1.-smoothstep(.30,1.,abs(vSide));
            float haze=exp(-pow(length(eye-vPosition)/94.,1.55));
            float taper=.58+.42*sin(vProgress*3.14159265);
            vec3 tint=mix(sourceTint,targetTint,smoothstep(.28,.95,vProgress));
            gl_FragColor=vec4(tint,edge*haze*taper*strength*.36);
          }`,
      });
      const mesh = new THREE.Mesh(geometry.get(pathway.id), material);
      mesh.name = pathway.id; group.add(mesh);
      entries.push({ slot, pathway, mesh, presence: 0, displayed: 0 });
    }
  }
  return {
    update({ distance, camera, width, height, dt = 0, motionState = {}, focus = null, presence: layerPresence = 1 }) {
      const cycle = Math.floor(distance / arc.length);
      let totalPresence = 0;
      for (const entry of entries) {
        const { slot, pathway, mesh } = entry;
        const assignedCycle = cycleForSlot(slot, cycle);
        mesh.position.z = -assignedCycle * PERIOD;
        const destination = conceptById.get(pathway.target);
        const encounter = encounterAt(destination, (assignedCycle + destination.at) * arc.length - distance);
        const context = 1 - .08 * (motionState.contextStrength || 0) * (1 - encounter.focus);
        const relevance = focus?.pathway(pathway.source, pathway.target, assignedCycle) || 0;
        const learner = 1 + relevance * .48 - Math.max(0, (focus?.strength || 0) - relevance) * .38;
        const presence = pathwayPresence(pathway, arc, distance, assignedCycle, conceptById) * (1 + .22 * encounter.focus) * context * learner * layerPresence;
        entry.presence = presence; totalPresence += presence;
        mesh.material.uniforms.resolution.value.set(width, height);
        mesh.material.uniforms.eye.value.copy(camera.position);
      }
      // A continuous visual budget, rather than a hard top-N switch. Dense
      // convergences stay subordinate to the ribbon, with no popping threads.
      const budget = Math.min(1, 2.3 / Math.max(totalPresence, .001));
      for (const entry of entries) {
        entry.displayed += (entry.presence * budget - entry.displayed) * (dt ? 1 - Math.exp(-9 * dt) : 1);
        entry.mesh.visible = entry.displayed > .005;
        entry.mesh.material.uniforms.strength.value = entry.displayed;
      }
    },
    dispose() {
      scene.remove(group);
      for (const entry of entries) entry.mesh.material.dispose();
      for (const item of geometry.values()) item.dispose();
    },
  };
}
