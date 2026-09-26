import * as THREE from '../vendor/three.module.min.js';
import { concepts as defaultConcepts } from './concepts.js';
import { hierarchyFor, tintFor } from './hierarchy.js';
import { landmarkAttention } from './choreography.js';
import { focusAppearance, pickConcept } from './focus.js';
import { annotations } from './annotations.js';
import { smootherstep } from './motion.js';
import { locateConcept, appearanceAt, resolveLabels, cycleForSlot, chooseLabelSide } from './landmark-layout.js';

// Only typography that competes with the in-space explanation recedes. The
// ribbon, world anchors, camera, and ordinary hover behavior are unchanged.
export function readingAttenuation(label, space) {
  if (!space) return 1;
  const dx = Math.max(0, space.x - label.x - label.width, label.x - space.x - space.width);
  const dy = Math.max(0, space.y - label.y - label.height, label.y - space.y - space.height);
  return 1 - .98 * space.presence * (1 - smootherstep(Math.min(1, Math.hypot(dx, dy) / 36)));
}

// 3D placements and DOM typography share the same projected world anchor.
// Hit testing shares these anchors; typography never becomes a floating panel.
export function createLandmarks({ scene, labelHost, arc, concepts = defaultConcepts, redTheme = false }) {
  const group = new THREE.Group();
  group.name = 'knowledge-landmarks';
  scene.add(group);
  const pointGeometry = new THREE.SphereGeometry(1, 12, 8);
  const lightGeometry = new THREE.PlaneGeometry(1, 1);
  const entries = [];
  let hitCandidates = [];
  let dirtyPlacement = false;
  const projected = new THREE.Vector3();
  const viewPoint = new THREE.Vector3();
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = '300 24px "Segoe UI", Arial, sans-serif';

  // Reuse three small sets of placements as the unchanged Stage 1 path repeats.
  // Relocation occurs well outside the visible atmosphere, never on camera.
  for (let slot = 0; slot < 3; slot++) {
    for (const concept of concepts) {
      const color = tintFor(concept, redTheme);
      const hierarchy = hierarchyFor(concept);
      const pointMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
      const point = new THREE.Mesh(pointGeometry, pointMaterial);
      point.scale.setScalar(hierarchy.markerRadius);
      const footMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
      const foot = new THREE.Mesh(pointGeometry, footMaterial);
      foot.scale.setScalar(hierarchy.markerRadius * .65);
      const stemGeometry = new THREE.BufferGeometry();
      stemGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(21), 3));
      const stemMaterial = new THREE.LineBasicMaterial({ color, transparent: true, depthWrite: false });
      const stem = new THREE.Line(stemGeometry, stemMaterial);
      group.add(point, foot, stem);

      // A faint footprint on the trajectory only for genuine milestones. This
      // is not a glowing node: it has no sphere, outline, ring, or bloom.
      let illumination = null;
      if (hierarchy.illumination || concept.baseImportance >= .78) {
        illumination = new THREE.Mesh(lightGeometry, new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, side: THREE.DoubleSide,
          uniforms: { tint: { value: color.clone().convertLinearToSRGB() }, presence: { value: 0 } },
          vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          fragmentShader: `varying vec2 vUv; uniform vec3 tint; uniform float presence;
            void main(){vec2 p=(vUv-.5)*2.;float falloff=exp(-dot(p,p)*4.)*(1.-smoothstep(.65,1.,length(p)));
            gl_FragColor=vec4(tint,falloff*presence);}`,
        }));
        illumination.rotation.x = -Math.PI / 2;
        illumination.scale.set(hierarchy.reach, hierarchy.reach * 3.4, 1);
        group.add(illumination);
      }

      const label = document.createElement('div');
      label.className = `concept-label${concept.role === 'milestone' || concept.role === 'goal' ? ' concept-label--major' : ''}`;
      label.dataset.concept = concept.id;
      label.dataset.domain = concept.domain;
      label.dataset.role = concept.role;
      label.dataset.learnerState = concept.learnerState || 'unknown';
      label.style.setProperty('--domain-color', `#${color.getHexString()}`);
      for (const line of concept.lines) {
        const span = document.createElement('span');
        span.textContent = line; label.append(span);
      }
      const annotation = document.createElement('div');
      annotation.className = 'concept-annotation';
      const category = document.createElement('span');
      category.className = 'concept-annotation__category';
      category.textContent = `${(concept.annotation || annotations[concept.id])?.category || ''}${concept.learnerState && concept.learnerState !== 'unknown' ? ` · ${concept.learnerState}` : ''}`;
      const detail = document.createElement('span');
      detail.className = 'concept-annotation__detail';
      detail.textContent = (concept.annotation || annotations[concept.id])?.detail || '';
      annotation.append(category, detail); label.append(annotation);
      labelHost.append(label);
      const baseWidth = Math.max(...concept.lines.map(line => measure.measureText(line).width));
      entries.push({ concept, hierarchy, slot, cycle: null, label, annotation, category, point, foot, stem, illumination, baseWidth, lineCount: concept.lines.length, compact: null, opacity: 0 });
    }
  }

  function place(entry, cycle, reset = true) {
    entry.cycle = cycle;
    entry.location = locateConcept(entry.concept, cycle, arc);
    const { root, foot, anchor } = entry.location;
    entry.point.position.copy(anchor);
    entry.foot.position.copy(root).y += .035;
    if (entry.illumination) { entry.illumination.position.copy(root); entry.illumination.position.y += .018; }
    const attribute = entry.stem.geometry.getAttribute('position');
    attribute.setXYZ(0, root.x, root.y + .025, root.z);
    // One existing stem, softly lifting out of the ribbon instead of an elbow.
    for (let i = 1; i <= 6; i++) {
      const t = i / 6, ease = smootherstep(t);
      attribute.setXYZ(i, root.x + (anchor.x - root.x) * ease, root.y + .025 + (anchor.y - root.y - .025) * t, root.z + (anchor.z - root.z) * ease);
    }
    attribute.needsUpdate = true;
    entry.stem.geometry.computeBoundingSphere();
    if (reset) { entry.opacity = 0; entry.side = entry.concept.side; entry.layoutWidth = null; }
  }

  return {
    relayout() {
      dirtyPlacement = true;
      for (const entry of entries) {
        entry.hierarchy = hierarchyFor(entry.concept);
          entry.label.dataset.learnerState = entry.concept.learnerState || 'unknown';
          entry.label.dataset.role = entry.concept.role;
          entry.label.className = `concept-label${entry.concept.role === 'milestone' || entry.concept.role === 'goal' ? ' concept-label--major' : ''}`;
        entry.category.textContent = `${entry.concept.annotation?.category || ''}${entry.concept.learnerState && entry.concept.learnerState !== 'unknown' ? ` · ${entry.concept.learnerState}` : ''}`;
      }
    },
    get candidates() { return hitCandidates; },
    pick(pointer, camera, width, height, retainedKey) {
      return pickConcept({ pointer, camera, width, height, candidates: hitCandidates, retainedKey });
    },
    update({ distance, camera, width, height, dt = 0, immediate = false, motionState = {}, focus = null, presence = 1, freezeLayout = false, formation = null, readingSpace = null }) {
      const cycle = Math.floor(distance / arc.length);
      const candidates = [];
      for (const entry of entries) {
        // Wrap only on a viewport-class change, never while approaching. Type
        // remains perspective-sized; a long name gets an extra line, not a clamp.
        const compact = width < 620;
        if (entry.compact !== compact) {
          entry.compact = compact;
          const lines = [];
          for (const original of entry.concept.lines) {
            let line = '';
            for (const word of original.split(' ')) {
              if (compact && line && measure.measureText(`${line} ${word}`).width > 155) { lines.push(line); line = word; }
              else line += `${line ? ' ' : ''}${word}`;
            }
            lines.push(line);
          }
          while (entry.label.children.length > 1) entry.label.children[0].remove();
          // Reinsert typography before the annotation without recreating it.
          entry.annotation.remove();
          for (const line of lines) { const span = document.createElement('span'); span.textContent = line; entry.label.append(span); }
          entry.label.append(entry.annotation);
          entry.lineCount = lines.length;
          entry.baseWidth = Math.max(...lines.map(line => measure.measureText(line).width));
        }
        const assignedCycle = cycleForSlot(entry.slot, cycle);
        if (entry.cycle !== assignedCycle) place(entry, assignedCycle);
        else if (dirtyPlacement) place(entry, assignedCycle, false);
        const emergence = formation ? formation.labels * smootherstep((formation.radius - Math.abs(-entry.location.root.z - formation.center)) / 24) : 1;
        const lift = formation ? smootherstep(Math.min(1, emergence / .75)) : 1;
        if (entry.entryLift !== lift) {
          entry.entryLift = lift;
          const { root, anchor } = entry.location;
          entry.point.position.lerpVectors(root, anchor, lift);
          const attribute = entry.stem.geometry.attributes.position;
          for (let i = 1; i <= 6; i++) {
            const t = i / 6, ease = smootherstep(t);
            attribute.setXYZ(i, root.x + (anchor.x - root.x) * ease * lift,
              root.y + .025 + (anchor.y - root.y - .025) * t * lift, root.z + (anchor.z - root.z) * ease * lift);
          }
          attribute.needsUpdate = true;
          entry.stem.geometry.computeBoundingSphere();
        }
        viewPoint.copy(entry.point.position).applyMatrix4(camera.matrixWorldInverse);
        const depth = -viewPoint.z;
        const appearance = appearanceAt(depth, entry.hierarchy.weight, height);
        projected.copy(entry.point.position).project(camera);
        const inFront = depth > camera.near && projected.z < 1;
        const attention = landmarkAttention(entry.concept, entry.location.distance - distance, motionState.contextStrength);
        const learner = focusAppearance(focus, entry.concept, assignedCycle);
        const baseOpacity = inFront ? Math.min(.96, appearance.opacity * entry.hierarchy.brightness * attention.opacity) : 0;

        const opacity = Math.min(.98, baseOpacity * learner.presence) * presence * emergence;
        entry.point.scale.setScalar(entry.hierarchy.markerRadius * attention.scale * learner.scale * (1 + 1.6 * learner.emphasis));
        entry.point.material.opacity = Math.min(1, opacity * (.86 + .3 * learner.emphasis));
        entry.foot.material.opacity = opacity * (.5 + .3 * learner.emphasis);
        entry.stem.material.opacity = opacity * (.22 + .13 * entry.concept.importance + .09 * learner.weight + .25 * learner.emphasis);
        entry.point.visible = entry.foot.visible = entry.stem.visible = opacity > .008;
        if (entry.illumination) {
          entry.illumination.visible = opacity > .01;
          entry.illumination.material.uniforms.presence.value = opacity * entry.hierarchy.illumination * attention.illumination * (1 + learner.weight * .45 + learner.emphasis * .8);
        }
        const labelWidth = entry.baseWidth * appearance.size / 24;
        const labelHeight = entry.lineCount * appearance.size * 1.13;
        const x = (projected.x * .5 + .5) * width;
        const y = (-projected.y * .5 + .5) * height;
        const gap = Math.max(7, appearance.size * .39);
        // Choose a side once per placement/viewport, never on render(0), hover,
        // collision, or frame timing. Visible labels stay on their world stem.
        if (!freezeLayout && entry.layoutWidth !== width) {
          entry.side = chooseLabelSide({ side: entry.concept.side, x, labelWidth, gap, width, opacity: 0, immediate: true });
          entry.layoutWidth = width;
        }
        const left = entry.side === 0 ? x - labelWidth / 2 : entry.side === 1 ? x + gap : x - gap - labelWidth;
        const top = y - labelHeight - Math.max(5, appearance.size * .2);
        const typeScale = Math.max(.001, appearance.size / 24);
        // Fixed text metrics; perspective is a transform, not a per-frame
        // font resize that repeatedly re-rasterizes and reflows glyphs.
        entry.label.style.transform = `translate3d(${left}px,${top}px,0) scale(${typeScale})`;
        entry.label.style.setProperty('--learner-focus', learner.weight.toFixed(4));
        const noted = learner.selected ? 0 : learner.weight;
        entry.annotation.style.opacity = noted.toFixed(4);
        entry.annotation.style.visibility = noted > .005 ? 'visible' : 'hidden';
        const annotationWidth = Math.min(236, width - 44);
        const annotationLeft = Math.max(16, Math.min(left, width - annotationWidth - 16));
        entry.annotation.style.width = `${annotationWidth}px`;
        entry.annotation.style.left = `${(annotationLeft - left) / typeScale}px`;
        entry.annotation.style.transform = `scale(${1 / typeScale})`;
        entry.annotation.style.paddingBottom = entry.concept.adaptive ? '24px' : '0';
        const annotationBounds = { x: annotationLeft, y: top - (entry.concept.adaptive ? 94 : 65), width: annotationWidth, height: entry.concept.adaptive ? 94 : 65 };
        candidates.push({ entry, depth, opacity, baseOpacity, learner, importance: entry.concept.importance,
          priority: entry.concept.importance, order: entry.location.distance,
          annotationBounds, x: left, y: top, width: labelWidth, height: labelHeight });
      }
      resolveLabels(candidates, width, height);
      hitCandidates = [];
      for (const item of candidates) {
        const { entry } = item;
        item.targetOpacity *= readingAttenuation(item, readingSpace);
        const smoothing = immediate ? 1 : 1 - Math.exp(-4 * dt);
        entry.opacity += (item.targetOpacity - entry.opacity) * smoothing;
        if (item.depth <= 0) entry.opacity = 0;
        entry.label.style.opacity = entry.opacity.toFixed(3);
        entry.label.style.visibility = entry.opacity > .005 ? 'visible' : 'hidden';
        hitCandidates.push({
          key: `${entry.cycle}:${entry.concept.id}`, concept: entry.concept, cycle: entry.cycle,
          anchor: entry.location.anchor, foot: entry.location.foot, depth: item.depth,
          presence: item.baseOpacity, labelOpacity: entry.opacity,
          label: { x: item.x, y: item.y, width: item.width, height: item.height },
          annotation: item.learner.weight > .15 ? item.annotationBounds : null,
          action: { x: item.annotationBounds.x, y: item.y - 36 },
        });
      }
      dirtyPlacement = false;
    },
    dispose() {
      scene.remove(group);
      for (const entry of entries) {
        entry.label.remove(); entry.point.material.dispose(); entry.foot.material.dispose();
        entry.stem.geometry.dispose(); entry.stem.material.dispose();
        entry.illumination?.material.dispose();
      }
      pointGeometry.dispose();
      lightGeometry.dispose();
    },
  };
}
