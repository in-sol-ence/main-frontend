import * as THREE from '../vendor/three.module.min.js';
import { clamp } from './motion.js';
import { branchPoint, resourcePlacements, revealAt } from './resource-placement.js';
import { createResourceContent } from './resource-content.js';

// Resource branches grow outward from a knowledge concept's own landmark and
// end in one card per resource: a video segment, a lecture, an explanation or
// a question. A port of the resource-branch prototype (spatial-expansion,
// src/resource-branches/ResourceBranches.jsx) to this study's architecture:
// branches are lines in the layer's own scene, like its stems, and cards are
// projected DOM like its concept labels, so no React or second renderer is
// involved and the layer's camera, path and typography are untouched.
//
// Resources are data attached to a concept, not child concepts: they never
// enter the prerequisite graph and never become a layer of their own.

const LABEL_WIDTH = 150;
const SEGMENTS = 32;
// The prototype was composed for a camera 6.8 units from the concept. Scaling
// the fan by the concept's real depth keeps the same composition on screen.
const PROTOTYPE_DISTANCE = 6.8;

// The prototype's viewport rule: a portrait screen cannot fit five cards
// across, so the fan climbs by radius instead of spreading by angle.
export function fanShapeFor(width, height) {
  return width / height < 1 ? { arc: .2, vertical: 1, cardScale: 1.75, ladder: true } : { cardScale: 1.4 };
}

