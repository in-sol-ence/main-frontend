export const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
export const smootherstep = x => { const t = clamp(x, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };

// Critically damped spring. Analytic integration avoids frame-rate-dependent
// acceleration; velocity and acceleration stay smooth as desired speed changes.
export function dampSpring(value, velocity, target, response, dt) {
  const offset = value - target;
  const decay = Math.exp(-response * dt);
  const auxiliary = velocity + response * offset;
  return {
    value: target + (offset + auxiliary * dt) * decay,
    velocity: (velocity - response * auxiliary * dt) * decay,
  };
}

// Wheel units are browser/device dependent. Preserve fine trackpad deltas,
// normalize line/page wheels, and bound unusually large single events.
export function wheelPixels(delta, mode = 0, viewport = 720) {
  return clamp(delta * (mode === 1 ? 16 : mode === 2 ? viewport : 1), -240, 240);
}

// Path-independent progress, in arc-length units. Input only changes a target;
// an analytic critically damped spring provides controllable, reversible glide.
export class ScrollTravel {
  constructor() { this.active = false; this.position = 0; this.target = 0; this.velocity = 0; }
  begin(position) { this.active = true; this.position = this.target = position; this.velocity = 0; }
  move(delta, min, max) {
    this.min = min; this.max = max;
    // Limit queued travel: a fast gesture must not keep flying after release.
    this.target = clamp(this.target + delta, Math.max(min, this.position - 42), Math.min(max, this.position + 42));
  }
  update(dt) {
    const next = dampSpring(this.position, this.velocity, this.target, 9, clamp(dt, 0, .05));
    this.position = clamp(next.value, this.min ?? -Infinity, this.max ?? Infinity);
    this.velocity = this.position === next.value ? next.velocity : 0;
    return this.position;
  }
  release() { this.active = false; this.velocity = 0; }
}

export class Journey {
  constructor({ startDistance = 35, cruiseSpeed = 2.6, speedAt = () => 1 } = {}) {
    this.startDistance = startDistance;
    this.cruiseSpeed = cruiseSpeed;
    this.speedAt = speedAt;
    this.reset();
  }
  reset() { this.distance = this.startDistance; this.speed = 0; this.acceleration = 0; this.time = 0; this.scroll = new ScrollTravel(); }
  takeControl(delta, min, max) {
    if (!this.scroll.active) this.scroll.begin(this.distance);
    this.scroll.move(delta, min, max);
    this.speed = 0; this.acceleration = 0;
  }
  resume() { this.scroll.release(); this.speed = 0; this.acceleration = 0; this.time = 0; }
  update(dt, paused = false) {
    if (this.scroll.active) { this.distance = this.scroll.update(dt); return this.distance; }
    if (paused) return this.distance;
    dt = clamp(dt, 0, .05);
    this.time += dt;
    const target = this.cruiseSpeed * clamp(this.speedAt(this.distance), 0, 1.5) * smootherstep(this.time / 5);
    const next = dampSpring(this.speed, this.acceleration, target, 1.6, dt);
    this.distance += (this.speed + next.value) * .5 * dt;
    this.speed = next.value; this.acceleration = next.velocity;
    return this.distance;
  }
}
