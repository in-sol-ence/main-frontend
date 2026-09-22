import * as THREE from '../vendor/three.module.min.js';
import { explanationFor } from './learning-content.js';
import { createLearningVisual } from './learning-visual.js';
import { domains } from './concepts.js';

export class LearningAttention {
  constructor() { this.target = 0; this.presence = 0; this.time = 0; this.understood = false; }
  open() { this.target = 1; this.time = 0; this.understood = false; }
  close(understood = false) { this.target = 0; this.understood = understood; }
  update(dt, reduced = false) {
    this.time += dt;
    this.presence += (this.target - this.presence) * (1 - Math.exp(-(reduced ? 12 : 3.5) * dt));
    if (Math.abs(this.target - this.presence) < .001) this.presence = this.target;
    return this.presence;
  }
  get speedScale() { return (1 - this.presence) ** 2; }
  get visible() { return this.target > 0 || this.presence > .001; }
}

// Screen-crisp type is projected from local 3D anchors. No modal, backdrop,
// replacement scene, automatic mastery, or forced next-lesson sequence.
export function createLearning({ section, reopen, labelsHost, onContinue, onUnderstand, onResponse = () => {}, onExplore = onContinue }) {
  const attention = new LearningAttention();
  const title = section.querySelector('h2'), explanation = section.querySelector('.understanding-explanation');
  const intuition = section.querySelector('.understanding-intuition'), example = section.querySelector('.understanding-example');
  const understood = section.querySelector('#understand-concept'), onward = section.querySelector('#continue-exploring');
  const choices = section.querySelector('#knowledge-check-choices'), reason = section.querySelector('.learning-reason'), freely = section.querySelector('#explore-freely');
  let learningAction = null, checking = false, actionPresentation = null;
  let layer = null, visual = null, content = null, nodes = [], width = 0, height = 0, readingSpace = null;
  const textAnchor = new THREE.Vector3(), visualAnchor = new THREE.Vector3(), projected = new THREE.Vector3();
  function place(w, h) {
    width = w; height = h;
    const camera = layer.viewCamera, depth = 24, halfHeight = Math.tan(camera.fov * Math.PI / 360) * depth;
    const portrait = w < 700, halfWidth = halfHeight * camera.aspect;
    const local = (x, y) => new THREE.Vector3(x * halfWidth, y * halfHeight, -depth).applyQuaternion(camera.quaternion).add(camera.position);
    textAnchor.copy(local(portrait ? -.86 : -.85, portrait ? .57 : .35));
    visualAnchor.copy(local(portrait ? 0 : .43, portrait ? -.31 : -.05));
    if (visual) {
      visual.group.position.copy(visualAnchor); visual.group.quaternion.copy(camera.quaternion);
      visual.group.scale.setScalar(portrait ? Math.min(1.5, halfWidth * .21) : Math.min(2.25, halfWidth * .13));
    }
  }
  function clear() {
    if (layer) layer.learningWeight = 0;
    visual?.dispose(); visual = null; nodes.forEach(node => node.remove()); nodes = [];
    layer = null; readingSpace = null; learningAction = null; checking = false; actionPresentation = null;
    section.hidden = true; section.inert = true; attention.presence = 0; attention.target = 0;
  }
  onward.addEventListener('click', onContinue);
  understood.addEventListener('click', onUnderstand);
  freely.addEventListener('click', onExplore);
  return {
    attention,
    get layer() { return layer; },
    get open() { return attention.target === 1; },
    get visible() { return attention.visible; },
    get readingSpace() { return readingSpace; },
    get action() { return learningAction; },
    show(nextLayer, request, w, h) {
      const selected = explanationFor(nextLayer.definition, request);
      if (!selected) return false;
      clear(); layer = nextLayer; content = selected;
      title.textContent = content.title; explanation.textContent = content.explanation;
      intuition.textContent = content.intuition; intuition.hidden = false; example.textContent = content.example; example.hidden = !content.example;
      choices.replaceChildren?.(); choices.hidden = true; reason.hidden = true; freely.hidden = true; understood.hidden = false; onward.hidden = false;
      section.dataset.action = ''; section.dataset.question = '';
      section.dataset.concept = layer.definition.id; section.dataset.variant = content.variant;
      section.dataset.visual = content.visualType || 'none';
      onward.textContent = layer.definition.children.length ? 'Continue exploring ↗' : 'Return to journey ↗';
      understood.textContent = 'I understand this'; understood.disabled = false;
      onward.disabled = false;
      if (content.visualType) {
        visual = createLearningVisual(content.visualType, content.visualData, domains[layer.definition.domain].color);
        layer.world.scene.add(visual.group);
        nodes = visual.labels.map(label => { const element = document.createElement('span'); element.className = 'understanding-visual-label'; element.textContent = label.text; labelsHost.append(element); return element; });
      }
      attention.open(); section.hidden = false; section.inert = false; section.style.opacity = '0';
      reopen.hidden = true; place(w, h); return true;
    },
    offerCheck(value) { if (value) onward.textContent = 'Try a quick check ↗'; },
    presentAction(action, { question, feedback = '', targetTitle = '' } = {}) {
      if (!layer) return;
      actionPresentation = { question, feedback, targetTitle };
      learningAction = action; checking = ['QUESTION', 'PRACTICE'].includes(action.type);
      section.dataset.action = action.type; section.dataset.question = question?.id || '';
      reason.textContent = action.reason; reason.hidden = !action.reason;
      choices.replaceChildren(); choices.hidden = !checking;
      understood.hidden = true; freely.hidden = false; freely.disabled = false;
      onward.hidden = checking; onward.disabled = false;
      intuition.hidden = checking; example.hidden = checking || action.type === 'EXAMPLE';
      if (checking) {
        explanation.textContent = question.prompt;
        question.choices.forEach((choice, index) => {
          const button = document.createElement('button'); button.type = 'button'; button.className = 'knowledge-choice';
          const letter = document.createElement('span'); letter.textContent = String.fromCharCode(65 + index); letter.setAttribute('aria-hidden', 'true');
          button.append(letter, document.createTextNode(choice.text));
          button.addEventListener('click', () => {
            if (learningAction?.id !== action.id || button.disabled) return;
            for (const item of choices.children) item.disabled = true;
            onResponse(action.id, choice.id);
          });
          choices.append(button);
        });
      } else {
        explanation.textContent = action.type === 'EXAMPLE' ? content.example || content.explanation : content.explanation;
        intuition.textContent = feedback || content.intuition;
        example.textContent = content.example;
        if (['PREREQUISITE', 'ADVANCE'].includes(action.type)) {
          explanation.textContent = action.reason; reason.hidden = true; example.hidden = true;
          onward.textContent = `${action.reconnect ? 'Reconnect with' : action.type === 'PREREQUISITE' ? 'Revisit' : 'Explore'} ${targetTitle} ↗`;
        } else onward.textContent = action.exhausted ? 'Continue exploring ↗' : 'Try it now ↗';
      }
      // Keep the same spatial anchor and attention envelope across actions.
      // Changing text must not reset or snap the camera.
      place(width, height);
    },
    refreshContext(request) {
      if (!layer || !learningAction) return;
      content = explanationFor(layer.definition, request);
      section.dataset.variant = content.variant;
      this.presentAction(learningAction, actionPresentation);
    },
    close(complete = false) { attention.close(complete); section.inert = true; },
    busy(value) { understood.disabled = value; onward.disabled = value; freely.disabled = value; for (const button of choices.children) button.disabled = value; },
    clear,
    update(dt, activeLayer, w, h, reduced = false, available = true) {
      if (!layer) return;
      const amount = attention.update(dt, reduced);
      layer.learningWeight = amount;
      if (w !== width || h !== height) place(w, h);
      const shown = amount * layer.presence;
      visual?.update(attention.time, shown * (checking ? .12 : 1), reduced);
      if (visual) {
        // Acknowledgement lets this temporary idea recede into traveled space.
        const retreat = attention.understood ? (1 - amount) * 9 : 0;
        visual.group.position.copy(visualAnchor).add(new THREE.Vector3(0, 0, retreat).applyQuaternion(visual.group.quaternion));
        visual.group.updateMatrixWorld(true);
        visual.labels.forEach((label, index) => {
          projected.copy(label.position).applyMatrix4(visual.group.matrixWorld).project(layer.viewCamera);
          const x = (projected.x + 1) * w / 2, y = (1 - projected.y) * h / 2;
          const within = projected.z > -1 && projected.z < 1 && x > 16 && x < w - 16 && y > 80 && y < h - 55;
          nodes[index].textContent = label.text;
          nodes[index].style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          nodes[index].style.opacity = String(within && !checking ? shown * (label.opacity ?? 1) : 0);
        });
      }
      projected.copy(textAnchor).project(layer.viewCamera);
      const textWidth = w < 700 ? w - 44 : Math.min(w * .31, 365);
      const x = Math.max(22, Math.min(w - textWidth - 22, (projected.x + 1) * w / 2));
      const y = Math.max(108, Math.min(h - section.offsetHeight - 100, (1 - projected.y) * h / 2));
      section.style.width = `${textWidth}px`; section.style.left = `${x}px`; section.style.top = `${y}px`;
      section.style.opacity = String(projected.z < 1 && projected.z > -1 ? shown : 0);
      readingSpace = { x, y, width: textWidth, height: section.offsetHeight, presence: shown };
      section.inert = !available || !attention.target || activeLayer !== layer;
      if (!attention.visible) clear();
    },
  };
}
