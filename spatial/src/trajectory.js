// One C2-continuous cubic B-spline, repeated longitudinally. No visible join,
// closed loop, or camera reset: x/y repeat while forward distance stays unbounded.
export const SPACING = 28;
export const CONTROL_POINTS = [
  [-16, 1], [14, 5], [31, -1], [8, -3], [-24, 4], [-32, 8],
  [-3, 2], [27, -4], [18, -2], [-19, 3], [-31, 6], [-12, 1],
];
export const PERIOD = SPACING * CONTROL_POINTS.length;
const wrap = (value, size) => ((value % size) + size) % size;

export function pointAt(station, out = { x: 0, y: 0, z: 0 }) {
  const cell = Math.floor(station / SPACING);
  const t = station / SPACING - cell;
  const t2 = t * t, t3 = t2 * t;
  const weights = [(1 - t) ** 3 / 6, (3 * t3 - 6 * t2 + 4) / 6,
    (-3 * t3 + 3 * t2 + 3 * t + 1) / 6, t3 / 6];
  out.x = 0; out.y = 0; out.z = -station;
  for (let i = 0; i < 4; i++) {
    const p = CONTROL_POINTS[wrap(cell + i - 1, CONTROL_POINTS.length)];
    out.x += weights[i] * p[0]; out.y += weights[i] * p[1] * 1.6;
  }
  return out;
}

export function tangentAt(station, out = { x: 0, y: 0, z: 0 }) {
  const cell = Math.floor(station / SPACING);
  const t = station / SPACING - cell;
  const weights = [-.5 * (1 - t) ** 2, 1.5 * t * t - 2 * t,
    -1.5 * t * t + t + .5, .5 * t * t];
  out.x = 0; out.y = 0; out.z = -1;
  for (let i = 0; i < 4; i++) {
    const p = CONTROL_POINTS[wrap(cell + i - 1, CONTROL_POINTS.length)];
    out.x += weights[i] * p[0] / SPACING; out.y += weights[i] * p[1] * 1.6 / SPACING;
  }
  const magnitude = Math.hypot(out.x, out.y, out.z);
  out.x /= magnitude; out.y /= magnitude; out.z /= magnitude;
  return out;
}

// Arc-length lookup separates speed (world units / second) from spline parameter.
// Later concept stop/slow zones can change speed without changing the geometry.
export function createArcTable(steps = 4096) {
  const lengths = new Float64Array(steps + 1);
  let previous = pointAt(0);
  for (let i = 1; i <= steps; i++) {
    const p = pointAt(i * PERIOD / steps);
    lengths[i] = lengths[i - 1] + Math.hypot(p.x - previous.x, p.y - previous.y, p.z - previous.z);
    previous = p;
  }
  const length = lengths[steps];
  function stationAtDistance(distance) {
    const cycle = Math.floor(distance / length);
    const local = distance - cycle * length;
    let low = 0, high = steps;
    while (high - low > 1) {
      const mid = (low + high) >> 1;
      if (lengths[mid] < local) low = mid; else high = mid;
    }
    const fraction = (local - lengths[low]) / (lengths[high] - lengths[low]);
    return cycle * PERIOD + (low + fraction) * PERIOD / steps;
  }
  return { length, stationAtDistance };
}
