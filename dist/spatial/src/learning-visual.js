import * as THREE from '../vendor/three.module.min.js';
import { smootherstep } from './motion.js';

const v = ([x, y, z = 0]) => new THREE.Vector3(x, y, z);
export const qTarget = data => data.reward + data.discount * data.next;
export const qUpdated = data => data.old + data.rate * (qTarget(data) - data.old);
export const descentPoint = (data, step) => data.initial * (1 - 2 * data.rate) ** step;
export const transformVector = (matrix, point) => matrix.map(row => row[0] * point[0] + row[1] * point[1]);
export const discountedReturn = data => data.rewards.reduce((sum, reward, i) => sum + reward * data.discount ** i, 0);

// These are small explanatory figures in the active layer's coordinate space,
// not a second scene, screen-space canvas, or collection of decorative objects.
export function createLearningVisual(type, data, color = '#bdc7b5') {
  const group = new THREE.Group(); group.name = 'concept-understanding';
  const labels = [], materials = [], geometries = [], animations = [];
  function material(base = .7, tint = color) {
    const result = new THREE.LineBasicMaterial({ color: tint, transparent: true, opacity: base, depthWrite: false });
    materials.push({ material: result, base }); return result;
  }
  function line(points, opacity = .6, tint) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(v)); geometries.push(geometry);
    const object = new THREE.Line(geometry, material(opacity, tint)); group.add(object); return object;
  }
  function dot(point, radius = .055, opacity = .9) {
    const geometry = new THREE.SphereGeometry(radius, 12, 8); geometries.push(geometry);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }); materials.push({ material: mat, base: opacity });
    const object = new THREE.Mesh(geometry, mat); object.position.copy(v(point)); group.add(object); return object;
  }
  function label(text, point) { const item = { text, position: v(point) }; labels.push(item); return item; }
  function setPoints(object, points) {
    points.forEach((point, index) => object.geometry.attributes.position.setXYZ(index, point[0], point[1], point[2] || 0));
    object.geometry.attributes.position.needsUpdate = true; object.geometry.computeBoundingSphere();
  }
  function arrow(a, b, opacity = .8) {
    const shaft = line([a, b], opacity), head = line([b, b, b], opacity);
    function setEnd(end) {
      const from = v(a), to = v(end), dir = to.clone().sub(from).normalize(), side = new THREE.Vector3(-dir.y, dir.x, 0);
      const size = Math.min(.18, from.distanceTo(to) * .3);
      setPoints(shaft, [a, end]);
      setPoints(head, [to.clone().addScaledVector(dir, -size).addScaledVector(side, size / 2).toArray(), end, to.clone().addScaledVector(dir, -size).addScaledVector(side, -size / 2).toArray()]);
    }
    setEnd(b); return { shaft, head, setEnd };
  }
  function circle(radius, center = [0, 0, 0], opacity = .3) {
    return line(Array.from({ length: 97 }, (_, i) => [center[0] + Math.cos(i / 96 * Math.PI * 2) * radius, center[1] + Math.sin(i / 96 * Math.PI * 2) * radius, center[2]]), opacity);
  }
  function axes(x = 3.3, y = 2.6) { line([[-.2, 0], [x, 0]], .23); line([[0, -.2], [0, y]], .23); }

  if (type === 'vector') {
    const [x, y] = data.components;
    const center = [-x / 2, -y / 2];
    const shifted = ([a, b]) => [a + center[0], b + center[1]];
    line([shifted([-.5, 0]), shifted([x + .65, 0])], .2);
    line([shifted([0, -.5]), shifted([0, y + .7])], .2);
    line([shifted([0, 0]), shifted([x, 0]), shifted([x, y])], .32);
    arrow(shifted([0, 0]), shifted([x, y]));
    dot(shifted([0, 0]), .035);
    label(`${Math.abs(x)} ${x < 0 ? 'left' : 'right'}`, shifted([x / 2, -.32])); label(`${Math.abs(y)} ${y < 0 ? 'down' : 'up'}`, shifted([x + .45, y / 2]));
    label(`length ${Math.hypot(x, y).toFixed(2)}`, shifted([x / 2 - .35, y / 2 + .45]));
    label('direction', shifted([x + .1, y + .4]));
    const cursor = dot(shifted([0, 0]), .075);
    animations.push(p => {
      const horizontal = data.mode === 'components' ? Math.min(1, p * 2) : p;
      const vertical = data.mode === 'components' ? Math.max(0, p * 2 - 1) : p;
      cursor.position.set(center[0] + x * horizontal, center[1] + y * vertical, .02);
    });
  } else if (type === 'vector-sum') {
    const a = data.first, b = data.second, total = [a[0] + b[0], a[1] + b[1]];
    const origin = [-total[0] / 2, -total[1] / 2];
    const at = point => [point[0] + origin[0], point[1] + origin[1]];
    arrow(at([0, 0]), at(a), .55); arrow(at(a), at(total), .55);
    const result = arrow(at([0, 0]), at([0, 0]), .85);
    result.shaft.name = 'vector-sum-result';
    animations.push(p => result.setEnd(at(total.map(n => n * p))));
    label(`first [${a.join(', ')}]`, at([a[0] / 2, a[1] / 2 - .4]));
    label(`then [${b.join(', ')}]`, at([a[0] + b[0] / 2 + .7, a[1] + b[1] / 2]));
    label(`sum [${total.join(', ')}]`, at([total[0] / 2 - .5, total[1] / 2 + .65]));
  } else if (type === 'projection') {
    const [x, y] = data.components, origin = [-x / 2, -y / 2];
    const at = ([a, b]) => [a + origin[0], b + origin[1]];
    line([at([-.5, 0]), at([x + 1, 0])], .2); arrow(at([0, 0]), at([x, y]), .45);
    line([at([x, y]), at([x, 0])], .25); arrow(at([0, 0]), at([x, 0]), .85);
    const cursor = dot(at([x, y]), .07); cursor.name = 'projection-point';
    animations.push(p => cursor.position.copy(v(at([x, y * (1 - p)]))));
    label(`v = [${x}, ${y}]`, at([x, y + .4])); label('onto unit x-direction', at([x / 2, -.7]));
    label(`projection = ${x}`, at([x + .45, .4]));
  } else if (type === 'return') {
    const accumulated = label('return = 0.00', [0, 2]);
    data.rewards.forEach((reward, i) => {
      const x = (i - 1) * 2, value = reward * data.discount ** i;
      line([[x, -1.3], [x, -1.3 + reward * .65]], .16);
      const weighted = line([[x, -1.3], [x, -1.3]], .75); weighted.name = `discounted-reward-${i}`;
      const tip = dot([x, -1.3], .065);
      animations.push(p => {
        const amount = smootherstep(Math.max(0, Math.min(1, p * 3 - i)));
        const y = -1.3 + value * .65 * amount;
        setPoints(weighted, [[x, -1.3], [x, y]]); tip.position.y = y;
      });
      label(i === 0 ? 'now' : `+${i} step${i > 1 ? 's' : ''}`, [x, -1.8]);
      label(`${reward} × ${data.discount}⁽${i}⁾ = ${Number(value.toFixed(2))}`, [x, -1 + reward * .65]);
    });
    animations.push(p => {
      const total = data.rewards.reduce((sum, r, i) => sum + r * data.discount ** i * smootherstep(Math.max(0, Math.min(1, p * 3 - i))), 0);
      accumulated.text = `sample return = ${total.toFixed(2)}`;
    });
  } else if (type === 'matrix') {
    for (let i = -2; i <= 2; i++) {
      const endpoints = [[[i, -2], [i, 2]], [[-2, i], [2, i]]];
      for (const points of endpoints) {
        line(points, .12, '#9fa9ae'); const moving = line(points, .4);
        animations.push(p => {
          const array = moving.geometry.attributes.position;
          points.forEach((point, index) => { const target = transformVector(data.matrix, point); array.setXYZ(index, point[0] + (target[0] - point[0]) * p, point[1] + (target[1] - point[1]) * p, 0); });
          array.needsUpdate = true; moving.geometry.computeBoundingSphere();
        });
      }
    }
    const target = transformVector(data.matrix, data.vector);
    const transformed = arrow([0, 0], data.vector), tip = dot(data.vector, .065);
    transformed.shaft.name = 'transformed-vector';
    label('original grid', [-1.5, -2.35]); label('transformed', [1.7, -1.72]);
    const coordinates = label('', [target[0], target[1] + .35]);
    animations.push(p => {
      const point = data.vector.map((n, i) => n + (target[i] - n) * p);
      transformed.setEnd(point); tip.position.set(...point, .02);
      coordinates.position.set(point[0], point[1] + .35, 0);
      coordinates.text = `[${point.map(n => Number(n.toFixed(2))).join(', ')}]`;
    });
  } else if (type === 'distribution') {
    line([[-2.8, -1.4], [2.8, -1.4]], .22);
    const amplitude = Math.min(5, 2.8 / Math.max(...data.probabilities));
    const spacing = Math.min(1.75, 4.4 / (data.probabilities.length - 1));
    data.probabilities.forEach((probability, index) => {
      const x = (index - (data.probabilities.length - 1) / 2) * spacing;
      const stem = line([[x, -1.4], [x, -1.4]], .65); stem.name = `probability-${index}`;
      const tip = dot([x, -1.4], .06);
      const percentage = label(`${Number((probability * 100).toFixed(1))}%`, [x, -1.05 + probability * amplitude]);
      animations.push(p => {
        const height = probability * amplitude * p;
        setPoints(stem, [[x, -1.4], [x, -1.4 + height]]); tip.position.y = -1.4 + height;
        // Final probabilities stay explicit; growth reveals the distribution,
        // it does not pretend intermediate stem heights are normalized masses.
        percentage.opacity = .35 + .65 * p;
      });
      label(data.outcomes[index], [x, -1.8]);
    });
    label(data.caption || 'probability mass · total = 1', [0, 2.4]);
  } else if (type === 'descent') {
    const curve = x => [x, .34 * x * x - 1.5, 0];
    line(Array.from({ length: 101 }, (_, i) => curve(-3 + i * .06)), .6);
    for (let index = 0; index <= 7; index++) dot(curve(descentPoint(data, index)), .027, .4);
    const cursor = dot(curve(data.initial), .09);
    animations.push(p => {
      const step = p * 7, i = Math.floor(step), fraction = smootherstep(step - i);
      const x = descentPoint(data, i) + (descentPoint(data, i + 1) - descentPoint(data, i)) * fraction;
      cursor.position.copy(v(curve(x)));
    });
    label('loss = x²', [-1.9, 1.35]); label('minimum', [0, -1.87]); label('smaller steps downhill', [1.3, .1]);
  } else if (type === 'transition') {
    dot([-2.2, 0], .09); dot([2, 1], .09); dot([2, -1.1], .06, .5);
    arrow([-1.9, .1], [1.8, .95], .75); arrow([-1.9, -.1], [1.8, -1.05], .35);
    label('robot at A', [-2.2, -.45]); label('goal B · +1', [2, 1.45]); label('still at A · 0', [2, -1.6]);
    label(`move right · ${data.success * 100}%`, [0, .9]); label(`${Math.round((1 - data.success) * 100)}%`, [.2, -.98]);
    const cursor = dot([-2.2, 0], .06);
    animations.push(p => cursor.position.set(-2.2 + 4.2 * p, p, 0));
  } else if (type === 'value-update') {
    const target = qTarget(data), updated = qUpdated(data), max = Math.max(target, updated, data.old, 1);
    const x = value => -2.5 + value / max * 5;
    const baseline = -.9;
    line([[-2.7, baseline], [2.8, baseline]], .25);
    dot([x(data.old), baseline], .05, .3); dot([x(target), baseline], .05, .45);
    const cursor = dot([x(data.old), baseline], .10), valueLabel = label(`Q = ${data.old}`, [x(data.old), -.3]);
    cursor.name = 'q-estimate';
    label(`old ${data.old}`, [x(data.old), -1.4]); label(`target ${target.toFixed(1)}`, [x(target), -1.4]);
    label(`learning rate α = ${data.rate}`, [0, -2]);
    arrow([-2.2, 1.15], [2.1, 1.15], .35);
    dot([-2.2, 1.15], .055, .45); dot([2.1, 1.15], .055, .45);
    const agent = dot([-2.2, 1.15], .09); agent.name = 'q-agent';
    label('state A', [-2.2, 1.65]); label(`B · best Q = ${data.next}`, [2.1, 1.65]);
    const action = label('try right →', [0, 1.65]);
    animations.push(p => {
      agent.position.x = -2.2 + 4.3 * smootherstep(Math.min(1, p / .45));
      const update = smootherstep(Math.max(0, (p - .45) / .55));
      const value = data.old + (updated - data.old) * update;
      cursor.position.x = x(value); valueLabel.position.x = x(value); valueLabel.text = `Q(A, right) = ${value.toFixed(1)}`;
      action.text = p < .45 ? 'try right →' : `observed reward +${data.reward}`;
    });
  } else if (type === 'feedback') {
    circle(1.55, [0, 0, 0], .35); dot([-1.55, 0], .08); dot([1.55, 0], .08);
    label('agent', [-2.3, 0]); label('environment', [2.35, 0]); label('action →', [0, 1.95]); label('← reward + observation', [0, -1.95]);
    const cursor = dot([-1.55, 0], .065);
    animations.push(p => { const angle = Math.PI - p * Math.PI * 2; cursor.position.set(Math.cos(angle) * 1.55, Math.sin(angle) * 1.55, 0); });
  } else if (type === 'horizon') {
    circle(data.radius, [0, 0, 0], .85);
    // A deliberately schematic curved sheet. This is not a gravity-force
    // diagram, embedding solution, or simulation of spacetime/light paths.
    const sheet = (radius, angle) => {
      const depth = .9 / Math.max(.4, radius);
      return [Math.cos(angle) * radius, Math.sin(angle) * radius * .55 - depth * .65, -.3 - depth];
    };
    [1.5, 1.85, 2.25, 2.7, 3.1].forEach(radius => line(Array.from({ length: 81 }, (_, i) => sheet(radius, i / 80 * Math.PI * 2)), .16));
    for (let spoke = 0; spoke < 16; spoke++) line(Array.from({ length: 41 }, (_, i) => sheet(.4 + i * .0675, spoke / 16 * Math.PI * 2)), .12);
    for (const angle of [.45, 2.4, 4.4]) {
      const at = r => [Math.cos(angle) * r, Math.sin(angle) * r];
      arrow(at(data.radius * .85), at(data.radius * .25), .55);
    }
    label('event horizon', [0, data.radius + .4]); label('inward only', [0, -.2]);
    label('curved-space analogy · not to scale', [0, -2.3]);
  } else if (type === 'derivative') {
    const curve = x => [x * 1.8 - 1.8, x * x * .65 - 1.4, 0];
    line(Array.from({ length: 81 }, (_, i) => curve(i / 40)), .6);
    const tangent = line([[-1, 0], [1, 0]], .85), cursor = dot(curve(data.at), .075);
    animations.push(p => {
      const x = .2 + (data.at - .2) * p, [cx, cy] = curve(x), slope = 2 * x * .65 / 1.8;
      tangent.geometry.attributes.position.setXYZ(0, cx - 1.15, cy - slope * 1.15, .02);
      tangent.geometry.attributes.position.setXYZ(1, cx + 1.15, cy + slope * 1.15, .02);
      tangent.geometry.attributes.position.needsUpdate = true; tangent.geometry.computeBoundingSphere(); cursor.position.set(cx, cy, .04);
    });
    label('f(x) = x²', [-1.6, 1.4]); label(`at x = ${data.at}, slope = ${2 * data.at}`, [.4, -1.95]);
  } else if (type === 'network') {
    const layers = data.layers.map((count, i) => Array.from({ length: count }, (_, j) => [(i - 1) * 2.15, (j - (count - 1) / 2) * 1.2, 0]));
    layers.slice(1).forEach((layer, i) => layers[i].forEach((a, j) => layer.forEach((b, k) => {
      const strength = .22 + ((j * 3 + k * 2 + i) % 5) * .1;
      const edge = line([a, b], strength); edge.name = 'weighted-connection';
      animations.push(p => { edge.material.userData.activation = .35 + .65 * Math.exp(-((p * 3 - i - .5) ** 2) * 8); });
    })));
    const neurons = layers.map(layer => layer.map(point => dot(point, .075, .65)));
    animations.push(p => neurons.forEach((layer, i) => layer.forEach(object => object.scale.setScalar(1 + .5 * Math.exp(-((p * 3 - i) ** 2) * 5)))));
    label('inputs', [-2.15, -1.95]); label('mix + activate', [0, -1.95]); label('prediction', [2.15, -1.95]);
  }
  return { group, labels,
    update(time, opacity, reduced = false) {
      const progress = reduced ? 1 : smootherstep(Math.min(1, time / 7));
      animations.forEach(animate => animate(progress));
      materials.forEach(item => { item.material.opacity = item.base * opacity * (item.material.userData.activation ?? 1); });
      group.visible = opacity > .003;
    },
    dispose() { group.removeFromParent(); geometries.forEach(geometry => geometry.dispose()); materials.forEach(item => item.material.dispose()); },
  };
}