export function createResourceBranches({ host }) {
  let fan = null;
  const world = new THREE.Vector3(), view = new THREE.Vector3(), point = [0, 0, 0];

  function _dispose(target) {
    target.layer.learningWeight = 0;
    target.layer.world.scene.remove(target.group);
    for (const item of target.items) { item.line.geometry.dispose(); item.line.material.dispose(); item.card.remove(); }
  }

  function _card(placement, target) {
    const { resource } = placement;
    const card = document.createElement('div');
    card.className = 'resource-card'; card.dataset.type = resource.type;
    card.style.setProperty('--resource-tint', target.tint);
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'resource-card-toggle';
    toggle.dataset.resourceId = resource.id; toggle.setAttribute('aria-expanded', 'false');
    const type = document.createElement('span'); type.className = 'resource-card-type'; type.textContent = resource.type;
    const title = document.createElement('span'); title.textContent = resource.title;
    toggle.append(type, title);
    toggle.addEventListener('click', () => api.select(resource.id));
    card.append(toggle);
    host.append(card);
    return { card, toggle, content: null };
  }

  const api = {
    // One set is alive at a time; opening another concept replaces it, so
    // rapid activation can never leave a duplicate branch, card or timer.
    open({ layer, key, concept, anchor, depth, resources, tint, width, height, onStatus = () => {} }) {
      if (fan) _dispose(fan);
      const group = new THREE.Group();
      group.position.copy(anchor);
      group.scale.setScalar(Math.max(1, depth) / PROTOTYPE_DISTANCE);
      layer.world.scene.add(group);
      const placements = resourcePlacements(concept.id, resources, { side: concept.side === -1 ? -1 : 1, ...fanShapeFor(width, height) });
      fan = { layer, key, concept, group, tint, onStatus, elapsed: 0, closing: false, expandedId: null, hold: 0, items: [] };
      for (const placement of placements) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((SEGMENTS + 1) * 3), 3));
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: tint, transparent: true, opacity: 0, depthWrite: false }));
        line.frustumCulled = false;
        group.add(line);
        fan.items.push({ placement, line, grown: -1, ..._card(placement, fan) });
      }
      onStatus(`${resources.length} resources for ${concept.title}: ${resources.map(item => `${item.type}, ${item.title}`).join('. ')}.`);
    },
    close() {
      if (!fan || fan.closing) return;
      fan.closing = true; fan.elapsed = 0; fan.expandedId = null;
      fan.onStatus(`Collapsed the resources for ${fan.concept.title}.`);
    },
    // Expanding a card opens its lecture segment in place; again collapses it.
    select(id) {
      if (!fan || fan.closing) return;
      fan.expandedId = fan.expandedId === id ? null : id;
      for (const item of fan.items) {
        const expanded = item.placement.resource.id === fan.expandedId;
        item.toggle.setAttribute('aria-expanded', String(expanded));
        if (expanded && !item.content) { item.content = createResourceContent(item.placement.resource, () => api.select(id)); item.card.append(item.content); }
        if (!expanded && item.content) { item.content.remove(); item.content = null; }
      }
      const resource = fan.items.find(item => item.placement.resource.id === id)?.placement.resource;
      if (resource) fan.onStatus(fan.expandedId ? `Expanded ${resource.type}: ${resource.title}. ${resource.body || resource.summary}` : `Collapsed ${resource.title}.`);
    },
    get key() { return fan && !fan.closing ? fan.key : null; },
    get layer() { return fan?.layer || null; },
    // How far travel is stilled for reading, through the layer's existing weight.
    get hold() { return fan?.hold || 0; },
    update({ dt, width, height, reduced = false }) {
      if (!fan) return;
      const { layer } = fan;
      const camera = layer.viewCamera;
      fan.elapsed += Math.max(0, dt);
      fan.hold += ((fan.closing ? 0 : .9) - fan.hold) * (reduced ? 1 : 1 - Math.exp(-5 * dt));
      // The fan faces the reader, as the prototype's cards did.
      fan.group.quaternion.copy(camera.quaternion);
      fan.group.updateMatrixWorld(true);
      const presence = layer.presence;
      let finished = true;
      for (const item of fan.items) {
        const { placement, line, card } = item;
        const state = revealAt(fan.elapsed, placement, { reduced, closing: fan.closing });
        if (!state.done) finished = false;
        const grow = clamp(state.grow, 0, 1);
        // Reveal a prefix of the same S-shaped curve; rewrite it only while it grows.
        if (item.grown !== grow) {
          const positions = line.geometry.attributes.position;
          for (let index = 0; index <= SEGMENTS; index++) positions.setXYZ(index, ...branchPoint(placement, grow * index / SEGMENTS, point));
          positions.needsUpdate = true; item.grown = grow;
        }
        line.material.opacity = (fan.closing ? state.reveal : grow) * presence * .34;
        line.visible = line.material.opacity > .004;

        // The card rides the branch tip, projected like every concept label.
        world.fromArray(reduced ? placement.card : branchPoint(placement, grow, point)).applyMatrix4(fan.group.matrixWorld);
        view.copy(world).applyMatrix4(camera.matrixWorldInverse);
        const inFront = -view.z > camera.near;
        world.project(camera);
        const x = (world.x + 1) * width / 2, y = (1 - world.y) * height / 2;
        const expanded = fan.expandedId === placement.resource.id;
        const available = Math.max(80, 2 * Math.min(x - 16, width - x - 16) - 20);
        card.style.width = `${Math.min(expanded ? 300 : width < 600 ? 120 : LABEL_WIDTH, available)}px`;
        card.style.maxHeight = expanded ? `${Math.max(90, Math.min(360, 2 * Math.min(y - 16, height - y - 16) - 20))}px` : '';
        card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        const shown = inFront ? clamp(state.reveal, 0, 1) * presence : 0;
        card.style.opacity = String(shown * (expanded || !fan.expandedId ? 1 : .5));
        card.style.zIndex = expanded ? '20' : '2';
        card.dataset.expanded = String(expanded);
        const live = !fan.closing && shown > .05;
        card.inert = !live; card.style.pointerEvents = live ? 'auto' : 'none';
        card.style.visibility = shown > .004 ? 'visible' : 'hidden';
      }
      if (fan.closing && finished) { _dispose(fan); fan = null; }
    },
    // Leaving the layer, or a new journey, removes the set at once.
    dispose() { if (fan) { _dispose(fan); fan = null; } },
  };
  return api;
}
